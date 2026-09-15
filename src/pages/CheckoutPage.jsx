import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { RiArrowLeftLine, RiAddLine, RiCloseLine, RiCoupon3Line, RiLockLine, RiArrowRightLine, RiAlertLine } from '@remixicon/react';
import { stripePromise, stripeAppearance } from '../lib/stripe';
import { useCart } from '../context/CartContext';
import { userService } from '../services/users';
import { couponService } from '../services/coupons';
import { paymentService } from '../services/payments';
import AddressForm from '../components/account/AddressForm';
import PaymentMethodModal from '../components/checkout/PaymentMethodModal';
import StripePaymentForm from '../components/checkout/StripePaymentForm';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import { formatMoney, makeIdempotencyKey } from '../utils/formatters';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentReview, setPaymentReview] = useState(false);
  const [intent, setIntent] = useState(null);
  const [intentError, setIntentError] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [checkoutKey, setCheckoutKey] = useState('');
  const [paymentSessionKey, setPaymentSessionKey] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const loadAddresses = useCallback(async () => { setAddressError(''); try { const list = await userService.getAddresses(); setAddresses(Array.isArray(list) ? list : []); } catch (err) { setAddressError(err.message || 'Unable to load your addresses.'); } }, []);
  useEffect(() => { loadAddresses(); }, [loadAddresses]);
  const items = cart?.items || [];
  const canProceed = items.length > 0 && !cart?.has_unavailable_items;
  const selectedAddress = useMemo(() => addresses?.find((addr) => addr.id === selected) || null, [addresses, selected]);
  const couponDiscount = Number(coupon?.discount) || 0;
  const finalTotal = Math.max((Number(cart?.total_amount) || 0) - couponDiscount, 0);

  const applyCoupon = async () => { const code = couponInput.trim(); if (!code || couponLoading || coupon || activeOrder) return; setCouponError(''); setCouponLoading(true); try { const result = await couponService.apply(code, cart?.subtotal); if (!result?.discount || Number(result.discount) <= 0) throw new Error('This coupon does not provide a discount for the current cart.'); setCoupon({ ...result, subtotal: Number(cart?.subtotal) || 0 }); setCouponInput(''); setIntent(null); setIntentError(''); } catch (err) { setCouponError(err?.message || 'Unable to apply this coupon.'); } finally { setCouponLoading(false); } };
  const removeCoupon = () => { if (activeOrder) return; setCoupon(null); setCouponError(''); setCouponInput(''); setIntent(null); setIntentError(''); };
  useEffect(() => { if (coupon && Number(coupon.subtotal) !== Number(cart?.subtotal || 0) && !activeOrder) removeCoupon(); }, [cart?.subtotal, activeOrder]);

  const openPaymentChooser = () => { if (!selected || creating || activeOrder) return; setIntentError(''); setPaymentReview(false); setIntent(null); setPaymentModalOpen(true); };
  const startPayment = async () => {
    if (!selected || creating || !paymentMethod || activeOrder) return; setCreating(true); setIntentError('');
    try {
      const key = checkoutKey || makeIdempotencyKey(); if (!checkoutKey) setCheckoutKey(key);
      if (paymentMethod === 'cod') {
        const order = await paymentService.createCodOrder(selected, key, null, coupon?.code || null); const orderNumber = order?.order_number;
        if (!orderNumber) throw new Error('COD order could not be created. Please try again.');
        setActiveOrder({ orderNumber, orderId: order?.order_id, paymentMethod: 'cod' }); setPaymentReview(true); return;
      }
      const data = await paymentService.createIntent(selected, key, null, coupon?.code || null);
      if (!data?.client_secret || !data?.payment_intent_id || !data?.order_number) throw new Error('Payment session was not created correctly. Please try again.');
      setIntent(data); setActiveOrder({ orderNumber: data.order_number, orderId: data.order_id, paymentMethod: 'stripe', paymentIntentId: data.payment_intent_id });
    } catch (err) { const message = err?.code === 'NETWORK_ERROR' ? 'We could not reach the order service. Check your connection and try again.' : err?.code === 'TIMEOUT' ? 'The order service took too long to respond. Please retry.' : err?.status === 401 ? 'Your session has expired. Please sign in again.' : err?.message || 'Unable to place your order. Please try again.'; setIntentError(message); } finally { setCreating(false); }
  };

  const handleModalContinue = () => { if (!paymentReview) setPaymentReview(true); else startPayment(); };
  const handleModalBack = () => { if (activeOrder) return; if (intent) { setIntent(null); setIntentError(''); return; } setPaymentReview(false); setIntentError(''); };
  const requestCancelOrder = () => { if (activeOrder && !cancellingOrder) setCancelConfirmOpen(true); };
  const cancelActiveOrder = async () => {
    if (!activeOrder?.orderNumber || cancellingOrder) return; setCancellingOrder(true); setIntentError('');
    try { await paymentService.cancelCheckout(activeOrder.orderNumber); setCancelConfirmOpen(false); setPaymentModalOpen(false); setPaymentReview(false); setIntent(null); setActiveOrder(null); setCheckoutKey(''); setPaymentSessionKey(''); navigate('/cart', { replace: true }); }
    catch (err) { setIntentError(err?.message || 'We could not cancel this order safely. Please try again.'); setCancelConfirmOpen(false); }
    finally { setCancellingOrder(false); }
  };
  const retryPayment = async (orderNumber) => {
    const data = await paymentService.retry(orderNumber); if (!data?.client_secret || !data?.payment_intent_id) throw new Error('A fresh payment session could not be created.');
    setPaymentSessionKey(`${data.payment_intent_id}:${Date.now()}`);
    setIntent(data); setActiveOrder((current) => ({ ...(current || {}), orderNumber: data.order_number || orderNumber, orderId: data.order_id, paymentMethod: 'stripe', paymentIntentId: data.payment_intent_id }));
  };
  const goToOrderSuccess = (orderNumber, method) => {
    const number = String(orderNumber || '').trim();
    if (!number) { navigate('/orders', { replace: true }); return; }
    const params = new URLSearchParams({ order: number, payment: method });
    navigate(`/order/success?${params.toString()}`, { replace: true });
  };
  const intentOptions = useMemo(() => ({ clientSecret: intent?.client_secret, appearance: stripeAppearance, loader: 'auto' }), [intent]);

  if (cartLoading) return <div className="page container checkout-loading-page"><Spinner label="Preparing your checkout…" /></div>;
  if (!canProceed && !activeOrder) return <div className="page container"><div className="page-heading compact"><p className="eyebrow">Checkout</p><h1>Your bag is empty.</h1></div><button className="btn" onClick={() => navigate('/shop')}>Continue shopping</button></div>;

  const paymentContent = intent?.client_secret ? <Elements key={paymentSessionKey || intent.payment_intent_id} stripe={stripePromise} options={intentOptions}><StripePaymentForm orderNumber={intent.order_number || activeOrder?.orderNumber} clientSecret={intent.client_secret} onSuccess={() => goToOrderSuccess(intent.order_number || activeOrder?.orderNumber, 'stripe')} onBack={handleModalBack} onRetry={retryPayment} onCancelOrder={requestCancelOrder} /></Elements> : null;

  return <div className="page container checkout">
    <button type="button" className="checkout-back" onClick={() => { if (!activeOrder) navigate('/cart'); }} disabled={Boolean(activeOrder)}><RiArrowLeftLine size={16} /> Back to cart</button>
    <div className="checkout-heading page-heading compact"><p className="eyebrow"><RiLockLine size={13} /> Secure checkout</p><h1>Complete your order.</h1><p className="checkout-subtitle">Your address, payment and order total stay protected throughout checkout.</p></div>
    <div className="checkout-steps" aria-label="Checkout progress"><span className="is-complete"><b>1</b> Shipping</span><i /><span className="is-current"><b>2</b> Payment</span><i /><span><b>3</b> Review</span></div>
    <div className="checkout-layout checkout-layout-refined">
      <div className="checkout-main">
        <section className="checkout-section"><h2>1 · Delivery address</h2>{addressError && <ErrorState message={addressError} onRetry={loadAddresses} />}{addresses && addresses.length > 0 && !showForm && <div className="address-list">{addresses.map((addr) => <label key={addr.id} className={`address-card ${selected === addr.id ? 'is-selected' : ''}`}><input type="radio" name="address" disabled={Boolean(activeOrder)} checked={selected === addr.id} onChange={() => { setSelected(addr.id); setIntent(null); setPaymentModalOpen(false); setPaymentReview(false); }} /><div><strong>{addr.full_name || 'Delivery'}</strong><p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, ${addr.city}{addr.state ? `, ${addr.state}` : ''} — {addr.postal_code}, {addr.country}</p>{addr.email && <p>{addr.email}</p>}{addr.is_default && <span className="chip chip-sm">Default</span>}</div></label>)}<button className="btn btn-quiet btn-sm" type="button" disabled={Boolean(activeOrder)} onClick={() => setShowForm(true)}><RiAddLine size={15} /> Add a new address</button></div>}{addresses && addresses.length === 0 && !showForm && <div className="state"><p>You’ll need a delivery address to check out.</p></div>}{showForm && !activeOrder && <AddressForm onSaved={() => { setShowForm(false); loadAddresses(); }} onCancel={() => setShowForm(false)} />}</section>
        <section className="checkout-section"><h2>2 · Coupon</h2>{coupon ? <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label"><RiCoupon3Line size={15} /> Applied coupon</span><strong>{coupon.code}</strong><small>You saved {formatMoney(couponDiscount)} on this order.</small></div><button className="btn btn-quiet btn-sm" type="button" disabled={Boolean(activeOrder)} onClick={removeCoupon}><RiCloseLine size={15} /> Remove</button></div> : <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label"><RiCoupon3Line size={15} /> Have a coupon?</span><small>Enter a valid promo code to apply the backend-calculated discount.</small></div><div className="coupon-input-row"><input disabled={Boolean(activeOrder)} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} placeholder="PROMO CODE" maxLength={40} autoComplete="off" aria-label="Coupon code" /><button className="btn" type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim() || Boolean(activeOrder)}>{couponLoading ? 'Applying…' : 'Apply'}</button></div></div>}{couponError && <div className="form-error" role="alert">{couponError}</div>}</section>
        <section className="checkout-section checkout-payment-launch"><h2>3 · Payment</h2>{intentError && <div className="form-error" role="alert">{intentError}</div>}<div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label">Payment &amp; review</span><strong>{paymentMethod === 'stripe' ? 'Stripe' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Choose payment method'}</strong><small>{activeOrder ? `Order ${activeOrder.orderNumber} is active. Finish payment or cancel this order.` : 'Select your payment method, review the selected address and complete payment in the secure popup.'}</small></div><button className="btn" type="button" onClick={openPaymentChooser} disabled={creating || !selected || Boolean(activeOrder)}>{creating ? 'Preparing…' : 'Choose Payment Method'} <RiArrowRightLine size={17} /></button></div></section>
      </div>
      <aside className="summary checkout-summary"><p className="eyebrow">Order summary</p><ul className="summary-items">{items.slice(0, 6).map((item) => <li key={item.product_id}><span>{item.name} × {item.quantity}</span><strong>{formatMoney(item.line_total)}</strong></li>)}{items.length > 6 && <li><span>+ {items.length - 6} more</span></li>}</ul><dl className="summary-lines"><div><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{cart.shipping_cost > 0 ? formatMoney(cart.shipping_cost) : 'Free'}</dd></div><div><dt>Taxes</dt><dd>{formatMoney(cart.tax_amount)}</dd></div>{couponDiscount > 0 && <div><dt>Coupon</dt><dd>−{formatMoney(couponDiscount)}</dd></div>}<div className="total"><dt>Total</dt><dd>{formatMoney(finalTotal)}</dd></div></dl>{cart.amount_to_free_shipping > 0 && !cart.free_shipping_eligible && <p className="free-ship-note"><RiArrowRightLine size={15} /> Add {formatMoney(cart.amount_to_free_shipping)} more for free shipping.</p>}</aside>
    </div>
    <PaymentMethodModal open={paymentModalOpen} value={paymentMethod} onChange={(method) => { if (activeOrder) return; setPaymentMethod(method); setIntent(null); setIntentError(''); }} onClose={() => { if (!creating && !activeOrder) { setPaymentModalOpen(false); setPaymentReview(false); setIntent(null); } }} onContinue={handleModalContinue} loading={creating} review={paymentReview} address={selectedAddress} total={formatMoney(finalTotal)} onBack={handleModalBack} activeOrder={activeOrder} onCancelOrder={requestCancelOrder} cancellingOrder={cancellingOrder}>{paymentContent || (activeOrder?.paymentMethod === 'cod' ? <div className="payment-review"><div className="payment-review-card"><RiAlertLine size={20} /><strong>COD order created</strong><p>Order <b>{activeOrder.orderNumber}</b> is reserved for you. You can cancel it here before processing.</p></div></div> : null)}</PaymentMethodModal>
    {cancelConfirmOpen && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title"><h3 id="cancel-order-title">Cancel this order?</h3><p>This will cancel order <b>{activeOrder?.orderNumber}</b> and release its reservation. You can place a new order afterward.</p><div className="modal-actions"><button type="button" className="btn btn-quiet" onClick={() => setCancelConfirmOpen(false)} disabled={cancellingOrder}>Keep order</button><button type="button" className="btn" onClick={cancelActiveOrder} disabled={cancellingOrder}>{cancellingOrder ? 'Cancelling…' : 'Cancel order'}</button></div></div></div>}
  </div>;
}
