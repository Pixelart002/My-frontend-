import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RiEditLine,
  RiMapPin2Line,
  RiRefreshLine,
} from '@remixicon/react';

import { adminService, itemsOfList } from '../../services/admin';
import { formatMoney } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { ErrorState, Spinner } from '../../components/ui/States';
import AdminModal from './Modal';
import { StatusPill } from './DashboardPanel';

const PAGE_SIZE = 100;

const STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const displayOrderNumber = (order) => {
  const value = String(
    order?.order_number ?? ''
  ).trim();

  if (!value) return '—';

  return value.startsWith('#')
    ? value
    : `#${value}`;
};

const text = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  return String(value);
};

const dateTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? text(value)
    : date.toLocaleString('en-IN');
};

const money = (value, currency) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  const formatted = formatMoney(amount);
  const code = String(currency ?? '').trim();

  return code
    ? `${formatted} ${code.toUpperCase()}`
    : formatted;
};

const address = (order, prefix) => {
  const parts = [
    order?.[`${prefix}_line1`],
    order?.[`${prefix}_line2`],
    order?.[`${prefix}_landmark`],
    order?.[`${prefix}_city`],
    order?.[`${prefix}_state`],
    order?.[`${prefix}_postal_code`],
    order?.[`${prefix}_country`],
  ].filter(Boolean);

  return parts.length
    ? parts.join(', ')
    : '—';
};

const itemSummary = (order) => {
  if (
    !Array.isArray(order?.order_items) ||
    order.order_items.length === 0
  ) {
    return '—';
  }

  return order.order_items
    .map(
      (item) =>
        `${text(
          item?.name ?? item?.product_name
        )} × ${text(item?.quantity)}`
    )
    .join(' | ');
};

const columns = [
  {
    key: 'order_number',
    label: 'Order',
    render: (order) =>
      displayOrderNumber(order),
    className: 'td-gold',
  },
  {
    key: 'customer',
    label: 'Customer',
    render: (order) =>
      text(
        order?.users?.full_name ??
          order?.shipping_name ??
          order?.billing_name
      ),
  },
  {
    key: 'items',
    label: 'Items',
    render: (order) =>
      itemSummary(order),
  },
  {
    key: 'status',
    label: 'Status',
    render: (order) => (
      <StatusPill status={order?.status} />
    ),
  },
  {
    key: 'payment_method',
    label: 'Payment',
    render: (order) =>
      text(order?.payment_method),
  },
  {
    key: 'total_amount',
    label: 'Total',
    render: (order) =>
      money(
        order?.total_amount,
        order?.currency
      ),
    className: 'td-gold',
  },
  {
    key: 'invoice_number',
    label: 'Invoice',
    render: (order) =>
      text(order?.invoice_number),
  },
  {
    key: 'tracking_number',
    label: 'Tracking',
    render: (order) =>
      text(order?.tracking_number),
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (order) =>
      dateTime(order?.created_at),
  },
];

export default function OrdersPanel({
  capabilities = {},
}) {
  const canUpdate =
    capabilities.orderUpdate === true;

  const { toast } = useToast();

  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId =
      ++requestIdRef.current;

    setLoading(true);
    setError('');

    try {
      const result =
        await adminService.listOrders({
          page: 1,
          page_size: PAGE_SIZE,
        });

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setItems(itemsOfList(result));
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        err?.message ||
          'Unable to load orders.'
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];

    if (!filter) {
      return items;
    }

    return items.filter(
      (order) =>
        String(order?.status ?? '')
          .trim()
          .toLowerCase() ===
        filter.toLowerCase()
    );
  }, [items, filter]);

  const openEdit = useCallback(
    (order) => {
      if (
        !canUpdate ||
        !order?.order_number
      ) {
        return;
      }

      setEditing(order);
      setStatus(order?.status ?? '');
      setTracking(
        order?.tracking_number ?? ''
      );
      setNotes(order?.notes ?? '');
    },
    [canUpdate]
  );

  const closeEdit = useCallback(() => {
    if (saving) return;

    setEditing(null);
    setStatus('');
    setTracking('');
    setNotes('');
  }, [saving]);

  const save = async (event) => {
    event.preventDefault();

    if (!canUpdate || saving) {
      return;
    }

    const orderNumber = String(
      editing?.order_number ?? ''
    ).trim();

    if (!orderNumber) {
      toast.error(
        'This order has no customer-facing order number.'
      );
      return;
    }

    setSaving(true);

    try {
      await adminService.updateOrder(
        orderNumber,
        {
          status:
            status.trim() || undefined,
          tracking_number:
            tracking.trim() || null,
          notes:
            notes.trim() || undefined,
        }
      );

      toast.success('Order updated.');

      setEditing(null);
      setStatus('');
      setTracking('');
      setNotes('');

      await load();
    } catch (err) {
      toast.error(
        err?.message ||
          'Unable to update order.'
      );
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  if (items === null) {
    return (
      <Spinner label="Loading orders…" />
    );
  }

  return (
    <div className="orders-admin-full">
      <div className="admin-head">
        <div>
          <h1>Orders</h1>

          <p className="admin-sub">
            {filtered.length} of {items.length}{' '}
            shown · essential order operations
          </p>
        </div>

        <div className="admin-toolbar">
          <label
            className="sr-only"
            htmlFor="orders-status-filter"
          >
            Filter orders by status
          </label>

          <select
            id="orders-status-filter"
            className="admin-select"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
          >
            <option value="">
              All statuses
            </option>

            {STATUSES.map((value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={load}
            disabled={loading}
            title="Refresh orders"
            aria-label="Refresh orders"
            aria-busy={loading}
          >
            <RiRefreshLine
              size={16}
              aria-hidden="true"
            />
            {loading
              ? 'Refreshing…'
              : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="admin-card orders-ledger-card">
        <div className="admin-table-wrap orders-ledger-wrap">
          {filtered.length === 0 ? (
            <div className="admin-empty">
              No orders match.
            </div>
          ) : (
            <table className="admin-table orders-ledger-table">
              <caption className="sr-only">
                Customer order ledger
              </caption>

              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                    >
                      {column.label}
                    </th>
                  ))}

                  {canUpdate && (
                    <th scope="col">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (order, index) => {
                    const rowKey =
                      order?.id ??
                      order?.order_number ??
                      `${order?.created_at ?? 'order'}-${index}`;

                    return (
                      <tr key={String(rowKey)}>
                        {columns.map(
                          (column) => {
                            const value =
                              column.render(
                                order
                              );

                            const title =
                              typeof value ===
                              'string'
                                ? value
                                : undefined;

                            return (
                              <td
                                key={
                                  column.key
                                }
                                className={
                                  column.className ??
                                  ''
                                }
                                title={title}
                              >
                                {value}
                              </td>
                            );
                          }
                        )}

                        {canUpdate && (
                          <td>
                            <button
                              type="button"
                              className="btn btn-quiet btn-sm"
                              onClick={() =>
                                openEdit(
                                  order
                                )
                              }
                              disabled={
                                !order?.order_number
                              }
                              title="Edit order"
                              aria-label={`Edit ${displayOrderNumber(
                                order
                              )}`}
                            >
                              <RiEditLine
                                size={14}
                                aria-hidden="true"
                              />
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <AdminModal
          title={`Order ${displayOrderNumber(
            editing
          )}`}
          sub="Review order details and update status, tracking and internal notes."
          onClose={closeEdit}
        >
          <div className="admin-order-items">
            {Array.isArray(
              editing?.order_items
            ) &&
            editing.order_items.length > 0 ? (
              editing.order_items.map(
                (item, index) => (
                  <div
                    className="oi-row"
                    key={
                      item?.id ??
                      `${item?.product_id ?? 'item'}-${index}`
                    }
                  >
                    <span>
                      {text(
                        item?.name ??
                          item?.product_name
                      )}{' '}
                      ×{' '}
                      {text(item?.quantity)}
                    </span>

                    <span>
                      {money(
                        item?.subtotal,
                        editing?.currency
                      )}
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="admin-empty">
                No item details returned.
              </div>
            )}

            <div className="oi-row oi-total">
              <span>Total</span>

              <span>
                {money(
                  editing?.total_amount,
                  editing?.currency
                )}
              </span>
            </div>
          </div>

          <div className="admin-order-detail-meta">
            <div>
              <RiMapPin2Line
                size={15}
                aria-hidden="true"
              />

              <span>
                {address(
                  editing,
                  'shipping'
                )}
              </span>
            </div>

            <div>
              <span>Invoice:</span>{' '}
              {text(
                editing?.invoice_number
              )}
            </div>

            <div>
              <span>Payment:</span>{' '}
              {text(
                editing?.payment_method
              )}
            </div>

            <div>
              <span>
                Customer email:
              </span>{' '}
              {text(
                editing?.users?.email ??
                  editing?.shipping_email ??
                  editing?.billing_email
              )}
            </div>

            <div>
              <span>Phone:</span>{' '}
              {text(
                editing?.shipping_phone ??
                  editing?.billing_phone
              )}
            </div>

            <div>
              <span>Currency:</span>{' '}
              {text(
                editing?.currency
              ).toUpperCase()}
            </div>

            <div>
              <span>Subtotal:</span>{' '}
              {money(
                editing?.subtotal,
                editing?.currency
              )}
            </div>

            <div>
              <span>Discount:</span>{' '}
              {money(
                editing?.discount_amount,
                editing?.currency
              )}
            </div>

            <div>
              <span>Shipping:</span>{' '}
              {money(
                editing?.shipping_cost,
                editing?.currency
              )}
            </div>

            <div>
              <span>Tax:</span>{' '}
              {money(
                editing?.tax_amount,
                editing?.currency
              )}
            </div>

            <div>
              <span>Tax type:</span>{' '}
              {text(editing?.tax_type)}
            </div>

            <div>
              <span>Coupon:</span>{' '}
              {text(editing?.coupon_code)}
            </div>

            <div>
              <span>
                Payment intent:
              </span>{' '}
              {text(
                editing?.stripe_payment_intent
              )}
            </div>

            <div>
              <span>Created:</span>{' '}
              {dateTime(
                editing?.created_at
              )}
            </div>

            <div>
              <span>Paid:</span>{' '}
              {dateTime(
                editing?.paid_at
              )}
            </div>

            <div>
              <span>Shipped:</span>{' '}
              {dateTime(
                editing?.shipped_at
              )}
            </div>

            <div>
              <span>Delivered:</span>{' '}
              {dateTime(
                editing?.delivered_at
              )}
            </div>

            <div>
              <span>Cancelled:</span>{' '}
              {dateTime(
                editing?.cancelled_at
              )}
            </div>

            <div>
              <span>Refunded:</span>{' '}
              {dateTime(
                editing?.refunded_at
              )}
            </div>

            {editing?.notes && (
              <div>
                <span>Notes:</span>{' '}
                {text(editing.notes)}
              </div>
            )}
          </div>

          <form
            onSubmit={save}
            className="ops-form"
          >
            <div className="field">
              <label htmlFor="o-status">
                Status
              </label>

              <select
                id="o-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={saving}
              >
                {STATUSES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="o-tracking">
                Tracking number
              </label>

              <input
                id="o-tracking"
                value={tracking}
                maxLength={120}
                onChange={(event) =>
                  setTracking(
                    event.target.value
                  )
                }
                placeholder="e.g. AWB123456789"
                disabled={saving}
              />
            </div>

            <div className="field">
              <label htmlFor="o-notes">
                Internal notes
              </label>

              <textarea
                id="o-notes"
                value={notes}
                maxLength={2000}
                rows={5}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                disabled={saving}
              />
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-quiet"
                onClick={closeEdit}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="btn"
                type="submit"
                disabled={saving}
                aria-busy={saving}
              >
                <RiEditLine
                  size={16}
                  aria-hidden="true"
                />

                {saving
                  ? 'Saving…'
                  : 'Save order'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}