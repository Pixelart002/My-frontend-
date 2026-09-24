import { useCallback, useEffect, useRef, useState } from 'react';
import { RiCoupon3Line, RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { formatMoney } from '../../utils/format';
import { ErrorState } from '../../components/ui/States';

const DASHBOARD_ORDER_LIMIT = 5;

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatOrderDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Real dashboard metrics from GET /admin/stats → { stats: {…} }. */
export default function DashboardPanel({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [loading, setLoading] = useState(true);
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

    setLoading((current) => current && !stats);
    setRefreshing(true);
    setError('');
    setOrdersError('');

    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        adminService.stats(),
        adminService.listOrders({
          page: 1,
          page_size: DASHBOARD_ORDER_LIMIT,
        }),
      ]);

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      if (statsRes.status === 'fulfilled') {
        const payload = statsRes.value;
        setStats(payload?.stats || payload || {});
      } else {
        setError(
          statsRes.reason?.message ||
            'Unable to load dashboard metrics.',
        );
      }

      if (ordersRes.status === 'fulfilled') {
        setRecent(itemsOfList(ordersRes.value));
      } else {
        setRecent([]);
        setOrdersError(
          ordersRes.reason?.message ||
            'Unable to load recent orders.',
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [stats]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) {
    return (
      <div
        className="state spinner dashboard-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="spin dashboard-loading-icon" aria-hidden="true">
          ●
        </span>
        <span>Loading dashboard…</span>
      </div>
    );
  }

  const cards = stats
    ? [
        {
          label: 'Products',
          value: normalizeNumber(stats.products),
          hint: 'Active listings',
        },
        {
          label: 'Orders',
          value: normalizeNumber(stats.orders),
          hint: 'All time',
        },
        {
          label: 'Pending',
          value: normalizeNumber(stats.pending_orders),
          hint: 'Needs action',
          danger: true,
        },
        {
          label: 'Users',
          value: normalizeNumber(stats.users),
          hint: 'Registered',
        },
        {
          label: 'Revenue',
          value: formatMoney(normalizeNumber(stats.revenue)),
          hint: 'Paid / shipped / delivered',
        },
      ]
    : [];

  return (
    <div className="dashboard-panel">
      {error && (
        <div className="dashboard-error">
          <ErrorState message={error} onRetry={load} />
        </div>
      )}

      <section
        className={`admin-stats${error ? ' has-error' : ''}`}
        aria-label="Dashboard statistics"
      >
        {cards.map((card) => (
          <article
            key={card.label}
            className={`admin-stat${
              card.danger ? ' tone-danger' : ''
            }`}
          >
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-hint">{card.hint}</div>
          </article>
        ))}
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="dashboard-quick-actions"
      >
        <div
          id="dashboard-quick-actions"
          className="admin-section-label"
        >
          Quick actions
        </div>

        <div className="btn-row dashboard-actions">
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => onNavigate?.('products')}
          >
            Add product
          </button>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => onNavigate?.('categories')}
          >
            Add category
          </button>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => onNavigate?.('orders')}
          >
            View orders
          </button>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => onNavigate?.('users')}
          >
            Manage users
          </button>

          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => onNavigate?.('coupons')}
          >
            <RiCoupon3Line size={14} aria-hidden="true" />
            <span>Create coupon</span>
          </button>

          <button
            type="button"
            className="btn btn-quiet btn-sm dashboard-refresh"
            onClick={load}
            disabled={refreshing}
            aria-label={
              refreshing
                ? 'Refreshing dashboard'
                : 'Refresh dashboard'
            }
          >
            <RiRefreshLine
              size={14}
              className={refreshing ? 'dashboard-refresh-icon spin' : ''}
              aria-hidden="true"
            />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </section>

      <section
        className="dashboard-section"
        aria-labelledby="dashboard-recent-orders"
      >
        <div
          id="dashboard-recent-orders"
          className="admin-section-label"
        >
          Recent orders
        </div>

        {ordersError ? (
          <div className="admin-table-wrap dashboard-order-state">
            <div
              className="admin-empty"
              role="alert"
            >
              {ordersError}
            </div>

            <div className="btn-row dashboard-order-retry">
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={load}
              >
                Retry orders
              </button>
            </div>
          </div>
        ) : recent.length === 0 ? (
          <div className="admin-table-wrap dashboard-order-state">
            <div className="admin-empty">
              No recent orders.
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap admin-recent-orders">
            <div className="dashboard-table-scroll">
              <table className="admin-table dashboard-orders-table">
                <caption className="sr-only">
                  Five most recent orders
                </caption>

                <colgroup>
                  <col className="dashboard-order-col" />
                  <col className="dashboard-total-col" />
                  <col className="dashboard-status-col" />
                  <col className="dashboard-date-col" />
                </colgroup>

                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recent.map((order) => (
                    <tr key={order.id}>
                      <td className="td-strong dashboard-order-number">
                        {order.order_number
                          ? `#${String(order.order_number).replace(/^#/, '')}`
                          : '—'}
                      </td>

                      <td className="td-gold">
                        {formatMoney(
                          normalizeNumber(order.total_amount),
                        )}
                      </td>

                      <td>
                        <StatusPill status={order.status} />
                      </td>

                      <td className="td-dim dashboard-order-date">
                        {formatOrderDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function StatusPill({ status }) {
  const normalizedStatus =
    typeof status === 'string'
      ? status.trim().toLowerCase()
      : '';

  const tone = {
    pending: 'pill-warn',
    paid: 'pill-info',
    processing: 'pill-info',
    shipped: 'pill-gold',
    delivered: 'pill-success',
    cancelled: 'pill-danger',
    refunded: 'pill-danger',
  }[normalizedStatus] || 'pill-muted';

  const label = normalizedStatus
    ? normalizedStatus.charAt(0).toUpperCase() +
      normalizedStatus.slice(1)
    : '—';

  return (
    <span
      className={`admin-pill ${tone}`}
      aria-label={`Order status: ${label}`}
    >
      {label}
    </span>
  );
}