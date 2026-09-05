import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { RiArrowRightLine, RiSubtractLine, RiAddLine, RiDeleteBinLine, RiTruckLine, RiCloseLine } from '@remixicon/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import { EmptyState, Spinner } from '../components/ui/States';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="page container">
        <div className="page-heading compact"><p className="eyebrow">Your selection</p><h1>Your bag.</h1></div>
        <EmptyState
          title="Your bag is waiting"
          message="Sign in to see the items in your bag."
          action={<Link className="btn" to="/login">Sign in</Link>}
        />
      </div>
    );
  }

  const items = cart?.items || [];

  if (loading && items.length === 0) {
    return <div className="page container"><Spinner label="Loading your bag…" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="page container">
        <div className="page-heading compact"><p className="eyebrow">Your selection</p><h1>Your bag.</h1></div>
        <EmptyState
          title="Your bag is empty"
          message="Find something good to add."
          action={<Link className="btn" to="/shop">Continue shopping <RiArrowRightLine size={16} /></Link>}
        />
      </div>
    );
  }

  return (
    <div className="page container">
      <div className="page-heading compact">
        <p className="eyebrow">Your selection</p>
        <h1>Your bag.</h1>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.has_unavailable_items && (
            <div className="notice warn">Some items are no longer available. Please remove them to check out.</div>
          )}
          {items.map((item) => {
            const unavailable = !item.in_stock || item.is_active === false;
            return (
              <div className={`cart-row ${unavailable ? 'is-unavailable' : ''}`} key={item.product_id || item.id}>
                <Link to={`/product/${item.slug || item.product_id}`} className="cart-thumb">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>{(item.name || 'L').slice(0, 1)}</span>}
                </Link>
                <div className="cart-info">
                  <p className="product-category">{item.hsn_code ? `HSN ${item.hsn_code}` : 'Product'}</p>
                  <h3>{item.name}</h3>
                  {unavailable && <p className="cart-unavailable">Unavailable</p>}
                  {item.price_changed && <p className="cart-changed">Price updated since added</p>}
                  <p className="cart-unit">{formatMoney(item.unit_price)} each</p>
                </div>

                <div className="qty-stepper cart-qty">
                  <button onClick={() => updateItem(item.product_id, Math.max(1, Number(item.quantity) - 1))} disabled={unavailable} aria-label="Decrease quantity"><RiSubtractLine size={15} /></button>
                  <input readOnly value={item.quantity} aria-label="Quantity" />
                  <button onClick={() => updateItem(item.product_id, Number(item.quantity) + 1)} disabled={unavailable || Number(item.quantity) >= Number(item.stock)} aria-label="Increase quantity"><RiAddLine size={15} /></button>
                </div>

                <strong className="cart-line-total">{formatMoney(item.line_total)}</strong>
                <button className="cart-remove" onClick={() => removeItem(item.product_id)} aria-label="Remove item"><RiCloseLine size={16} /></button>
              </div>
            );
          })}

          <div className="cart-utilities">
            <button className="btn btn-ghost" onClick={clearCart}><RiDeleteBinLine size={14} /> Clear bag</button>
            <Link className="btn btn-ghost" to="/shop">Keep shopping</Link>
          </div>
        </div>

        <aside className="summary">
          <p className="eyebrow">Order summary</p>
          <dl className="summary-lines">
            <div><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{cart.shipping_cost > 0 ? formatMoney(cart.shipping_cost) : 'Free'}</dd></div>
            <div><dt>Taxes</dt><dd>{formatMoney(cart.tax_amount)}</dd></div>
            <div className="total"><dt>Total</dt><dd>{formatMoney(cart.total_amount)}</dd></div>
          </dl>

          {cart.free_shipping_eligible ? (
            <p className="free-ship-note"><RiTruckLine size={14} /> You qualify for free shipping!</p>
          ) : (
            cart.amount_to_free_shipping > 0 && (
              <p className="free-ship-note"><RiTruckLine size={14} /> Add {formatMoney(cart.amount_to_free_shipping)} more for free shipping.</p>
            )
          )}

          <button className="btn btn-block" onClick={() => navigate('/checkout')} disabled={cart.has_unavailable_items || items.some((i) => !i.in_stock)}>
            Checkout securely <RiArrowRightLine size={16} />
          </button>
        </aside>
      </div>
    </div>
  );
}
