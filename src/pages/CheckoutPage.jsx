import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiAlertLine, RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiCoupon3Line, RiLockLine, RiErrorWarningLine } from '@remixicon/react';
import { STRIPE_PK } from '../config/env';
import { useCart } from '../context/CartContext';
import { userService } from '../services/users';
import { couponService } from '../services/coupons';
import { shippingService } from '../services/shipping';
import { paymentService } from '../services/payments';
import PaymentMethodModal from '../components/checkout/PaymentMethodModal';
import StripePaymentForm from '../components/checkout/StripePaymentForm';
import { ErrorState, Spinner } from '../components/ui/States';
import { formatMoney } from '../utils/format';
import { useFocusTrap } from '../hooks/useFocusTrap';

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;
const makeIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const emptyAddress = {
  full_name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '',
  postal_code: '', country: 'IN', landmark: '', address_type: 'home', company_name: '', gstin: '', is_default: false,
};

function AddressForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.email.trim() || !form.line1.trim() || !form.city.trim() || !form.postal_code.trim()) {
      setError('Email, address line, city and PIN code are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries({ ...form, country: 'IN' }).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
      await userService.addAddress(payload);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Unable to save the address.');
    } finally {
      setBusy(false);
    }
  };
  return <form className="address-form" onSubmit={submit}>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="field-grid"><div className="field"><label>Full name</label><input value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} autoComplete="name" /></div><div className="field"><label>Email *</label><input type="email" required value={form.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" /></div></div>
    <div className="field-grid"><div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setField('phone', e.target.value)} autoComplete="tel" inputMode="tel" maxLength={20} /></div><div className="field"><label>PIN code *</label><input required value={form.postal_code} onChange={(e) => setField('postal_code', e.target.value)} autoComplete="postal-code" inputMode="numeric" maxLength={10} /></div></div>
    <div className="field"><label>Address line 1 *</label><input required value={form.line1} onChange={(e) => setField('line1', e.target.value)} autoComplete="address-line1" /></div>
    <div className="field"><label>Address line 2</label><input value={form.line2} onChange={(e) => setField('line2', e.target.value)} autoComplete="address-line2" /></div>
    <div className="field-grid"><div className="field"><label>City *</label><input required value={form.city} onChange={(e) => setField('city', e.target.value)} autoComplete="address-level2" /></div><div className="field"><label>State</label><input value={form.state} onChange={(e) => setField('state', e.target.value)} autoComplete="address-level1" /></div></div>
    <div className="field-grid"><div className="field"><label>Landmark</label><input value={form.landmark} onChange={(e) => setField('landmark', e.target.value)} /></div><div className="field"><label>Address type</label><select value={form.address_type} onChange={(e) => setField('address_type', e.target.value)}><option value="home">Home</option><option value="office">Office</option><option value="other">Other</option></select></div></div>
    <label className="check-line"><input type="checkbox" checked={form.is_default} onChange={(e) => setField('is_default', e.target.checked)} /> <span>Make this my default address</span></label>
    <div className="btn-row"><button type="button" className="btn btn-quiet" onClick={onCancel} disabled={busy}>Cancel</button><button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button></div>
  </form>;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, reload: reloadCart } = useCart();
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
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState('');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const cancelModalRef = useRef(null);
  const cancelCloseRef = useRef(null);

  const loadAddresses = useCallback(async () => {
    setAddressError('');
    try {
      const list = await userService.getAddresses();
      const next = Array.isArray(list) ? list : [];
      setAddresses(next);
      setSelected((current) => current || next.find((address) => address.is_default)?.id || next[0]?.id || '');
    } catch (err) {
      setAddressError(err?.message || 'Unable to load your addresses.');
    }
  }, []);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const items = cart?.items || [];
  const canProceed = items.length > 0 && !cart?.has_unavailable_items;
  const selectedAddress = useMemo(() => addresses.find((address) => String(address.id) === String(selected)) || null, [addresses, selected]);
  const couponDiscount = Number(coupon?.discount) || 0;
  const finalTotal = Math.max((Number(cart?.total_amount) || 0) - couponDiscount, 0);

  const shippingTaxEstimate = useMemo(() => {
    if (!shippingQuote || !Number.isFinite(Number(shippingQuote.shipping_cost)) || Number(cart?.subtotal) <= 0) return 0;
    const shipping = Number(shippingQuote.shipping_cost);
    const subtotal = Number(cart.subtotal) || 0;
    let tax = 0;
    for (const item of items) {
      const value = (Number(item?.price_snapshot ?? item?.unit_price) || 0) * (Number(item?.quantity) || 0);
      const gst = Number(item?.gst_percentage);
      if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(gst) || gst < 0) continue;
      tax += (shipping * value / subtotal) * gst / 100;
    }
    return Math.round(tax * 100) / 100;
  }, [shippingQuote, cart?.subtotal, items]);

  const estimatedCheckoutTotal = finalTotal + (Number(shippingQuote?.shipping_cost) || 0) + shippingTaxEstimate;

  const shipmentWeightKg = useMemo(() => {
    let total = 0;
    for (const item of items) {
      const raw = Number(item?.weight);
      if (!Number.isFinite(raw) || raw <= 0) continue;
      const unit = String(item?.weight_unit || 'g').toLowerCase();
      const kg = unit === 'kg' ? raw : unit === 'mg' ? raw / 1000000 : unit === 'lb' ? raw * 0.45359237 : raw / 1000;
      total += kg * Math.max(0, Number(item?.quantity) || 0);
    }
    return total > 0 ? total : 0.5;
  }, [items]);


  useEffect(() => {
    let cancelled = false;
    const loadLiveShipping = async () => {
      if (!selectedAddress?.postal_code || !items.length) {
        setShippingQuote(null);
        setShippingOptions([]);
        setSelectedCourierId('');
        setShippingQuoteError('');
        return;
      }
      setShippingQuoteLoading(true);
      setShippingQuoteError('');
      try {
        const result = await shippingService.providerRate({
          deliveryPostcode: selectedAddress.postal_code,
          weightKg: shipmentWeightKg,
          cod: paymentMethod === 'cod',
          declaredValue: Number(cart?.subtotal) || 0,
        });
        const data = result?.data || result || {};
        const quotes = Array.isArray(data?.couriers) ? data.couriers : Array.isArray(data?.quotes) ? data.quotes : [];
        const serverSelected = data?.selected;
        if (!quotes.length && (!serverSelected || Number.isNaN(Number(serverSelected.shipping_cost)))) {
          throw new Error('Live Shiprocket courier options were not returned.');
        }
        const options = quotes.length ? quotes : [serverSelected];
        const currentId = selectedCourierId ? String(selectedCourierId) : '';
        const preserved = options.find((quote) => String(quote?.courier_id || '') === currentId);
        const next = preserved || serverSelected || options[0];
        if (!next || Number.isNaN(Number(next.shipping_cost)) || !next.courier_id) {
          throw new Error('Live Shiprocket courier options are incomplete.');
        }
        if (!cancelled) {
          setShippingOptions(options);
          setSelectedCourierId(String(next.courier_id));
          setShippingQuote(next);
        }
      } catch (err) {
        if (!cancelled) {
          setShippingQuote(null);
          setShippingQuoteError(err?.message || 'Live shipping could not be calculated yet.');
        }
      } finally {
        if (!cancelled) setShippingQuoteLoading(false);
      }
    };
    loadLiveShipping();
    return () => { cancelled = true; };
  }, [selectedAddress?.postal_code, shipmentWeightKg, paymentMethod, cart?.subtotal, items.length]);



  const selectCourier = (courier) => {
    if (!courier?.courier_id) return;
    setSelectedCourierId(String(courier.courier_id));
    setShippingQuote(courier);
    resetPayment();
  };

  const resetPayment = () => {
    setIntent(null);
    setIntentError('');
    setPaymentReview(false);
    setPaymentModalOpen(false);
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || couponLoading || coupon || activeOrder) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const result = await couponService.apply(code, cart?.subtotal);
      if (!result?.discount || Number(result.discount) <= 0) throw new Error('This coupon does not provide a discount for the current cart.');
      setCoupon({ ...result, subtotal: Number(cart?.subtotal) || 0 });
      setCouponInput('');
      resetPayment();
    } catch (err) {
      setCouponError(err?.message || 'Unable to apply this coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    if (activeOrder) return;
    setCoupon(null);
    setCouponError('');
    setCouponInput('');
    resetPayment();
  };

  useEffect(() => {
    if (coupon && Number(coupon.subtotal) !== Number(cart?.subtotal || 0) && !activeOrder) removeCoupon();
  }, [cart?.subtotal]);

  const openPaymentChooser = () => {
    if (!selected || !selectedCourierId || !shippingQuote || creating || activeOrder) return;
    setIntentError('');
    setPaymentReview(false);
    setIntent(null);
    setPaymentModalOpen(true);
  };

  const startPayment = async () => {
    if (!selected || creating || !paymentMethod || activeOrder) return;
    if (paymentMethod === 'stripe' && !stripePromise) {
      setIntentError('Online payment is temporarily unavailable. Please use another payment method.');
      return;
    }
    setCreating(true);
    setIntentError('');
    try {
      const key = checkoutKey || makeIdempotencyKey();
      if (!checkoutKey) setCheckoutKey(key);
      if (paymentMethod === 'cod') {
        const order = await paymentService.createCodOrder(selected, key, null, coupon?.code || null, selectedCourierId);
        const orderNumber = order?.order_number;
        if (!orderNumber) throw new Error('COD order could not be created. Please try again.');
        setActiveOrder({ orderNumber, orderId: order?.order_id, paymentMethod: 'cod' });
        setPaymentReview(true);
        return;
      }
      const data = await paymentService.createIntent(selected, key, null, coupon?.code || null, selectedCourierId);
      if (!data?.client_secret || !data?.payment_intent_id || !data?.order_number) throw new Error('Payment session was not created correctly. Please try again.');
      setIntent(data);
      setActiveOrder({ orderNumber: data.order_number, orderId: data.order_id, paymentMethod: 'stripe', paymentIntentId: data.payment_intent_id });
    } catch (err) {
      const message = err?.code === 'NETWORK_ERROR' ? 'We could not reach the order service. Check your connection and try again.' : err?.code === 'TIMEOUT' ? 'The order service took too long to respond. Please retry.' : err?.status === 401 ? 'Your session has expired. Please sign in again.' : err?.message || 'Unable to place your order. Please try again.';
      setIntentError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleModalContinue = () => {
    if (!paymentReview) setPaymentReview(true);
    else startPayment();
  };

  const handleModalBack = () => {
    if (activeOrder) return;
    if (intent) {
      setIntent(null);
      setIntentError('');
      return;
    }
    setPaymentReview(false);
    setIntentError('');
  };

  const requestCancelOrder = () => {
    if (activeOrder && !cancellingOrder) setCancelConfirmOpen(true);
  };

  useFocusTrap({
    enabled: cancelConfirmOpen,
    containerRef: cancelModalRef,
    initialFocusRef: cancelCloseRef,
    onEscape: () => { if (!cancellingOrder) setCancelConfirmOpen(false); },
  });

  const cancelActiveOrder = async () => {
    if (!activeOrder?.orderNumber || cancellingOrder) return;
    setCancellingOrder(true);
    setIntentError('');
    try {
      await paymentService.cancelCheckout(activeOrder.orderNumber);
      setCancelConfirmOpen(false);
      resetPayment();
      setActiveOrder(null);
      setCheckoutKey('');
      setPaymentSessionKey('');
      await reloadCart();
      navigate('/cart', { replace: true });
    } catch (err) {
      setIntentError(err?.message || 'We could not cancel this order safely. Please try again.');
      setCancelConfirmOpen(false);
    } finally {
      setCancellingOrder(false);
    }
  };

  const retryPayment = async (orderNumber) => {
    const data = await paymentService.retry(orderNumber);
    if (!data?.client_secret || !data?.payment_intent_id) throw new Error('A fresh payment session could not be created.');
    setPaymentSessionKey(`${data.payment_intent_id}:${Date.now()}`);
    setIntent(data);
    setActiveOrder((current) => ({ ...(current || {}), orderNumber: data.order_number || orderNumber, orderId: data.order_id, paymentMethod: 'stripe', paymentIntentId: data.payment_intent_id }));
  };

  const goToOrderSuccess = (orderNumber, method) => {
    const number = String(orderNumber || '').trim();
    if (!number) { navigate('/orders', { replace: true }); return; }
    navigate(`/order/success?${new URLSearchParams({ order: number, payment: method }).toString()}`, { replace: true });
  };

  if (cartLoading) return <div className="page container checkout-loading-page"><Spinner label="Preparing your checkout…" /></div>;
  if (!canProceed && !activeOrder) return <div className="page container"><div className="page-heading compact"><p className="eyebrow">Checkout</p><h1>Your bag is empty.</h1></div><button className="btn" onClick={() => navigate('/shop')}>Continue shopping</button></div>;

  const paymentContent = intent?.client_secret ? <Elements key={paymentSessionKey || intent.payment_intent_id} stripe={stripePromise} options={{ clientSecret: intent.client_secret, loader: 'auto' }}><StripePaymentForm orderNumber={intent.order_number || activeOrder?.orderNumber} clientSecret={intent.client_secret} onSuccess={() => goToOrderSuccess(intent.order_number || activeOrder?.orderNumber, 'stripe')} onRetry={retryPayment} /></Elements> : null;

  return <div className="page container checkout">
    <button type="button" className="checkout-back" onClick={() => { if (!activeOrder) navigate('/cart'); }} disabled={Boolean(activeOrder)}><RiArrowLeftLine size={16} /> Back to cart</button>
    <div className="checkout-heading page-heading compact"><p className="eyebrow"><RiLockLine size={13} /> Secure checkout</p><h1>Complete your order.</h1><p className="checkout-subtitle">Your address, payment and order total stay protected throughout checkout.</p></div>
    <div className="checkout-steps" aria-label="Checkout progress"><span className="is-complete"><b>1</b> Shipping</span><i /><span className="is-current" aria-current="step"><b>2</b> Payment</span><i /><span><b>3</b> Review</span></div>
    <div className="checkout-layout checkout-layout-refined"><div className="checkout-main">
      <section className="checkout-section"><div className="checkout-section-heading"><div><p className="section-kicker">Delivery</p><h2>1 · Delivery address</h2></div><span className="checkout-live-badge">Used for shipping</span></div>{addressError && <ErrorState message={addressError} onRetry={loadAddresses} />}{addresses.length > 0 && !showForm && <div className="address-list">{addresses.map((addr) => <label key={addr.id} className={`address-card ${String(selected) === String(addr.id) ? 'is-selected' : ''}`}><input type="radio" name="address" disabled={Boolean(activeOrder)} checked={String(selected) === String(addr.id)} onChange={() => { setSelected(addr.id); resetPayment(); }} /><div><strong>{addr.full_name || 'Delivery'}</strong><p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}{addr.state ? `, ${addr.state}` : ''} — {addr.postal_code}, {addr.country}</p>{addr.email && <p>{addr.email}</p>}{addr.is_default && <span className="chip chip-sm">Default</span>}</div></label>)}<button className="btn btn-quiet btn-sm" type="button" disabled={Boolean(activeOrder)} onClick={() => setShowForm(true)}><RiAddLine size={15} /> Add a new address</button></div>}{addresses.length === 0 && !showForm && <div className="state"><p>You’ll need a delivery address to check out.</p></div>}{showForm && !activeOrder && <AddressForm onSaved={() => { setShowForm(false); loadAddresses(); }} onCancel={() => setShowForm(false)} />}{selectedAddress && <div className="address-flow-note"><RiLockLine size={15} /><div><strong>Billing address</strong><span>Same as your delivery address. It will be mapped automatically to the order.</span></div></div>}</section>
      <section className="checkout-section checkout-shipping-options"><div className="checkout-section-heading"><div><p className="section-kicker">Shipping</p><h2>Choose delivery partner</h2></div><span className="checkout-live-badge">Live Shiprocket rates</span></div>
        {shippingQuoteLoading && <p className="free-ship-note" role="status">Loading available courier partners…</p>}
        {shippingQuoteError && <div className="form-error" role="alert">{shippingQuoteError}</div>}
        {!shippingQuoteLoading && !shippingQuoteError && shippingOptions.length > 0 && <div className="shipping-courier-list" role="radiogroup" aria-label="Choose delivery partner">
          {shippingOptions.map((courier) => {
            const id = String(courier?.courier_id || '');
            const checked = id === String(selectedCourierId);
            return <label key={id} className={`shipping-courier-card ${checked ? 'is-selected' : ''}`}>
              <input type="radio" name="shipping-courier" value={id} checked={checked} disabled={Boolean(activeOrder)} onChange={() => selectCourier(courier)} />
              <span className="shipping-courier-copy"><strong>{courier.courier_name || 'Shiprocket courier'}</strong><small>{courier.estimated_delivery_days ? `Estimated delivery: ${courier.estimated_delivery_days} days` : courier.etd_hours ? `Estimated delivery: ${courier.etd_hours} hours` : 'Delivery estimate from Shiprocket'}</small></span>
              <span className="shipping-courier-price">{formatMoney(courier.shipping_cost)}</span>
            </label>;
          })}
        </div>}
        {shippingQuote && <p className="free-ship-note"><RiArrowRightLine size={15} /> Selected: <b>{shippingQuote.courier_name || 'Shiprocket courier'}</b> · {formatMoney(shippingQuote.shipping_cost)}</p>}
      </section>
      <section className="checkout-section"><h2>2 · Coupon</h2>{coupon ? <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label"><RiCoupon3Line size={15} /> Applied coupon</span><strong>{coupon.code}</strong><small>You saved {formatMoney(couponDiscount)} on this order.</small></div><button className="btn btn-quiet btn-sm" type="button" disabled={Boolean(activeOrder)} onClick={removeCoupon}><RiCloseLine size={15} /> Remove</button></div> : <div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label"><RiCoupon3Line size={15} /> Have a coupon?</span><small>Enter a valid promo code to apply the backend-calculated discount.</small></div><div className="coupon-input-row"><input disabled={Boolean(activeOrder)} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }} placeholder="PROMO CODE" maxLength={40} autoComplete="off" aria-label="Coupon code" /><button className="btn" type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim() || Boolean(activeOrder)}>{couponLoading ? 'Applying…' : 'Apply'}</button></div></div>}{couponError && <div className="form-error" role="alert">{couponError}</div>}</section>
      <section className="checkout-section checkout-payment-launch"><h2>3 · Payment</h2>{intentError && <div className="form-error" role="alert">{intentError}</div>}<div className="payment-selector"><div className="payment-selector-copy"><span className="payment-selector-label">Payment &amp; review</span><strong>{paymentMethod === 'stripe' ? 'Stripe' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Choose payment method'}</strong><small>{activeOrder ? `Order ${activeOrder.orderNumber} is active. Finish payment or cancel this order.` : 'Select your payment method, review the selected address and complete payment in the secure popup.'}</small></div><button className="btn" type="button" onClick={openPaymentChooser} disabled={creating || !selected || !selectedCourierId || !shippingQuote || Boolean(activeOrder)}>{creating ? 'Preparing…' : 'Choose Payment Method'} <RiArrowRightLine size={17} /></button></div></section>
    </div><aside className="summary checkout-summary"><p className="eyebrow">Order summary</p><ul className="summary-items">{items.slice(0, 6).map((item) => <li key={item.product_id}><span>{item.name} × {item.quantity}</span><strong>{formatMoney(item.line_total)}</strong></li>)}{items.length > 6 && <li><span>+ {items.length - 6} more</span></li>}</ul><dl className="summary-lines">
      <div><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal)}</dd></div>
      <div><dt>Shipping</dt><dd>{shippingQuote ? formatMoney(shippingQuote.shipping_cost) : shippingQuoteLoading ? "Calculating…" : "Calculated at checkout"}</dd></div>
      {shippingQuote && <div className="checkout-shipping-detail"><span><b>{shippingQuote.courier_name || "Shiprocket courier"}</b>{shippingQuote.estimated_delivery_days ? <small>Estimated delivery: {shippingQuote.estimated_delivery_days} days</small> : shippingQuote.etd_hours ? <small>Estimated delivery: {shippingQuote.etd_hours} hours</small> : null}</span><em>Live rate</em></div>}
      <div><dt>Product GST</dt><dd>{formatMoney(cart.tax_amount)}</dd></div>
      {shippingQuote && <div><dt>Shipping GST</dt><dd>{formatMoney(shippingTaxEstimate)}</dd></div>}
      {couponDiscount > 0 && <div><dt>Coupon</dt><dd>−{formatMoney(couponDiscount)}</dd></div>}
      <div className="total"><dt>{shippingQuote ? "Estimated total" : "Before shipping"}</dt><dd>{shippingQuote ? formatMoney(estimatedCheckoutTotal) : formatMoney(finalTotal)}</dd></div>
    </dl>{shippingQuoteLoading && <p className="free-ship-note shipping-loading-note" role="status">Calculating live courier rates…</p>}{shippingQuote && <p className="free-ship-note"><RiArrowRightLine size={15} /> Selected courier: {shippingQuote.courier_name || "Shiprocket courier"}.</p>}</aside></div>
    <PaymentMethodModal open={paymentModalOpen} value={paymentMethod} onChange={(method) => { if (activeOrder) return; setPaymentMethod(method); setIntent(null); setIntentError(''); }} onClose={() => { if (!creating && !activeOrder) resetPayment(); }} onContinue={handleModalContinue} loading={creating} review={paymentReview} address={selectedAddress} total={shippingQuote ? formatMoney(estimatedCheckoutTotal) : 'Shipping + GST calculated securely at payment'} onBack={handleModalBack} activeOrder={activeOrder} onCancelOrder={requestCancelOrder} cancellingOrder={cancellingOrder}>{paymentContent || (activeOrder?.paymentMethod === 'cod' ? <div className="payment-review"><div className="payment-review-card"><RiAlertLine size={20} /><strong>COD order created</strong><p>Order <b>{activeOrder.orderNumber}</b> is reserved for you.</p></div></div> : null)}</PaymentMethodModal>
    {cancelConfirmOpen && <div className="checkout-cancel-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancellingOrder) setCancelConfirmOpen(false); }}><div ref={cancelModalRef} className="checkout-cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" aria-describedby="cancel-order-description" tabIndex={-1}><div className="checkout-cancel-modal-icon" aria-hidden="true"><RiErrorWarningLine size={26} /></div><div className="checkout-cancel-modal-copy"><p className="eyebrow">Payment checkout</p><h3 id="cancel-order-title">Are you sure you want to cancel this order?</h3><p id="cancel-order-description">This will cancel order <b>#{activeOrder?.orderNumber}</b> and release its reserved stock. The cancelled order items will not be added back to your cart.</p></div><div className="checkout-cancel-modal-actions"><button ref={cancelCloseRef} type="button" className="btn btn-quiet" onClick={() => setCancelConfirmOpen(false)} disabled={cancellingOrder}>Keep order</button><button type="button" className="btn checkout-cancel-danger" onClick={cancelActiveOrder} disabled={cancellingOrder}>{cancellingOrder ? 'Cancelling…' : 'Yes, cancel order'}</button></div></div></div>}
  </div>;
}
