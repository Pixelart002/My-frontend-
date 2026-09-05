import { useEffect, useState } from 'react';
import { RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { formatMoney } from '../../utils/format';
import { ErrorState } from '../../components/ui/States';

/** Real dashboard metrics from GET /admin/stats → { stats: {…} }. */
export default function DashboardPanel({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        adminService.stats(),
        adminService.listOrders({ page: 1, page_size: 5 }),
      ]);
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.stats || statsRes.value || {});
      } else {
        setError(statsRes.reason?.message || 'Unable to load dashboard metrics.');
      }
      if (ordersRes.status === 'fulfilled') {
        setRecent(itemsOfList(ordersRes.value));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !stats) {
    return <div className="state spinner"><span className="spin">●</span><span>Loading dashboard…</span></div>;
  }

  const cards = stats
    ? [
        { label: 'Products', value: Number(stats.products) || 0, hint: 'Active listings' },
        { label: 'Orders', value: Number(stats.orders) || 0, hint: 'All time' },
        { label: 'Pending', value: Number(stats.pending_orders) || 0, hint: 'Needs action', danger: true },
        { label: 'Users', value: Number(stats.users) || 0, hint: 'Registered' },
        { label: 'Revenue', value: formatMoney(Number(stats.revenue) || 0), hint: 'Paid / shipped / delivered' },
      ]
    : [];

  return (
    <div>
      {error && <ErrorState message={error} onRetry={load} />}

      <div className="admin-stats" style={{ marginTop: error ? 24 : 0 }}>
        {cards.map((c) => (
          <div key={c.label} className={`admin-stat ${c.danger ? 'tone-danger' : ''}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-hint">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="admin-section-label">Quick actions</div>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <button className="btn btn-quiet btn-sm" onClick={() => onNavigate('products')}>Add product</button>
        <button className="btn btn-quiet btn-sm" onClick={() => onNavigate('categories')}>Add category</button>
        <button className="btn btn-quiet btn-sm" onClick={() => onNavigate('orders')}>View orders</button>
        <button className="btn btn-quiet btn-sm" onClick={() => onNavigate('users')}>Manage users</button>
        <button className="btn btn-quiet btn-sm" onClick={load}><RiRefreshLine size={14} /> Refresh</button>
      </div>

      <div className="admin-section-label">Recent orders</div>
      {recent.length === 0 ? (
        <div className="admin-table-wrap">
          <div className="admin-empty">No recent orders.</div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className="td-dim">{String(o.id).slice(0, 8).toUpperCase()}</td>
                  <td className="td-gold">{formatMoney(Number(o.total_amount) || 0)}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td className="td-dim">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status }) {
  const tone = {
    pending: 'pill-warn',
    paid: 'pill-info',
    processing: 'pill-info',
    shipped: 'pill-gold',
    delivered: 'pill-success',
    cancelled: 'pill-danger',
    refunded: 'pill-danger',
  }[status] || 'pill-muted';
  return <span className={`admin-pill ${tone}`}>{status || '—'}</span>;
}
