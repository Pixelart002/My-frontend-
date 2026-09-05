import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    orderService
      .myOrders(page, 10, status || null)
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.message || 'Unable to load your orders.'));
    return () => {
      active = false;
    };
  }, [page, status]);

  const orders = Array.isArray(data) ? data : data?.items || [];
  const totalPages = data?.meta?.total_pages || 1;

  return (
    <div className="page container">
      <div className="page-heading compact">
        <p className="eyebrow">Your account</p>
        <h1>Order history.</h1>
      </div>

      <div className="orders-toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? orderStatusLabel(s) : 'All statuses'}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setPage((p) => p)} />
      ) : data === null ? (
        <Spinner label="Loading orders…" />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" message="When you place an order it will appear here." action={<Link className="btn" to="/shop">Start shopping</Link>} />
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <Link to={`/orders/${order.id}`} className="order-row" key={order.id}>
                <div>
                  <strong>#{order.order_number || order.id.slice(0, 8)}</strong>
                  <span>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="order-amount">{formatMoney(order.total_amount ?? order.grand_total)}</div>
                <span className={`status-pill tone-${orderStatusTone(order.status)}`}>{orderStatusLabel(order.status)}</span>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
