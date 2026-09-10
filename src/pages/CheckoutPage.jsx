import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { RiLockLine, RiAddLine, RiArrowRightLine, RiCoupon3Line, RiCloseLine, RiArrowLeftLine } from '@remixicon/react';
import { userService } from '../services/users';
import { paymentService } from '../services/payments';
import { couponService } from '../services/coupons';
import { STRIPE_PK } from '../config/env';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import { Spinner, ErrorState } from '../components/ui/States';
import StripePaymentForm from '../components/checkout/StripePaymentForm';
import PaymentMethodModal from '../components/checkout/PaymentMethodModal';

const stripePromise = loadStripe(STRIPE_PK);

const stripeAppearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#d8ad6a', colorBackground: '#11100f', colorText: '#f5efe7',
    colorTextSecondary: '#a59b91', colorTextPlaceholder: '#6d655c', colorDanger: '#e0735f',
    borderRadius: '8px', fontFamily: 'DM Sans, system-ui, sans-serif',
  },
  rules: {
    '.Input': { border: '1px solid #3a3530', boxShadow: 'none', backgroundColor: '#1b1917' },
    '.Input:focus': { border: '1px solid #d8ad6a', boxShadow: '0 0 0 1px #d8ad6a' },
    '.Label': { color: '#a59b91' },
    '.Tab': { border: '1px solid #3a3530', backgroundColor: '#1b1917', color: '#f5efe7' },
    '.Tab--selected': { borderColor: '#d8ad6a', backgroundColor: '#24211e' },
  },
};

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
}

function AddressForm({ onSaved, onCancel }) {
  const [values, setValues] = useState({ line1: '', line2: '', city: '', state: '', postal_code: '', country: 'IN', phone: '', email: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!values.line1 || !values.city || !values.postal_code || !values.email.trim()) return setError('Please fill in street, city, postal code and email.');
    setSaving(true);
    try { await userService.addAddress({ line1: values.line1, line2: values.line2 || undefined, city: values.city, state: values.state || undefined, postal_code: values.postal_code, country: values.country.toUpperCase(), phone: values.phone || undefined, email: values.email.trim().toLowerCase() }); onSaved(); }
    catch (err) { setError(err.message || 'Unable to save this address.'); }
    finally { setSaving(false); }
  };
  return <form className="address-form" onSubmit={onSubmit}>
    {error && <div className="form-error">{error}</div>}
    <div className="field"><label htmlFor="addr-line1">Street address *</label><input id="addr-line1" value={values.line1} onChange={set('line1')} placeholder="House no, street" /></div>
    <div className="field"><label htmlFor="addr-line2">Apartment / area (optional)</label><input id="addr-line2" value={values.line2} onChange={set('line2')} placeholder="Apartment, landmark" /></div>
    <div className="field-grid"><div className="field"><label htmlFor="addr-city">City *</label><input id="addr-city" value={values.city} onChange={set('city')} /></div><div className="field"><label htmlFor="addr-state">State</label><input id="addr-state" value={values.state} onChange={set('state')} /></div></div>
    <div className="field-grid"><div className="field"><label htmlFor="addr-postal">Postal code *</label><input id="addr-postal" value={values.postal_code} onChange={set('postal_code')} /></div><div className="field"><label htmlFor="addr-country">Country</label><input id="addr-country" maxLength="2" value={values.country} onChange={set('country')} /></div></div>
    <div className="field"><label htmlFor="addr-email">Email address *</label><input id="addr-email" name="email" type="email" value={values.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" inputMode="email" required /></div>
    <div className="field"><label htmlFor="addr-phone">Phone (optional)</label><input id="addr-phone" name="phone" value={values.phone} onChange={set('phone')} placeholder="For delivery updates" autoComplete="tel" inputMode="tel" /></div>
    <div className="btn-row"><button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button><button className="btn btn-quiet" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading } = useCart();
  const [addresses, setAddresses] = useState(null); const [addressError, setAddressError] = useState(''); const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false); const [intent, setIntent] = useState(null); const [intentError, setIntentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null); const [paymentModalOpen, setPaymentModalOpen] = useState(false); const [paymentReview, setPaymentReview] = useState(false);
  const [creating, setCreating] = useState(false); const [checkoutKey, setCheckoutKey] = useState(''); const [couponInput, setCouponInput] = useState(''); const [coupon, setCoupon] = useState(null); const [couponError, setCouponError] = useState(''); const [couponLoading, setCouponLoading] = useState(false);

  const loadAddresses = useCallback(async () => { setAddressError(''); try { const list = await userService.getAddresses(); setAddresses(Array.isArray(list) ? list : []); } catch (err) { setAddressError(err.message || 'Unable to load your addresses.'); } }, []);
  useEffect(() => { loadAddresses(); }, [loadAddresses]);
  const items = cart?.items || [];
  const canProceed = items.length > 0 && !cart?.has_unavailable_items;
  const selectedAddress = useMemo(() => addresses?.find((addr) => addr.id === selected) || null, [addresses, selected]);
  const couponDiscount = Number(coupon?.discount) || 0;
  const finalTotal = Math.max((Number(cart?.total_amount) || 0) - couponDiscount, 0);

  const applyCoupon = async () => {
    const code = couponInput.trim(); if (!code || couponLoading || coupon) return; setCouponError(''); setCouponLoading(true);
    try { const result = await couponService.apply(code, cart?.subtotal); if (!result?.discount || Number(result.discount) <= 0) throw new Error('This coupon does not provide a discount for the current cart.'); setCoupon({ ...result, subtotal: Number(cart?.subtotal) || 0 }); setCouponInput(''); setIntent(null); setIntentError(''); }
    catch (err) { setCouponError(err?.message || 'Unable to apply this coupon.'); } finally { setCouponLoading(false); }
  };
  const removeCoupon = () => { setCoupon(null); setCouponError(''); setCouponInput(''); setIntent(null); setIntentError(''); };
  useEffect(() => { if (coupon && Number(coupon.subtotal) !== Number(cart?.subtotal || 0)) removeCoupon(); }, [cart?.subtotal]);

  const openPaymentChooser = () => { if (!selected || creating) return; setIntentError(''); setPaymentReview(false); setIntent(null); setPaymentModalOpen(true); };
  const startPayment = async () => {
    if (!selected || creating || !paymentMethod) return; setCreating(true); setIntentError('');
    try {
      const key = checkoutKey || makeIdempotencyKey(); if (!checkoutKey) setCheckoutKey(key);
      if (paymentMethod === 'cod') { const order = await paymentService.createCodOrder(selected, key, null, coupon?.code || null); const orderNumber = order?.order_number; if (!orderNumber) throw new Error('COD order could not be created. Please try again.'); navigate('/order/success', { replace: true, state: { orderNumber, paymentMethod: 'cod' } }); return; }
      const data = await paymentService.createIntent(selected, key, null, coupon?.code || null); if (!data?.client_secret || !data?.payment_intent_id || !data?.order_number) throw new Error('Payment session was not created correctly. Please try again.'); setIntent(data);
    } catch (err) { const message = err?.code === 'NETWORK_ERROR' ? 'We could not reach the order service. Check your connection and try again.' : err?.code === 'TIMEOUT' ? 'The order service took too long to respond. Please retry.' : err?.status === 401 ? 'Your session has expired. Please sign in again.' : err?.message || 'Unable to place your order. Please try again.'; setIntentError(message); }
    finally { setCreating(false); }
  };
  const handleModalContinue = () => { if (!paymentReview) setPaymentReview(true); else startPayment(); };
  const handleModalBack = () => { if (intent) { setIntent(null); setIntentError(''); return; } setPaymentReview(false); setIntentError(''); };
  const intentOptions = useMemo(() => ({ clientSecret: intent?.client_secret, appearance: stripeAppearance, loader: 'auto' }), [intent]);

  if (cartLoading) return <div className="page container checkout-loading-page"><Spinner label="Preparing your checkout…" /></div>;
  if (!canProceed) return <div className="page container"><div className="page-heading compact"><p className="eyebrow">Checkout</p><h1>Your bag is empty.</h1></div><button className="btn" onClick={() => navigate('/shop')}>Continue shopping</button></div>;

  const paymentContent = intent?.client_secret ? <Elements stripe={stripePromise} options={intentOptions}><StripePaymentForm orderNumber={intent.order_number} onSuccess={() => navigate('/order/success', { replace: true, state: { orderNumber: intent.order_number, paymentMethod: 'stripe' } })} onBack={handleModalBack} /></Elements> : null;

  return <div className="page container checkout">
    <button type="button" className="checkout-back" onClick={() => navigate('/cart')}><RiArrowLeftLine size={16} /> Back to cart</button>
    <div className="checkout-heading page-heading compact"><p className="eyebrow"><RiLockLine size={13} /> Secure checkout</p><h1>Complete your order.</h1><p className="checkout-subtitle">Your address, payment and order total stay protected throughout checkout.</p></div>
    <div className="checkout-steps" aria-label="Checkout progress"><span className="is-complete"><b>1</b> Shipping</span><i /><span className="is-current"><b>2</b> Payment</span><i /><span><b>3</b> Review</span></div>
    <div className="checkout-layout checkout-layout-refined">
      <div className="checkout-main">
        <section className="checkout-section"><h2>1 · Delivery address</h2>
          {addressError && <ErrorState message={addressError} onRetry={loadAddresses} />}
          {addresses && addresses.length > 0 && !showForm && <div className="address-list">{addresses.map((addr) => <label key={addr.id} className={`address-card ${selected === addr.id ? 'is-selected' : ''}`}><input type="radio" name="address" checked={selected === addr.id} onChange={() => { setSelected(addr.id); setIntent(null); setPaymentModalOpen(false); setPaymentReview(false); }} /><div><strong>{addr.full_name || 'Delivery'}</strong><p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}{addr.state ? `, ${addr.state}` : ''} — {addr.postal_code}, {addr.country}</p>{addr.email && <p>{addr.email}</p>}{addr.is_default && <span className="chip chip-sm">Default</span>}</div></label>)}<button className="btn btn-quiet btn-sm" type="button" onClick={() => setShowForm(true)}><RiAddLine size={15} /> Add a new address</button></div>}
          {addresses && addresses.length === 0 && !showForm && <div className="state"><p>You’ll need a delivery address to check out.</p></div>}
          {showForm && <AddressForm onSaved={() => { setShowForm(false); loadAddresses(); }} onCancel={() => setShowForm(false)} />}
        </section>
        <section className="checkout-section"><h2>2 · Coupon</h2>
          {coupon ? <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label"><RiCoupon3Line size={15} /> Applied coupon</span><strong>{coupon.code}</strong><small>You saved {formatMoney(couponDiscount)} on this order.</small></div><button className="btn btn-quiet btn-sm" type="button" onClick={removeCoupon}><RiCloseLine size={15} /> Remove</button></div> : <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label"><RiCoupon3Line size={15} /> Have a coupon?</span><small>Enter a valid promo code to apply the backend-calculated discount.</small></div><div className="coupon-input-row"><input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} placeholder="PROMO CODE" maxLength={40} autoComplete="off" aria-label="Coupon code" /><button className="btn" type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}>{couponLoading ? 'Applying…' : 'Apply'}</button></div></div>}
          {couponError && <div className="form-error" role="alert">{couponError}</div>}
        </section>
        <section className="checkout-section checkout-payment-launch"><h2>3 · Payment</h2>
          {intentError && <div className="form-error" role="alert">{intentError}</div>}
          <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label">Payment &amp; review</span><strong>{paymentMethod === 'stripe' ? 'Stripe' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Choose a payment method'}</strong><small>Select your payment method, review the selected address and complete payment in the secure popup.</small></div><button className="btn" type="button" onClick={openPaymentChooser} disabled={creating || !selected}>{creating ? 'Preparing…' : 'Choose Payment Method'} <RiArrowRightLine size={17} /></button></div>
        </section>
      </div>
      <aside className="summary checkout-summary"><p className="eyebrow">Order summary</p><ul className="summary-items">{items.slice(0, 6).map((item) => <li key={item.product_id}><span>{item.name} × {item.quantity}</span><strong>{formatMoney(item.line_total)}</strong></li>)}{items.length > 6 && <li><span>+ {items.length - 6} more</span></li>}</ul><dl className="summary-lines"><div><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{cart.shipping_cost > 0 ? formatMoney(cart.shipping_cost) : 'Free'}</dd></div><div><dt>Taxes</dt><dd>{formatMoney(cart.tax_amount)}</dd></div>{couponDiscount > 0 && <div><dt>Coupon</dt><dd>−{formatMoney(couponDiscount)}</dd></div>}<div className="total"><dt>Total</dt><dd>{formatMoney(finalTotal)}</dd></div></dl>{cart.amount_to_free_shipping > 0 && !cart.free_shipping_eligible && <p className="free-ship-note"><RiArrowRightLine size={15} /> Add {formatMoney(cart.amount_to_free_shipping)} more for free shipping.</p>}</aside>
    </div>
    <PaymentMethodModal open={paymentModalOpen} value={paymentMethod} onChange={(method) => { setPaymentMethod(method); setIntent(null); setIntentError(''); }} onClose={() => { if (!creating) { setPaymentModalOpen(false); setPaymentReview(false); setIntent(null); } }} onContinue={handleModalContinue} loading={creating} review={paymentReview} address={selectedAddress} total={formatMoney(finalTotal)} onBack={handleModalBack}>{paymentContent}</PaymentMethodModal>
  </div>;
}
