import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RiLinksLine,
  RiRefreshLine,
  RiTruckLine,
} from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/States';

const SHIPMENT_PAGE_SIZE = 100;

const text = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : String(value);

const normalizeStatus = (status) =>
  typeof status === 'string'
    ? status.trim().toLowerCase()
    : '';

const statusTone = (status) => {
  const value = normalizeStatus(status);

  if (
    [
      'delivered',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'shipped',
    ].includes(value)
  ) {
    return 'pill-success';
  }

  if (
    [
      'failed',
      'cancelled',
      'rto',
      'rto_delivered',
    ].includes(value)
  ) {
    return 'pill-danger';
  }

  if (
    [
      'ready_to_create',
      'created',
      'awb_assigned',
      'pickup_scheduled',
      'manifest_generated',
      'label_generated',
      'invoice_generated',
      'documents_ready',
    ].includes(value)
  ) {
    return 'pill-gold';
  }

  return 'pill-muted';
};

const workflowLabel = (row) => {
  const step = normalizeStatus(
    row?.workflow_status ||
      row?.metadata?.workflow?.step ||
      row?.status,
  );

  const labels = {
    ready_to_create: 'Ready to create',
    created: 'Created',
    awb_assigned: 'AWB assigned',
    pickup_scheduled: 'Pickup scheduled',
    label_generated: 'Label generated',
    manifest_generated: 'Manifest generated',
    invoice_generated: 'Invoice generated',
    documents_ready: 'Documents ready',
    out_for_delivery: 'Out for delivery',
    in_transit: 'In transit',
    picked_up: 'Picked up',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    failed: 'Failed',
    rto: 'RTO',
    rto_delivered: 'RTO delivered',
  };

  return (
    labels[step] ||
    text(row?.status || 'created').replaceAll('_', ' ')
  );
};

const documentLinks = (row) =>
  [
    ['Label', row?.label_url],
    ['Manifest', row?.manifest_url],
    ['Invoice', row?.provider_invoice_url],
  ].filter(([, url]) => Boolean(url));

const nextWorkflowStep = (row) => {
  const status = normalizeStatus(row?.status);

  if (status === 'ready_to_create') {
    return 'Create shipment';
  }

  if (!row?.tracking_number) {
    return 'Assign AWB';
  }

  if (!row?.pickup_id) {
    return 'Schedule pickup';
  }

  if (!row?.manifest_url) {
    return 'Generate manifest';
  }

  if (!row?.label_url) {
    return 'Generate label';
  }

  if (!row?.provider_invoice_url) {
    return 'Generate invoice';
  }

  if (row?.metadata?.workflow?.completed === true) {
    return 'Complete';
  }

  return 'Resume workflow';
};

const isTerminalStatus = (status) =>
  [
    'delivered',
    'cancelled',
    'refunded',
  ].includes(normalizeStatus(status));

const isWorkflowComplete = (row) =>
  row?.metadata?.workflow?.completed === true ||
  normalizeStatus(row?.workflow_status) === 'delivered';

export default function FulfillmentPanel() {
  const { toast } = useToast();

  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setRefreshing(true);

    try {
      const [shipmentResponse, orderResponse] =
        await Promise.all([
          adminService.fulfillmentShipments(filter || null),
          adminService.listOrders({
            page: 1,
            page_size: SHIPMENT_PAGE_SIZE,
          }),
        ]);

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const shipments = itemsOfList(shipmentResponse);
      const orders = itemsOfList(orderResponse);

      const shippedOrderIds = new Set(
        shipments
          .map((shipment) =>
            String(
              shipment?.order_id ||
                shipment?.orders?.id ||
                '',
            ),
          )
          .filter(Boolean),
      );

      /*
       * Paid/processing/COD orders may not have a shipment row
       * until the provider booking is created.
       *
       * Backend remains the source of truth for shipment creation
       * and package details.
       */
      const eligibleOrders = orders.filter((order) => {
        const status = normalizeStatus(order?.status);
        const method = normalizeStatus(
          order?.payment_method,
        );

        if (!order?.id) return false;

        if (shippedOrderIds.has(String(order.id))) {
          return false;
        }

        if (
          [
            'cancelled',
            'refunded',
            'delivered',
            'shipped',
          ].includes(status)
        ) {
          return false;
        }

        return (
          ['paid', 'processing'].includes(status) ||
          ['cod', 'cash_on_delivery'].includes(method)
        );
      });

      const pendingRows =
        !filter || filter === 'ready_to_create'
          ? eligibleOrders.map((order) => ({
              id: `order:${String(order.id)}`,
              order_id: order.id,
              status: 'ready_to_create',
              provider_key: 'shiprocket',
              courier_name: null,
              service_type: null,
              tracking_number: null,
              tracking_url: null,
              pickup_id: null,
              label_url: null,
              manifest_url: null,
              provider_invoice_url: null,
              orders: order,
            }))
          : [];

      setRows([...pendingRows, ...shipments]);
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setRows([]);
      toast.error(
        error?.message ||
          'Unable to load fulfillment shipments.',
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setRefreshing(false);
      }
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = useCallback(
    async (id, method, successMessage) => {
      if (!id || !method || busy) return;

      const actionKey = `${id}:${method}`;

      setBusy(actionKey);

      try {
        await adminService[method](id);

        toast.success(successMessage);
        await load();
      } catch (error) {
        toast.error(
          error?.message ||
            'Fulfillment action failed.',
        );
      } finally {
        if (mountedRef.current) {
          setBusy('');
        }
      }
    },
    [busy, load, toast],
  );

  const processShipment = useCallback(
    async (row) => {
      if (!row?.id || busy) return;

      const actionKey = `${row.id}:process`;

      setBusy(actionKey);

      try {
        await adminService.processProviderShipment(
          row.id,
        );

        toast.success(
          'Shipment workflow processed/resumed successfully.',
        );

        await load();
      } catch (error) {
        toast.error(
          error?.message ||
            'Shipment workflow could not be completed.',
        );
      } finally {
        if (mountedRef.current) {
          setBusy('');
        }
      }
    },
    [busy, load, toast],
  );

  const createShipment = useCallback(
    async (order) => {
      const orderId = order?.id;

      if (!orderId || busy) return;

      const actionKey = `${orderId}:create`;

      setBusy(actionKey);

      try {
        /*
         * Do not calculate weight, dimensions, pickup location,
         * shipping price, GST or other provider data here.
         * Backend derives the shipment payload.
         */
        await adminService.createProviderShipment(
          orderId,
          {},
        );

        toast.success(
          'Courier shipment created with server-derived package details.',
        );

        await load();
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to create courier shipment.',
        );
      } finally {
        if (mountedRef.current) {
          setBusy('');
        }
      }
    },
    [busy, load, toast],
  );

  if (rows === null) {
    return (
      <div className="admin-panel fulfillment-loading">
        <Spinner label="Loading fulfillment…" />
      </div>
    );
  }

  const readyCount = rows.filter(
    (row) =>
      normalizeStatus(row?.status) ===
      'ready_to_create',
  ).length;

  const activeCount = rows.filter((row) => {
    const status = normalizeStatus(row?.status);

    return (
      status !== 'ready_to_create' &&
      !isTerminalStatus(status)
    );
  }).length;

  const deliveredCount = rows.filter(
    (row) =>
      normalizeStatus(row?.status) === 'delivered',
  ).length;

  return (
    <section className="admin-panel fulfillment-panel">
      <div
        className="admin-stats fulfillment-stats"
        aria-label="Fulfillment statistics"
      >
        <article className="admin-stat">
          <div className="stat-label">
            Ready to create
          </div>
          <div className="stat-value">
            {readyCount}
          </div>
        </article>

        <article className="admin-stat">
          <div className="stat-label">
            Active shipments
          </div>
          <div className="stat-value">
            {activeCount}
          </div>
        </article>

        <article className="admin-stat">
          <div className="stat-label">Delivered</div>
          <div className="stat-value">
            {deliveredCount}
          </div>
        </article>
      </div>

      <div className="admin-card fulfillment-header-card">
        <div className="admin-toolbar fulfillment-toolbar">
          <div className="fulfillment-heading">
            <div className="fulfillment-title-row">
              <h2>Courier fulfillment</h2>

              <span className="admin-pill pill-gold">
                Shiprocket · Sandbox
              </span>
            </div>

            <p>
              Manage shipment creation, AWB, pickup,
              documents and tracking from one place.
              Provider events remain the source of truth
              for shipped and delivered status.
            </p>
          </div>

          <div className="fulfillment-actions">
            <label
              className="fulfillment-filter"
              htmlFor="fulfillment-status-filter"
            >
              <span className="sr-only">
                Filter shipments by status
              </span>

              <select
                id="fulfillment-status-filter"
                className="admin-select"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              >
                <option value="">
                  All shipments
                </option>
                <option value="ready_to_create">
                  Ready to create
                </option>
                <option value="created">
                  Created
                </option>
                <option value="awb_assigned">
                  AWB assigned
                </option>
                <option value="pickup_scheduled">
                  Pickup scheduled
                </option>
                <option value="out_for_delivery">
                  Out for delivery
                </option>
                <option value="in_transit">
                  In transit
                </option>
                <option value="shipped">
                  Shipped
                </option>
                <option value="delivered">
                  Delivered
                </option>
              </select>
            </label>

            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={load}
              disabled={refreshing}
              aria-label={
                refreshing
                  ? 'Refreshing fulfillment'
                  : 'Refresh fulfillment'
              }
            >
              <RiRefreshLine
                size={16}
                className={
                  refreshing
                    ? 'fulfillment-refresh-icon spin'
                    : ''
                }
                aria-hidden="true"
              />

              <span>
                {refreshing
                  ? 'Refreshing…'
                  : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap fulfillment-table-wrap">
        <div className="fulfillment-table-scroll">
          <table className="admin-table fulfillment-table">
            <caption className="sr-only">
              Courier fulfillment shipments
            </caption>

            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">
                  Courier / service
                </th>
                <th scope="col">AWB</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const order = row?.orders || {};
                  const status = normalizeStatus(
                    row?.status,
                  );

                  const rowBusy =
                    typeof busy === 'string' &&
                    busy.startsWith(
                      `${row.id}:`,
                    );

                  const completed =
                    isWorkflowComplete(row);

                  const documents =
                    documentLinks(row);

                  const canProcess =
                    status !== 'ready_to_create' &&
                    !completed;

                  return (
                    <tr key={row.id}>
                      <td className="td-gold fulfillment-order-cell">
                        #{text(order.order_number)}
                      </td>

                      <td>
                        <div className="fulfillment-customer">
                          {text(order.shipping_name)}
                        </div>

                        <span className="td-dim">
                          {text(order.shipping_city)}
                          {' · '}
                          {text(
                            order.shipping_postal_code,
                          )}
                        </span>
                      </td>

                      <td>
                        <div>
                          {text(row.courier_name)}
                        </div>

                        <span className="td-dim">
                          {text(row.service_type)}
                        </span>
                      </td>

                      <td className="fulfillment-awb">
                        {text(
                          row.tracking_number,
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-pill ${statusTone(
                            row.status,
                          )}`}
                        >
                          {workflowLabel(row)}
                        </span>

                        {status !==
                          'ready_to_create' &&
                          !completed &&
                          row?.workflow_status !==
                            'documents_ready' &&
                          row?.workflow_status !==
                            'delivered' && (
                            <div className="td-dim fulfillment-next-step">
                              Next:{' '}
                              {nextWorkflowStep(
                                row,
                              )}
                            </div>
                          )}
                      </td>

                      <td>
                        <div className="fulfillment-action-row">
                          {canProcess && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={Boolean(
                                rowBusy,
                              )}
                              onClick={() =>
                                processShipment(row)
                              }
                            >
                              <RiTruckLine
                                size={14}
                                aria-hidden="true"
                              />

                              <span>
                                {busy ===
                                `${row.id}:process`
                                  ? 'Processing…'
                                  : `Continue: ${nextWorkflowStep(
                                      row,
                                    )}`}
                              </span>
                            </button>
                          )}

                          {row.tracking_number && (
                            <button
                              type="button"
                              className="btn btn-quiet btn-sm"
                              disabled={Boolean(
                                rowBusy,
                              )}
                              onClick={() =>
                                runAction(
                                  row.id,
                                  'syncTracking',
                                  'Tracking synchronized.',
                                )
                              }
                            >
                              Sync
                            </button>
                          )}

                          {row.tracking_url && (
                            <a
                              className="btn btn-quiet btn-sm"
                              href={
                                row.tracking_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <RiLinksLine
                                size={14}
                                aria-hidden="true"
                              />
                              <span>Track</span>
                            </a>
                          )}
                        </div>

                        {documents.length > 0 && (
                          <div className="fulfillment-document-row">
                            {documents.map(
                              ([label, url]) => (
                                <a
                                  key={label}
                                  className="btn btn-quiet btn-sm"
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <RiLinksLine
                                    size={14}
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {label}
                                  </span>
                                </a>
                              ),
                            )}
                          </div>
                        )}

                        {status ===
                          'ready_to_create' && (
                          <div className="admin-page-note fulfillment-auto-note">
                            <div className="fulfillment-auto-note-copy">
                              <RiTruckLine
                                size={15}
                                aria-hidden="true"
                              />

                              <span>
                                Pickup location, order
                                weight and fallback
                                parcel dimensions are
                                filled server-side from
                                the order/product data
                                and Shiprocket
                                configuration.
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={Boolean(
                                busy,
                              )}
                              onClick={() =>
                                createShipment(
                                  order,
                                )
                              }
                            >
                              {busy ===
                              `${order.id}:create`
                                ? 'Creating…'
                                : 'Create Shiprocket shipment'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty">
                      {filter
                        ? `No shipments match “${filter.replaceAll(
                            '_',
                            ' ',
                          )}”.`
                        : 'No provider shipments yet.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}