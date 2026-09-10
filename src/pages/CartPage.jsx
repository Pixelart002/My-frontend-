import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RiArrowLeftLine, RiArrowRightLine, RiSubtractLine, RiAddLine, RiDeleteBinLine, RiTruckLine, RiCloseLine, RiLockLine, RiLoader4Line } from '@remixicon/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import { EmptyState, Spinner, ErrorState } from '../components/ui/States';

function QuantityEditor({ item, disabled, onUpdate }) {
  const [value, setValue] = useState(String(item.quantity));

  useEffect(() => {
    setValue(String(item.quantity));
  }, [item.quantity]);

  const max = Math.max(1, Number(item.stock) || 9999);
  const commit = (requested) => {
    const next = Math.min(max, Math.max(1, Number.parseInt(requested, 10) || 1));
    setValue(String(next));
    if (next !== Number(item.quantity)) onUpdate(next);
  };

  return (
    <div className={`qty-stepper cart-qty ${disabled ? 'is-updating' : ''}`} aria-label={`Quantity for ${item.name}`}>
      <button type="button" onClick={() => commit(Number(item.quantity) - 1)} disabled={disabled || Number(item.quantity) <= 1} aria-label="Decrease quantity"><RiSubtractLine size={15} /></button>
      <span className="cart-qty-value" aria-live="polite">{value || '1'}</span>
      <button type="button" onClick={() => commit(Number(item.quantity) + 1)} disabled={disabled || Number(item.quantity) >= max} aria-label="Increase quantity"><RiAddLine size={15} /></button>
      {disabled && <RiLoader4Line className="cart-qty-spinner spin" size={13} aria-hidden="true" />}
    </div>
  );
}

export default function CartPage() {
  const { cart, loading, error, updateItem, removeItem, clearCart, reload } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  if (!isAuthenticated) {
    return <div className="page container cart-page"><div className="cart-page-heading"><p className="eyebrow">Your selection</p><h1>Your Cart</h1><p>Review your items before checkout.</p></div><EmptyState title="Your bag is waiting" message="Sign in to see the items in your bag." action={<Link className="btn" to="/login">Sign in</Link>} /></div>;
  }

  const items = cart?.items || [];

  if (loading && items.length === 0) return <div className="page container cart-page"><Spinner label="Loading your bag…" /></div>;

  if (error && items.length === 0) {
    return <div className="page container cart-page"><div className="cart-page-heading"><p className="eyebrow">Your selection</p><h1>Your Cart</h1><p>Review your items before checkout.</p></div><ErrorState message={error} onRetry={reload} /></div>;
  }

  if (items.length === 0) {
    return <div className="page container cart-page"><div className="cart-page-heading"><p className="eyebrow">Your selection</p><h1>Your Cart</h1><p>Your bag is ready when you are.</p></div><EmptyState title="Your bag is empty" message="Find something good to add." action={<Link className="btn" to="/shop">Continue shopping <RiArrowRightLine size={16} /></Link>} /></div>;
  }

  const handleQuantity = async (productId, quantity) => {
    if (updatingId) return;
    setUpdatingId(productId);
    try {
      await updateItem(productId, quantity);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page container cart-page">
      <Link className="cart-back" to="/shop"><RiArrowLeftLine size={17} /> Continue shopping</Link>
      <div className="cart-page-heading">
        <p className="eyebrow">Your selection</p>
        <h1>Your Cart</h1>
        <p>Review your items before checkout.</p>
      </div>
      {error && <div className="notice error cart-action-notice" role="alert">{error}</div>}

      <div className="cart-layout cart-layout-refined">
        <section className="cart-items" aria-label="Cart items">
          {cart.has_unavailable_items && <div className="notice warn">Some items are no longer available. Please remove them to check out.</div>}
          {items.map((item) => {
            const unavailable = !item.in_stock || item.is_active === false;
            const updating = updatingId === item.product_id;
            return (
              <article className={`cart-card ${unavailable ? 'is-unavailable' : ''} ${updating ? 'is-updating' : ''}`} key={item.product_id || item.id}>
                <Link to={`/product/${item.slug || item.product_id}`} className="cart-card-thumb">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>{(item.name || 'L').slice(0, 1)}</span>}
                </Link>
                <div className="cart-card-main">
                  <div className="cart-card-copy">
                    <p className="product-category">{item.hsn_code ? `HSN ${item.hsn_code}` : 'Product'}</p>
                    <h2><Link to={`/product/${item.slug || item.product_id}`}>{item.name}</Link></h2>
                    {unavailable && <p className="cart-unavailable">Unavailable</p>}
                    {item.price_changed && <p className="cart-changed">Price updated since added</p>}
                    <p className="cart-unit">{formatMoney(item.unit_price)} each</p>
                  </div>
                  <div className="cart-card-controls">
                    <QuantityEditor item={item} disabled={unavailable || updating} onUpdate={(quantity) => handleQuantity(item.product_id, quantity)} />
                    <strong className="cart-line-total" key={`${item.product_id}-${item.line_total}`}>{formatMoney(item.line_total)}</strong>
                  </div>
                </div>
                <button className="cart-remove" onClick={() => removeItem(item.product_id)} aria-label={`Remove ${item.name}`} disabled={loading || updating}><RiCloseLine size={18} /></button>
              </article>
            );
          })}

          <div className="cart-utilities">
            <button className="btn btn-ghost" onClick={clearCart} disabled={loading}><RiDeleteBinLine size={15} /> Clear bag</button>
            <Link className="btn btn-ghost" to="/shop">Keep shopping <RiArrowRightLine size={15} /></Link>
          </div>
        </section>

        <aside className="summary cart-summary" aria-label="Order summary">
          <div className="summary-heading"><p className="eyebrow">Order summary</p></div>
          <dl className="summary-lines">
            <div><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{cart.shipping_cost > 0 ? formatMoney(cart.shipping_cost) : 'Free'}</dd></div>
            <div><dt>Taxes</dt><dd>{formatMoney(cart.tax_amount)}</dd></div>
            <div className="total"><dt>Total</dt><dd>{formatMoney(cart.total_amount)}</dd></div>
          </dl>
          {cart.free_shipping_eligible ? <p className="free-ship-note"><RiTruckLine size={16} /> You qualify for free shipping!</p> : cart.amount_to_free_shipping > 0 && <p className="free-ship-note"><RiTruckLine size={16} /> Add {formatMoney(cart.amount_to_free_shipping)} more for free shipping.</p>}
          <button className="btn btn-block cart-checkout" onClick={() => navigate('/checkout')} disabled={loading || Boolean(updatingId) || cart.has_unavailable_items || items.some((i) => !i.in_stock)}><RiLockLine size={17} /> Checkout securely <RiArrowRightLine size={17} /></button>
          <p className="cart-secure-note">Secure checkout · Your payment details are protected.</p>
        </aside>
      </div>
    </div>
  );
}
