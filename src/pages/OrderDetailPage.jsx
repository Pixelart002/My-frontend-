import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(() => {
    if (!id) return Promise.resolve();
    setError('');
    return orderService.myOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message || 'Unable to load this order.'));
  }, [id]);

  useEffect(() => {
    setOrder(null);
    load();
  }, [load]);

  const onCancel = async () => {
    if (!window.confirm('Cancel this order? Your payment will be refunded.')) return;
    setBusy(true);
    try { await orderService.cancel(order.id); toast.success('Order cancelled.'); load(); }
    catch (err) { toast.error(err.message || 'Unable to cancel this order.'); }
    finally { setBusy(false); }
  };

  const onInvoice = async () => {
    setBusy(true);
    try { await orderService.invoice(order.id); }
    catch (err) { toast.error(err.message || 'Unable to download the invoice.'); }
    finally { setBusy(false); }
  };

  if (error) return <div className="page container"><ErrorState message={error} onRetry={load} /></div>;
  if (!order) return <div className="page container"><Spinner label="Loading order…" /></div>;

  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const status = String(order.status || '').toLowerCase();

  return (
    <div className="page container order-detail-page">
      <Link className="back-link" to="/orders"><RiArrowLeftLine size={15} /> Back to orders</Link>

      <section className="order-detail-card">
        <header className="order-detail-header">
          <div className="order-detail-title">
            <p className="eyebrow">Order details</p>
            <h1>Order #{order.order_number || order.id.slice(0, 8)}</h1>
            <p className="auth-sub">Placed {new Date(order.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <span className={`status-pill tone-${orderStatusTone(status)}`}>{orderStatusLabel(status)}</span>
        </header>

        <div className="order-detail-actions">
          {canDownloadInvoice(status) && <button className="btn btn-quiet btn-sm" onClick={onInvoice} disabled={busy}><RiFileTextLine size={15} /> Download invoice</button>}
          {canCancelOrder(status) && <button className="btn btn-danger btn-sm" onClick={onCancel} disabled={busy}><RiCloseCircleLine size={15} /> Cancel order</button>}
        </div>

        <div className="order-detail-items">
          <div className="order-section-label">Items</div>
          {items.map((item) => {
            const prod = item.products || {};
            const name = prod.name || item.product_name || 'Product';
            const slug = prod.slug || item.product_slug || item.product_id;
            const imageUrl = prod.image_url || item.image_url || item.product_image_url;
            const quantity = Math.max(1, Number(item.quantity) || 1);
            const hasStoredUnitPrice = item.unit_price !== undefined && item.unit_price !== null;
            const hasStoredSubtotal = item.subtotal !== undefined && item.subtotal !== null;
            const unitPrice = hasStoredUnitPrice ? Number(item.unit_price) : hasStoredSubtotal ? Number(item.subtotal) / quantity : 0;
            const lineTotal = hasStoredSubtotal ? Number(item.subtotal) : hasStoredUnitPrice ? Number(item.unit_price) * quantity : 0;

            return (
              <article className="order-item" key={item.id}>
                {imageUrl && slug ? <Link to={`/product/${slug}`} className="order-item-thumb"><img src={imageUrl} alt={name} /></Link> : <div className="order-item-thumb"><span>{name.slice(0, 1)}</span></div>}
                <div className="order-item-info">
                  <h3>{name}</h3>
                  <p>{item.hsn_code ? `HSN ${item.hsn_code}` : 'Product'}</p>
                  <span>{formatMoney(unitPrice)} × {quantity}</span>
                </div>
                <strong className="order-item-total">{formatMoney(lineTotal)}</strong>
              </article>
            );
          })}
        </div>

        <aside className="summary order-summary">
          <p className="eyebrow">Summary</p>
          <dl className="summary-lines">
            <div><dt>Subtotal</dt><dd>{formatMoney(order.subtotal ?? order.items_subtotal ?? 0)}</dd></div>
            <div><dt>Shipping</dt><dd>{Number(order.shipping_cost) > 0 ? formatMoney(order.shipping_cost) : 'Free'}</dd></div>
            <div><dt>Taxes</dt><dd>{formatMoney(order.tax_amount)}</dd></div>
            {Number(order.discount_amount) > 0 && <div><dt>Discount</dt><dd>−{formatMoney(order.discount_amount)}</dd></div>}
            <div className="total"><dt>Total</dt><dd>{formatMoney(order.total_amount ?? order.grand_total)}</dd></div>
          </dl>
          {order.shipping_address && <div className="summary-address"><strong>Deliver to</strong><p>{order.shipping_address.line1}, {order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''} — {order.shipping_address.postal_code}</p></div>}
        </aside>
      </section>
    </div>
  );
}
