import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RiArrowLeftLine, RiFileTextLine, RiCloseCircleLine } from '@remixicon/react';
import { orderService } from '../services/orders';
import { orderStatusLabel, orderStatusTone, canCancelOrder, canDownloadInvoice } from '../utils/order';
import { formatMoney } from '../utils/format';
import { Spinner, ErrorState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError('');
    orderService
      .myOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message || 'Unable to load this order.'));
  };

  useEffect(load, [id]);

  const onCancel = async () => {
    if (!window.confirm('Cancel this order? Your payment will be refunded.')) return;
    setBusy(true);
    try {
      await orderService.cancel(order.id);
      toast.success('Order cancelled.');
      load();
    } catch (err) {
      toast.error(err.message || 'Unable to cancel this order.');
    } finally {
      setBusy(false);
    }
  };

  const onInvoice = async () => {
    setBusy(true);
    try {
      await orderService.invoice(order.id);
    } catch (err) {
      toast.error(err.message || 'Unable to download the invoice.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="page container"><ErrorState message={error} onRetry={load} /></div>;
  if (!order) return <div className="page container"><Spinner label="Loading order…" /></div>;

  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const status = String(order.status || '').toLowerCase();

  return (
    <div className="page container">
      <Link className="back-link" to="/orders"><RiArrowLeftLine size={15} /> Back to orders</Link>

      <div className="order-head">
        <div>
          <p className="eyebrow">Order details</p>
          <h1>Order #{order.order_number || order.id.slice(0, 8)}</h1>
          <p className="auth-sub">Placed {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <span className={`status-pill tone-${orderStatusTone(status)}`}>{orderStatusLabel(status)}</span>
      </div>

      <div className="order-actions">
        {canDownloadInvoice(status) && (
          <button className="btn btn-quiet btn-sm" onClick={onInvoice} disabled={busy}>
            <RiFileTextLine size={15} /> Download invoice
          </button>
        )}
        {canCancelOrder(status) && (
          <button className="btn btn-danger btn-sm" onClick={onCancel} disabled={busy}>
            <RiCloseCircleLine size={15} /> Cancel order
          </button>
        )}
      </div>

      <div className="order-items">
        {items.map((item) => {
          const prod = item.products || {};
          return (
            <div className="cart-row" key={item.id}>
              {prod.image_url ? (
                <Link to={`/product/${prod.slug}`} className="cart-thumb"><img src={prod.image_url} alt={prod.name || item.product_name} /></Link>
              ) : (
                <div className="cart-thumb"><span>{(prod.name || 'L').slice(0, 1)}</span></div>
              )}
              <div className="cart-info">
                <h3>{prod.name || item.product_name}</h3>
                <p className="product-category">{prod.hsn_code ? `HSN ${prod.hsn_code}` : 'Product'}</p>
                <p className="cart-unit">{formatMoney(item.unit_price)} × {item.quantity}</p>
              </div>
              <strong className="cart-line-total">{formatMoney(item.line_total ?? item.total)}</strong>
            </div>
          );
        })}
      </div>

      <aside className="summary order-summary">
        <p className="eyebrow">Summary</p>
        <dl className="summary-lines">
          <div><dt>Subtotal</dt><dd>{formatMoney(order.subtotal ?? order.items_subtotal ?? 0)}</dd></div>
          <div><dt>Shipping</dt><dd>{order.shipping_cost > 0 ? formatMoney(order.shipping_cost) : 'Free'}</dd></div>
          <div><dt>Taxes</dt><dd>{formatMoney(order.tax_amount)}</dd></div>
          {order.discount_amount > 0 && <div><dt>Discount</dt><dd>−{formatMoney(order.discount_amount)}</dd></div>}
          <div className="total"><dt>Total</dt><dd>{formatMoney(order.total_amount ?? order.grand_total)}</dd></div>
        </dl>

        {order.shipping_address && (
          <div className="summary-address">
            <strong>Deliver to</strong>
            <p>
              {order.shipping_address.line1}, {order.shipping_address.city}
              {order.shipping_address.state ? `, ${order.shipping_address.state}` : ''} — {order.shipping_address.postal_code}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
