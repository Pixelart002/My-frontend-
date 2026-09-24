import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orders';
import { orderStatusLabel, orderStatusTone } from '../utils/order';
import { formatMoney } from '../utils/format';
import Pagination from '../components/ui/Pagination';
import { Spinner, ErrorState, EmptyState } from '../components/ui/States';

const STATUS_OPTIONS = ['', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setData(null);
    setError('');
    try { setData(await orderService.myOrders(page, 10, status || null)); }
    catch (err) { setError(err.message || 'Unable to load your orders.'); }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const orders = Array.isArray(data) ? data : data?.items || [];
  const totalPages = data?.meta?.total_pages || 1;
  const totalSpend = orders.reduce((sum, order) => sum + (Number(order.total_amount ?? order.grand_total ?? 0) || 0), 0);
  const openOrderCount = orders.filter((order) => ['pending', 'paid', 'processing', 'shipped'].includes(String(order.status || '').toLowerCase())).length;

  return (
    <div className="page container">
      <div className="page-heading compact"><p className="eyebrow">Your account</p><h1>Order history.</h1></div>

      {error ? <ErrorState message={error} onRetry={load} /> : data === null ? <Spinner label="Loading orders…" /> : (
        <>
          <div className="account-overview-grid">
            <div className="account-stat-card">
              <p className="eyebrow">Orders</p>
              <h3>{orders.length}</h3>
              <small>Total placed</small>
            </div>
            <div className="account-stat-card">
              <p className="eyebrow">Open</p>
              <h3>{openOrderCount}</h3>
              <small>In progress</small>
            </div>
            <div className="account-stat-card">
              <p className="eyebrow">Spend</p>
              <h3>{formatMoney(totalSpend)}</h3>
              <small>Across active orders</small>
            </div>
          </div>

          <div className="orders-toolbar">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? orderStatusLabel(s) : 'All statuses'}</option>)}
            </select>
          </div>

          {orders.length === 0 ? (
            <EmptyState title="No orders yet" message="When you place an order it will appear here." action={<Link className="btn" to="/shop">Start shopping</Link>} />
          ) : (
            <>
              <div className="orders-list" aria-label="Order list">
                {orders.map((order) => {
                  const orderNumber = String(order.order_number || '').trim();
                  if (!orderNumber) return null;
                  const statusTone = orderStatusTone(order.status);
                  return (
                    <Link to={`/orders/${encodeURIComponent(orderNumber)}`} className="order-row" key={orderNumber}>
                      <div className="order-row-main">
                        <strong>#{orderNumber}</strong>
                        <span>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="order-row-amount">{formatMoney(order.total_amount ?? order.grand_total)}</div>
                      <span className={`status-pill tone-${statusTone}`}>{orderStatusLabel(order.status)}</span>
                    </Link>
                  );
                })}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
