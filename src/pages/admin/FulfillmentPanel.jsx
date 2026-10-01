import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RiCheckLine,
  RiLinksLine,
  RiRefreshLine,
  RiTruckLine,
} from '@remixicon/react';

import AdminModal from './Modal';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/States';

const PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  ['', 'All fulfillment orders'],
  ['paid', 'Ready for dispatch'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
];

const normalize = (value) =>
  typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';

const text = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : String(value);

const statusLabel = (status) => {
  const labels = {
    paid: 'Ready for dispatch',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
  };

  return labels[normalize(status)] || text(status).replaceAll('_', ' ');
};

const statusTone = (status) => {
  switch (normalize(status)) {
    case 'delivered':
      return 'pill-success';
    case 'shipped':
      return 'pill-gold';
    case 'processing':
      return 'pill-gold';
    case 'paid':
      return 'pill-muted';
    default:
      return 'pill-muted';
  }
};

const nextAction = (order) => {
  switch (normalize(order?.status)) {
    case 'paid':
      return 'Start processing';
    case 'processing':
      return 'Mark shipped';
    case 'shipped':
      return 'Mark delivered';
    default:
      return '';
  }
};

const isFulfillmentOrder = (order) =>
  ['paid', 'processing', 'shipped', 'delivered'].includes(
    normalize(order?.status),
  );

const getTrackingNumber = (order, shipment) =>
  text(order?.tracking_number || shipment?.tracking_number);

export default function FulfillmentPanel() {
  const { toast } = useToast();

  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

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
      const [shipmentResponse, orderResponse] = await Promise.all([
        adminService.fulfillmentShipments(),
        adminService.listOrders({
          page: 1,
          page_size: PAGE_SIZE,
        }),
      ]);

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const shipments = itemsOfList(shipmentResponse);
      const orders = itemsOfList(orderResponse).filter(isFulfillmentOrder);

      const shipmentsByOrder = new Map(
        shipments
          .filter((shipment) => shipment?.order_id)
          .map((shipment) => [
            String(shipment.order_id),
            shipment,
          ]),
      );

      const merged = orders
        .map((order) => ({
          order,
          shipment: shipmentsByOrder.get(String(order.id)) || null,
        }))
        .filter(({ order }) =>
          filter
            ? normalize(order.status) === normalize(filter)
            : true,
        );

      setRows(merged);
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setRows([]);
      toast.error(
        error?.message || 'Unable to load fulfillment orders.',
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

  const runOrderUpdate = useCallback(
    async (order, data, successMessage) => {
      const orderNumber = order?.order_number;

      if (!orderNumber || busy) return;

      const actionKey = `${orderNumber}:${data?.status || 'tracking'}`;
      setBusy(actionKey);

      try {
        await adminService.updateOrder(orderNumber, data);
        toast.success(successMessage);
        await load();
      } catch (error) {
        toast.error(
          error?.message || 'Unable to update the order.',
        );
      } finally {
        if (mountedRef.current) {
          setBusy('');
        }
      }
    },
    [busy, load, toast],
  );

  const createInternalShipment = useCallback(
    async (order) => {
      if (!order?.id || busy) return;

      const actionKey = `${order.id}:shipment`;
      setBusy(actionKey);

      try {
        await adminService.createProviderShipment(order.id, {});
        toast.success('Internal manual shipment record created.');
        await load();
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to create the internal shipment record.',
        );
      } finally {
        if (mountedRef.current) {
          setBusy('');
        }
      }
    },
    [busy, load, toast],
  );

  const openTrackingEditor = useCallback((order) => {
    setTrackingOrder(order);
    setTrackingNumber(
      typeof order?.tracking_number === 'string'
        ? order.tracking_number
        : '',
    );
  }, []);

  const closeTrackingEditor = useCallback(() => {
    if (busy) return;
    setTrackingOrder(null);
    setTrackingNumber('');
  }, [busy]);

  const saveTracking = useCallback(
    async (event) => {
      event.preventDefault();

      if (!trackingOrder?.order_number || busy) return;

      const normalizedTracking = trackingNumber.trim();

      if (!normalizedTracking) {
        toast.error('Enter a tracking number.');
        return;
      }

      const actionKey = `${trackingOrder.order_number}:tracking`;
      setBusy(actionKey);

      try {
        const payload = {
          tracking_number: normalizedTracking,
        };

        const processingOrder =
          normalize(trackingOrder.status) === 'processing';

        if (processingOrder) {
          payload.status = 'shipped';
        }

        await adminService.updateOrder(
          trackingOrder.order_number,
          payload,
        );

        if (!mountedRef.current) return;

        toast.success(
          processingOrder
            ? 'Tracking saved and order marked shipped.'
            : 'Tracking number updated.',
        );
        setTrackingOrder(null);
        setTrackingNumber('');
        await load();
      } catch (error) {
        if (mountedRef.current) {
          toast.error(
            error?.message || 'Unable to update tracking number.',
          );
        }
      } finally {
        if (mountedRef.current) {
          setBusy('');
        }
      }
    },
    [busy, load, toast, trackingNumber, trackingOrder],
  );

  const counts = useMemo(() => {
    const source = rows || [];

    return {
      ready: source.filter(
        ({ order }) => normalize(order?.status) === 'paid',
      ).length,
      processing: source.filter(
        ({ order }) => normalize(order?.status) === 'processing',
      ).length,
      shipped: source.filter(
        ({ order }) => normalize(order?.status) === 'shipped',
      ).length,
      delivered: source.filter(
        ({ order }) => normalize(order?.status) === 'delivered',
      ).length,
    };
  }, [rows]);

  if (rows === null) {
    return (
      <div className="admin-panel">
        <Spinner label="Loading fulfillment…" />
      </div>
    );
  }

  return (
    <section className="admin-panel min-w-0" aria-labelledby="fulfillment-title">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="admin-stat min-w-0">
          <div className="stat-label">Ready for dispatch</div>
          <div className="stat-value tabular-nums">{counts.ready}</div>
        </article>

        <article className="admin-stat min-w-0">
          <div className="stat-label">Processing</div>
          <div className="stat-value tabular-nums">{counts.processing}</div>
        </article>

        <article className="admin-stat min-w-0">
          <div className="stat-label">Shipped</div>
          <div className="stat-value tabular-nums">{counts.shipped}</div>
        </article>

        <article className="admin-stat min-w-0">
          <div className="stat-label">Delivered</div>
          <div className="stat-value tabular-nums">{counts.delivered}</div>
        </article>
      </div>

      <div className="admin-card mt-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 id="fulfillment-title" className="min-w-0">
                Manual fulfillment
              </h2>
              <span className="admin-pill pill-gold">Manual shipping</span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Manage the real Luviio dispatch lifecycle here. Courier
              selection, AWB assignment, pickup scheduling, labels and
              provider webhooks are not used in manual shipping mode.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <label className="min-w-0 sm:min-w-[210px]">
              <span className="sr-only">Filter fulfillment orders</span>
              <select
                className="admin-select w-full"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value || 'all'} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn btn-quiet btn-sm shrink-0"
              onClick={load}
              disabled={refreshing}
            >
              <RiRefreshLine
                size={16}
                className={refreshing ? 'spin' : undefined}
                aria-hidden="true"
              />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line-soft bg-surface-2 px-4 py-3 text-sm leading-6 text-muted">
          <strong className="font-semibold text-text">
            Workflow:
          </strong>{' '}
          Ready for dispatch → Processing → Shipped → Delivered.
          Tracking is recorded on the order and remains the source of truth
          for dispatch status.
        </div>
      </div>

      <div className="admin-table-wrap mt-5">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[980px]">
            <caption className="sr-only">
              Manual fulfillment orders
            </caption>

            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Destination</th>
                <th scope="col">Tracking</th>
                <th scope="col">Status</th>
                <th scope="col">Shipment record</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(({ order, shipment }) => {
                  const orderNumber = order?.order_number;
                  const status = normalize(order?.status);
                  const tracking = getTrackingNumber(order, shipment);
                  const rowKey = String(order?.id || orderNumber);
                  const rowBusy =
                    typeof busy === 'string' &&
                    (busy.startsWith(`${orderNumber}:`) ||
                      busy.startsWith(`${order?.id}:`));

                  const action = nextAction(order);

                  return (
                    <tr key={rowKey}>
                      <td className="td-gold whitespace-nowrap">
                        #{text(orderNumber)}
                      </td>

                      <td>
                        <div className="font-medium text-text">
                          {text(order?.shipping_name)}
                        </div>
                        <div className="td-dim mt-1">
                          {text(order?.email || order?.users?.email)}
                        </div>
                      </td>

                      <td>
                        <div>{text(order?.shipping_city)}</div>
                        <div className="td-dim mt-1">
                          {text(order?.shipping_postal_code)}
                        </div>
                      </td>

                      <td className="max-w-[220px]">
                        <div className="break-all font-mono text-xs">
                          {tracking}
                        </div>

                        {tracking !== '—' && (
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm mt-2"
                            onClick={() => openTrackingEditor(order)}
                            disabled={rowBusy}
                          >
                            Edit tracking
                          </button>
                        )}
                      </td>

                      <td>
                        <span className={`admin-pill ${statusTone(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </td>

                      <td>
                        {shipment ? (
                          <span className="admin-pill pill-success">
                            Created
                          </span>
                        ) : (
                          <span className="admin-pill pill-muted">
                            Not created
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          {status === 'paid' && !shipment && (
                            <button
                              type="button"
                              className="btn btn-quiet btn-sm"
                              disabled={Boolean(busy)}
                              onClick={() => createInternalShipment(order)}
                            >
                              <RiTruckLine size={14} aria-hidden="true" />
                              {busy === `${order?.id}:shipment`
                                ? 'Creating…'
                                : 'Create shipment'}
                            </button>
                          )}

                          {status === 'paid' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={rowBusy || !shipment}
                              onClick={() =>
                                runOrderUpdate(
                                  order,
                                  { status: 'processing' },
                                  'Order moved to processing.',
                                )
                              }
                            >
                              {busy === `${orderNumber}:processing`
                                ? 'Updating…'
                                : 'Start processing'}
                            </button>
                          )}

                          {status === 'processing' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={rowBusy}
                              onClick={() => openTrackingEditor(order)}
                            >
                              <RiTruckLine size={14} aria-hidden="true" />
                              {tracking !== '—'
                                ? 'Mark shipped'
                                : 'Add tracking & ship'}
                            </button>
                          )}

                          {status === 'shipped' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={rowBusy}
                              onClick={() =>
                                runOrderUpdate(
                                  order,
                                  { status: 'delivered' },
                                  'Order marked delivered.',
                                )
                              }
                            >
                              <RiCheckLine size={14} aria-hidden="true" />
                              {busy === `${orderNumber}:delivered`
                                ? 'Updating…'
                                : 'Mark delivered'}
                            </button>
                          )}

                          {status === 'shipped' && (
                            <button
                              type="button"
                              className="btn btn-quiet btn-sm"
                              disabled={rowBusy}
                              onClick={() => openTrackingEditor(order)}
                            >
                              Update tracking
                            </button>
                          )}

                          {action && (
                            <span className="sr-only">
                              Next action: {action}
                            </span>
                          )}

                          {tracking !== '—' && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted">
                              <RiLinksLine size={13} aria-hidden="true" />
                              Tracking recorded
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="admin-empty px-4 py-10 text-center">
                      {filter
                        ? `No ${statusLabel(filter).toLowerCase()} orders found.`
                        : 'No orders are currently in the fulfillment queue.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {trackingOrder && (
        <AdminModal
          title={
            normalize(trackingOrder.status) === 'processing'
              ? 'Ship order'
              : 'Update tracking'
          }
          sub={
            normalize(trackingOrder.status) === 'processing'
              ? 'Enter the tracking reference supplied by your actual courier/local delivery service.'
              : 'Tracking is stored on the order and is not queried from an external courier provider.'
          }
          onClose={closeTrackingEditor}
        >
          <form onSubmit={saveTracking} noValidate>
            <div className="field">
              <label htmlFor="fulfillment-tracking-number">
                Tracking number
              </label>
              <input
                id="fulfillment-tracking-number"
                value={trackingNumber}
                onChange={(event) =>
                  setTrackingNumber(event.target.value)
                }
                maxLength={100}
                autoComplete="off"
                autoFocus
                placeholder="Enter tracking / delivery reference"
              />
              <small>
                {normalize(trackingOrder.status) === 'processing'
                  ? 'Saving this form will record the tracking number and move the order to Shipped.'
                  : 'Use the same reference customers receive for delivery tracking.'}
              </small>
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-quiet"
                onClick={closeTrackingEditor}
                disabled={Boolean(busy)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn"
                disabled={Boolean(busy)}
              >
                <RiTruckLine size={16} aria-hidden="true" />
                {busy ? 'Saving…' : 'Save & ship'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </section>
  );
}
