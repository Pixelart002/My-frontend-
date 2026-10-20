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
  RiSearchLine,
  RiTruckLine,
} from '@remixicon/react';

import { getOrdersSnapshot, preloadOrders } from '../../services/ordersPreloader';
import OrdersPanelSkeleton from './OrdersPanelSkeleton';
import { formatMoney } from '../../utils/format';
import { ErrorState } from '../../components/ui/States';
import { StatusPill } from './DashboardPanel';
import OrderFulfillmentModal from './OrderFulfillmentModal';

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

const orderKey = (order, index = 0) =>
  String(
    order?.id ??
      order?.order_number ??
      `${order?.created_at ?? 'order'}-${index}`,
  );

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
  cacheScope = 'authenticated-admin-session',
}) {
  const canUpdate = capabilities.orderUpdate === true;
  const scopeKey = String(cacheScope || 'authenticated-admin-session');
  const initialSnapshot = getOrdersSnapshot(scopeKey);

  const [items, setItems] = useState(() => initialSnapshot?.items ?? null);
  const [totalOrders, setTotalOrders] = useState(() => initialSnapshot?.totalOrders ?? 0);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fulfilling, setFulfilling] = useState(null);
  const [loading, setLoading] = useState(() => !initialSnapshot?.items);
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const itemsRef = useRef(items);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const load = useCallback(async (force = false) => {
    const cached = getOrdersSnapshot(scopeKey);
    const hasData = Array.isArray(itemsRef.current) || Array.isArray(cached?.items);
    const requestId = ++requestIdRef.current;

    if (hasData) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const snapshot = await preloadOrders(scopeKey, { force });

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      itemsRef.current = snapshot.items;
      setItems(snapshot.items);
      setTotalOrders(snapshot.totalOrders);
      return snapshot.items;
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setError(err?.message || 'Unable to preload the complete Orders list.');
      return undefined;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [scopeKey]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];

    const query = search.trim().toLowerCase();

    return items.filter((order) => {
      const statusMatches =
        !filter ||
        String(order?.status ?? '').trim().toLowerCase() === filter.toLowerCase();

      if (!statusMatches) return false;
      if (!query) return true;

      const searchable = [
        order?.order_number,
        order?.id,
        order?.users?.full_name,
        order?.users?.email,
        order?.users?.phone,
        order?.shipping_name,
        order?.billing_name,
        order?.shipping_phone,
        order?.invoice_number,
        order?.tracking_number,
      ]
        .filter((value) => value !== null && value !== undefined && value !== '')
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [items, filter, search]);

  if (error && items === null) {
    return (
      <ErrorState
        message={error}
        onRetry={() => void load(true)}
      />
    );
  }

  if (items === null) {
    return <OrdersPanelSkeleton canUpdate={canUpdate} />;
  }

  return (
    <div className="orders-admin-full w-full min-w-0 max-w-none overflow-x-clip">
      {error && items !== null && (
        <div className="orders-load-more-error orders-refresh-error" role="alert">
          <span>Refresh failed: {error}. Previously loaded orders are still shown.</span>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            Retry refresh
          </button>
        </div>
      )}

      <div className="admin-page-head flex w-full min-w-0 flex-col items-stretch gap-3 min-[901px]:flex-row min-[901px]:items-end min-[901px]:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 break-words">Orders</h1>

          <p className="admin-sub">
            {filter || search.trim()
              ? `${filtered.length} matching · ${items.length} preloaded`
              : `${items.length} orders ready`
            } · {totalOrders} total
          </p>
        </div>

        <div className="admin-toolbar orders-toolbar" role="search" aria-label="Search and filter orders">
          <label className="admin-search orders-search" htmlFor="orders-search">
            <RiSearchLine size={16} aria-hidden="true" />
            <input
              id="orders-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search all orders…"
              autoComplete="off"
              aria-label="Search all preloaded orders by order number, customer, invoice or tracking"
            />
          </label>

          <div className="orders-filter-actions">
            <label className="sr-only" htmlFor="orders-status-filter">Filter orders by status</label>
            <select
              id="orders-status-filter"
              className="admin-select orders-status-select"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setSearch('');
              }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <button
              type="button"
              className="icon-btn orders-refresh-button"
              onClick={() => void load(true)}
              disabled={loading || refreshing}
              title="Refresh all orders"
              aria-label="Refresh all orders"
              aria-busy={loading || refreshing}
            >
              <RiRefreshLine size={17} className={loading || refreshing ? 'spin' : undefined} aria-hidden="true" />
            </button>
          </div>
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
                    return (
                      <tr key={orderKey(order, index)}>
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

      <div className="orders-pagination flex flex-wrap items-center justify-between gap-3 py-3" aria-label="Orders data status">
        <p className="admin-sub" aria-live="polite">
          {totalOrders === 0
            ? 'No orders found'
            : filter || search.trim()
              ? `Showing ${filtered.length} matching of ${items.length} preloaded orders`
              : `All ${items.length} orders preloaded`}
        </p>
        {refreshing && <p className="admin-sub" role="status" aria-live="polite">Checking for order updates…</p>}
      </div>

      {fulfilling && (
        <OrderFulfillmentModal
          order={fulfilling}
          capabilities={capabilities}
          onClose={() => setFulfilling(null)}
          onUpdated={async () => {
            const nextItems = await load(true);
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