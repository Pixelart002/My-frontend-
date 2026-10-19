import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RiBarChart2Line,
  RiCoupon3Line,
  RiRefreshLine,
  RiShoppingBag3Line,
  RiStackLine,
  RiTeamLine,
} from '@remixicon/react';
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


const INVENTORY_PAGE_SIZE = 100;
const INVENTORY_MAX_PAGES = 50;
const DASHBOARD_PAYMENT_LIMIT = 50;
const DASHBOARD_AUDIT_LIMIT = 200;
const STRIPE_PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+$/;

async function loadInventoryProducts() {
  const products = [];
  let truncated = false;

  for (let page = 1; page <= INVENTORY_MAX_PAGES; page += 1) {
    const response = await adminService.listProducts({
      page,
      page_size: INVENTORY_PAGE_SIZE,
    });
    const pageItems = itemsOfList(response);
    products.push(...pageItems);

    const payload = response?.data && typeof response.data === 'object'
      ? response.data
      : response;
    const totalPages = Number(
      payload?.meta?.total_pages ??
        payload?.pagination?.total_pages ??
        response?.meta?.total_pages,
    );

    if (
      (Number.isFinite(totalPages) && totalPages > 0 && page >= totalPages) ||
      pageItems.length < INVENTORY_PAGE_SIZE
    ) {
      break;
    }

    if (page === INVENTORY_MAX_PAGES) {
      truncated = true;
    }
  }

  let units = 0;
  let outOfStock = 0;

  products.forEach((product) => {
    const stock = normalizeNumber(product?.stock);
    units += stock;
    if (stock <= 0) outOfStock += 1;
  });

  return {
    units,
    outOfStock,
    productsScanned: products.length,
    truncated,
  };
}

function summarizePayments(rows) {
  return rows.reduce(
    (summary, row) => {
      const status = String(row?.status || 'unknown').trim().toLowerCase();
      const paymentMethod = String(row?.payment_method || '').trim().toLowerCase();
      const orderStatus = String(row?.order_status || '').trim().toLowerCase();
      const codOrderPaid = paymentMethod === 'cod' &&
        ['paid', 'processing', 'shipped', 'delivered'].includes(orderStatus);
      const succeeded = codOrderPaid || ['succeeded', 'paid'].includes(status);
      const failed = ['failed', 'canceled', 'cancelled'].includes(status);
      const amount = Number(row?.amount);

      summary.attempts += 1;
      if (Number.isFinite(amount)) summary.eventValue += amount;
      if (succeeded) summary.succeeded += 1;
      if (failed) summary.failed += 1;

      return summary;
    },
    { attempts: 0, eventValue: 0, succeeded: 0, failed: 0 },
  );
}

function summarizeAudit(rows) {
  return rows.reduce(
    (summary, row) => {
      const code = Number(row?.status_code);
      const statusCode = Number.isFinite(code) ? code : 0;
      summary.entries += 1;
      if (statusCode >= 200 && statusCode < 400) {
        summary.successful += 1;
      } else if (statusCode >= 400) {
        summary.errors += 1;
      }
      return summary;
    },
    { entries: 0, successful: 0, errors: 0 },
  );
}

function summarizeStripeSettings(result) {
  const settings = Array.isArray(result)
    ? result
    : Array.isArray(result?.items)
      ? result.items
      : [];
  const stripeSetting = settings.find(
    (item) => String(item?.key || '').trim() === 'stripe_publishable_key',
  );
  const key = String(stripeSetting?.value || '').trim();
  const valid = STRIPE_PUBLISHABLE_KEY_PATTERN.test(key);

  return {
    status: valid ? 'Configured' : 'Missing',
    mode: valid && key.startsWith('pk_live_')
      ? 'Live'
      : valid && key.startsWith('pk_test_')
        ? 'Test'
        : 'Not configured',
    storage: 'Runtime settings',
  };
}

function DashboardMetricGroup({
  title,
  description,
  metrics,
  loading,
  unavailable,
}) {
  return (
    <section className="dashboard-summary-group" aria-label={title}>
      <div className="dashboard-summary-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {unavailable && (
          <span className="dashboard-summary-unavailable">
            Temporarily unavailable
          </span>
        )}
      </div>
      <div className="admin-stats dashboard-summary-stats">
        {metrics.map((metric) => (
          <article className="admin-stat" key={metric.label}>
            <div className="stat-label">{metric.label}</div>
            <div className="stat-value">
              {loading ? '…' : unavailable ? '—' : metric.value ?? '—'}
            </div>
            {metric.hint && <div className="stat-hint">{metric.hint}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}

/** Real dashboard metrics from GET /admin/stats → { stats: {…} }. */
export default function DashboardPanel({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overview, setOverview] = useState({
    inventory: null,
    lowStock: null,
    payments: null,
    audit: null,
    notifications: null,
    stripe: null,
  });
  const [overviewErrors, setOverviewErrors] = useState({});

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setRefreshing(true);
    setOverviewLoading(true);
    setOverviewErrors({});
    setError('');
    setOrdersError('');

    const overviewPromise = Promise.allSettled([
      loadInventoryProducts(),
      adminService.lowStock(),
      adminService.paymentsReport({
        limit: DASHBOARD_PAYMENT_LIMIT,
        offset: 0,
      }),
      adminService.auditLogs(DASHBOARD_AUDIT_LIMIT),
      adminService.pushStats(),
      adminService.settings('financial'),
    ]);

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
      setLoading(false);

      const [
        inventoryRes,
        lowStockRes,
        paymentsRes,
        auditRes,
        notificationsRes,
        stripeRes,
      ] = await overviewPromise;

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const results = {
        inventory: inventoryRes,
        lowStock: lowStockRes,
        payments: paymentsRes,
        audit: auditRes,
        notifications: notificationsRes,
        stripe: stripeRes,
      };
      const nextOverview = {
        inventory: inventoryRes.status === 'fulfilled'
          ? inventoryRes.value
          : null,
        lowStock: lowStockRes.status === 'fulfilled'
          ? itemsOfList(lowStockRes.value).length
          : null,
        payments: paymentsRes.status === 'fulfilled'
          ? summarizePayments(itemsOfList(paymentsRes.value))
          : null,
        audit: auditRes.status === 'fulfilled'
          ? summarizeAudit(itemsOfList(auditRes.value))
          : null,
        notifications: notificationsRes.status === 'fulfilled'
          ? notificationsRes.value
          : null,
        stripe: stripeRes.status === 'fulfilled'
          ? summarizeStripeSettings(stripeRes.value)
          : null,
      };

      setOverview(nextOverview);
      setOverviewErrors(
        Object.fromEntries(
          Object.entries(results)
            .filter(([, result]) => result.status === 'rejected')
            .map(([name]) => [name, true]),
        ),
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
        setOverviewLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

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
          icon: RiStackLine,
        },
        {
          label: 'Orders',
          value: normalizeNumber(stats.orders),
          hint: 'All time',
          icon: RiShoppingBag3Line,
        },
        {
          label: 'Pending',
          value: normalizeNumber(stats.pending_orders),
          hint: 'Needs action',
          danger: true,
          icon: RiBarChart2Line,
        },
        {
          label: 'Users',
          value: normalizeNumber(stats.users),
          hint: 'Registered',
          icon: RiTeamLine,
        },
        {
          label: 'Revenue',
          value: formatMoney(normalizeNumber(stats.revenue)),
          hint: 'Paid / shipped / delivered',
          icon: RiBarChart2Line,
        },
        {
          label: 'Low stock',
          value: overviewLoading
            ? '…'
            : overviewErrors.lowStock
              ? '—'
              : normalizeNumber(overview.lowStock),
          hint: 'Needs restocking',
          danger: !overviewLoading && !overviewErrors.lowStock && normalizeNumber(overview.lowStock) > 0,
          icon: RiStackLine,
        },
      ]
    : [];

  return (
    <div className="dashboard-panel">
      <section className="dashboard-quick-actions-section" aria-label="Dashboard quick actions">
        <details className="dashboard-quick-actions-menu">
          <summary className="dashboard-quick-actions-trigger">
            <span>Quick actions</span>
            <span className="dashboard-quick-actions-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="dashboard-quick-actions-popover">
            <button type="button" onClick={() => onNavigate?.('products')}>Manage products</button>
            <button type="button" onClick={() => onNavigate?.('categories')}>Manage categories</button>
            <button type="button" onClick={() => onNavigate?.('orders')}>View orders</button>
            <button type="button" onClick={() => onNavigate?.('users')}>Manage users</button>
            <button type="button" onClick={() => onNavigate?.('coupons')}>Manage coupons</button>
            <button type="button" onClick={load} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh dashboard'}
            </button>
          </div>
        </details>
      </section>

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
            <div className="stat-topline">
              <div className="stat-label">{card.label}</div>
              {card.icon && (
                <span className="stat-icon" aria-hidden="true">
                  <card.icon size={17} />
                </span>
              )}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-hint">{card.hint}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-visualization" aria-labelledby="dashboard-status-heading">
        <div className="dashboard-visualization-heading">
          <div>
            <h2 id="dashboard-status-heading">Recent order status mix</h2>
            <p>Based on the {recent.length} latest loaded orders</p>
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="dashboard-visualization-empty">Status data will appear when orders arrive.</div>
        ) : (
          <div className="dashboard-status-chart" role="list" aria-label="Recent order status distribution">
            {Object.entries(
              recent.reduce((counts, order) => {
                const status = String(order?.status || 'unknown').trim().toLowerCase();
                counts[status] = (counts[status] || 0) + 1;
                return counts;
              }, {}),
            ).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const percentage = Math.round((count / recent.length) * 100);
              const label = status.charAt(0).toUpperCase() + status.slice(1);
              return (
                <div className="dashboard-status-row" role="listitem" key={status}>
                  <div className="dashboard-status-meta">
                    <span>{label}</span>
                    <strong>{count} <span className="dashboard-status-percent">({percentage}%)</span></strong>
                  </div>
                  <div className="dashboard-status-track" aria-hidden="true">
                    <span className="dashboard-status-fill" style={{ width: percentage + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="dashboard-section dashboard-recent-section"
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

      <DashboardMetricGroup
        title="Inventory snapshot"
        description={
          overview.inventory
            ? `Stock levels across ${overview.inventory.productsScanned}${overview.inventory.truncated ? '+' : ''} catalog products.`
            : 'Live stock counts from the catalog.'
        }
        loading={overviewLoading}
        unavailable={Boolean(overviewErrors.inventory)}
        metrics={[
          {
            label: 'Units on hand',
            value: overview.inventory?.units?.toLocaleString('en-IN'),
            hint: 'Current listed quantity',
          },
          {
            label: 'Out of stock',
            value: overview.inventory?.outOfStock?.toLocaleString('en-IN'),
            hint: 'Zero or negative stock',
          },
        ]}
      />

      <DashboardMetricGroup
        title="Payment activity"
        description={`Based on the ${DASHBOARD_PAYMENT_LIMIT} most recent loaded payment attempts; values are not lifetime totals.`}
        loading={overviewLoading}
        unavailable={Boolean(overviewErrors.payments)}
        metrics={[
          {
            label: 'Recent attempts',
            value: overview.payments?.attempts?.toLocaleString('en-IN'),
            hint: 'Loaded payment records',
          },
          {
            label: 'Recent event value',
            value: overview.payments ? formatMoney(overview.payments.eventValue) : undefined,
            hint: 'Sum of loaded attempt values',
          },
          {
            label: 'Succeeded',
            value: overview.payments?.succeeded?.toLocaleString('en-IN'),
            hint: 'Recent attempts',
          },
          {
            label: 'Failed',
            value: overview.payments?.failed?.toLocaleString('en-IN'),
            hint: 'Explicit failed/cancelled states',
          },
          {
            label: 'Needs attention',
            value: overview.payments
              ? Math.max(0, overview.payments.attempts - overview.payments.succeeded).toLocaleString('en-IN')
              : undefined,
            hint: 'Not confirmed successful',
          },
        ]}
      />

      <DashboardMetricGroup
        title="Audit activity"
        description={`Security and operational events from up to ${DASHBOARD_AUDIT_LIMIT} recent entries.`}
        loading={overviewLoading}
        unavailable={Boolean(overviewErrors.audit)}
        metrics={[
          {
            label: 'Entries',
            value: overview.audit?.entries?.toLocaleString('en-IN'),
            hint: 'Loaded audit records',
          },
          {
            label: 'Successful',
            value: overview.audit?.successful?.toLocaleString('en-IN'),
            hint: 'HTTP 2xx–3xx',
          },
          {
            label: 'Errors',
            value: overview.audit?.errors?.toLocaleString('en-IN'),
            hint: 'HTTP 4xx and 5xx',
          },
        ]}
      />

      <DashboardMetricGroup
        title="Customer notifications"
        description="Current Web Push audience and delivery configuration."
        loading={overviewLoading}
        unavailable={Boolean(overviewErrors.notifications)}
        metrics={[
          {
            label: 'Subscribed devices',
            value: overview.notifications?.total_subscriptions ??
              overview.notifications?.subscriptions ??
              overview.notifications?.total ??
              0,
            hint: 'Push endpoints',
          },
          {
            label: 'Subscribed customers',
            value: overview.notifications?.unique_users ?? 0,
            hint: 'Unique users',
          },
          {
            label: 'Push configuration',
            value: overview.notifications
              ? overview.notifications.vapid_configured
                ? 'Configured'
                : 'Not configured'
              : undefined,
            hint: 'Web Push server settings',
          },
        ]}
      />

      <DashboardMetricGroup
        title="Payment gateway configuration"
        description="Browser-safe Stripe publishable-key status only; secret keys stay server-side."
        loading={overviewLoading}
        unavailable={Boolean(overviewErrors.stripe)}
        metrics={[
          {
            label: 'Status',
            value: overview.stripe?.status,
            hint: 'Publishable key validation',
          },
          {
            label: 'Mode',
            value: overview.stripe?.mode,
            hint: 'Test or live',
          },
          {
            label: 'Storage',
            value: overview.stripe?.storage,
            hint: 'Configuration source',
          },
        ]}
      />

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