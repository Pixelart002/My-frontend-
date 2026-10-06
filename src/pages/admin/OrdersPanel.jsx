import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RiMapPin2Line,
  RiRefreshLine,
  RiTruckLine,
} from '@remixicon/react';

import { adminService, itemsOfList } from '../../services/admin';
import { formatMoney } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import { ErrorState, Spinner } from '../../components/ui/States';
import { StatusPill } from './DashboardPanel';
import OrderFulfillmentModal from './OrderFulfillmentModal';

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
  const [fulfilling, setFulfilling] = useState(null);

  const [loading, setLoading] = useState(true);

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
          _ts: Date.now(),
        });

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const nextItems = itemsOfList(result);
      setItems(nextItems);
      return nextItems;
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
    <div className="orders-admin-full w-full min-w-0 max-w-none overflow-x-clip">
      <div className="admin-page-head flex w-full min-w-0 flex-col items-stretch gap-3 min-[901px]:flex-row min-[901px]:items-end min-[901px]:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 break-words">Orders</h1>

          <p className="admin-sub">
            {filtered.length} of {items.length}{' '}
            shown · essential order operations
          </p>
        </div>

        <div className="admin-toolbar flex w-full min-w-0 flex-col items-stretch gap-2 min-[901px]:w-auto min-[901px]:flex-row min-[901px]:items-center">
          <label
            className="sr-only"
            htmlFor="orders-status-filter"
          >
            Filter orders by status
          </label>

          <select
            id="orders-status-filter"
            className="admin-select min-w-0 w-full min-[901px]:w-auto"
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

      <div className="admin-card orders-ledger-card w-full min-w-0 max-w-none">
        <div
          className="orders-ledger-scroll"
          role="region"
          aria-label="Orders table"
          tabIndex={0}
        >
          <div className="orders-ledger-track">
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
                      Fulfillment
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
                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                'pending',
                                'paid',
                                'processing',
                                'shipped',
                                'delivered',
                                'cancelled',
                                'refunded',
                              ].includes(
                                String(order?.status ?? '').trim().toLowerCase(),
                              ) && (
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  onClick={() => setFulfilling(order)}
                                  disabled={!order?.order_number}
                                  title={`Open fulfillment for ${displayOrderNumber(order)}`}
                                >
                                  <RiTruckLine
                                    size={14}
                                    aria-hidden="true"
                                  />
                                  Fulfillment
                                </button>
                              )}

                            </div>
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
      </div>

      {fulfilling && (
        <OrderFulfillmentModal
          order={fulfilling}
          capabilities={capabilities}
          onClose={() => setFulfilling(null)}
          onUpdated={async () => {
            const nextItems = await load();
            const refreshed = nextItems?.find(
              (item) =>
                String(item?.order_number ?? '') ===
                String(fulfilling?.order_number ?? ''),
            );
            if (refreshed) {
              setFulfilling(refreshed);
            }
          }}
        />
      )}

    </div>
  );
}