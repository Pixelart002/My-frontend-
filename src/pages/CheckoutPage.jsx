import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { RiArrowLeftLine, RiLockLine, RiAddLine, RiDeleteBinLine } from '@remixicon/react';
import { userService } from '../services/users';
import { paymentService } from '../services/payments';
import { STRIPE_PK } from '../config/env';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import { Spinner, ErrorState } from '../components/ui/States';
import StripePaymentForm from '../components/checkout/StripePaymentForm';

const stripePromise = loadStripe(STRIPE_PK);

function makeIdempotencyKey() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `fe-${Date.now()}-${rand}`;
}

function AddressForm({ onSaved, onCancel }) {
  const [values, setValues] = useState({ line1: '', line2: '', city: '', state: '', postal_code: '', country: 'IN', phone: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!values.line1 || !values.city || !values.postal_code) {
      return setError('Please fill in street, city and postal code.');
    }
    setSaving(true);
    try {
      await userService.addAddress({
        line1: values.line1,
        line2: values.line2 || undefined,
        city: values.city,
        state: values.state || undefined,
        postal_code: values.postal_code,
        country: values.country.toUpperCase(),
        phone: values.phone || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Unable to save this address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="address-form" onSubmit={onSubmit}>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="addr-line1">Street address *</label>
        <input id="addr-line1" value={values.line1} onChange={set('line1')} placeholder="House no, street" />
      </div>
      <div className="field">
        <label htmlFor="addr-line2">Apartment / area (optional)</label>
        <input id="addr-line2" value={values.line2} onChange={set('line2')} placeholder="Apartment, landmark" />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="addr-city">City *</label>
          <input id="addr-city" value={values.city} onChange={set('city')} />
        </div>
        <div className="field">
          <label htmlFor="addr-state">State</label>
          <input id="addr-state" value={values.state} onChange={set('state')} />
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="addr-postal">Postal code *</label>
          <input id="addr-postal" value={values.postal_code} onChange={set('postal_code')} />
        </div>
        <div className="field">
          <label htmlFor="addr-country">Country</label>
          <input id="addr-country" maxLength="2" value={values.country} onChange={set('country')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="addr-phone">Phone (optional)</label>
        <input id="addr-phone" value={values.phone} onChange={set('phone')} placeholder="For delivery updates" />
      </div>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button>
        <button className="btn btn-quiet" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading } = useCart();

  const [step, setStep] = useState(1); // 1 = address, 2 = payment
  const [addresses, setAddresses] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);

  // payment intent state
  const [intent, setIntent] = useState(null);
  const [intentError, setIntentError] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAddresses = useCallback(async () => {
    setAddressError('');
    try {
      const list = await userService.getAddresses();
      setAddresses(Array.isArray(list) ? list : []);
    } catch (err) {
      setAddressError(err.message || 'Unable to load your addresses.');
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const items = cart?.items || [];
  const canProceed = items.length > 0 && !cart?.has_unavailable_items;

  const startPayment = async () => {
    if (!selected) return;
    setCreating(true);
    setIntentError('');
    try {
      const data = await paymentService.createIntent(selected, makeIdempotencyKey());
      setIntent(data);
      setStep(2);
    } catch (err) {
      setIntentError(err.message || 'Unable to start payment.');
    } finally {
      setCreating(false);
    }
  };

  const intentOptions = useMemo(() => ({ clientSecret: intent?.client_secret }), [intent]);

  if (cartLoading) return <div className="page container"><Spinner label="Preparing checkout…" /></div>;

  if (!canProceed) {
    return (
      <div className="page container">
        <div className="page-heading compact"><p className="eyebrow">Checkout</p><h1>Your bag is empty.</h1></div>
        <button className="btn" onClick={() => navigate('/shop')}>Continue shopping</button>
      </div>
    );
  }

  return (
    <div className="page container checkout">
      <div className="page-heading compact">
        <p className="eyebrow"><RiLockLine size={13} /> Secure checkout</p>
        <h1>Complete your order.</h1>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          {/* STEP 1: Address */}
          <section className="checkout-section">
            <h2>1 · Delivery address</h2>
            {addressError && <ErrorState message={addressError} onRetry={loadAddresses} />}

            {addresses && addresses.length > 0 && !showForm && (
              <div className="address-list">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`address-card ${selected === addr.id ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="address"
                      checked={selected === addr.id}
                      onChange={() => setSelected(addr.id)}
                    />
                    <div>
                      <strong>{addr.full_name || 'Delivery'}</strong>
                      <p>
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}
                        {addr.state ? `, ${addr.state}` : ''} — {addr.postal_code}, {addr.country}
                      </p>
                      {addr.is_default && <span className="chip chip-sm">Default</span>}
                    </div>
                  </label>
                ))}
                <button className="btn btn-quiet btn-sm" onClick={() => setShowForm(true)}>
                  <RiAddLine size={15} /> Add a new address
                </button>
              </div>
            )}

            {addresses && addresses.length === 0 && !showForm && (
              <div className="state"><p>You’ll need a delivery address to check out.</p></div>
            )}

            {showForm && <AddressForm onSaved={() => { setShowForm(false); loadAddresses(); }} onCancel={() => setShowForm(false)} />}
          </section>

          {/* STEP 2: Payment */}
          <section className="checkout-section">
            <h2>2 · Payment</h2>
            {step === 1 ? (
              <div>
                {intentError && <div className="form-error">{intentError}</div>}
                <button className="btn" onClick={startPayment} disabled={!selected || creating}>
                  <RiLockLine size={16} /> {creating ? 'Preparing secure payment…' : 'Continue to payment'}
                </button>
                {!selected && addresses && addresses.length > 0 && (
                  <p className="hint">Select a delivery address above.</p>
                )}
              </div>
            ) : intent?.client_secret ? (
              <Elements stripe={stripePromise} options={intentOptions}>
                <StripePaymentForm
                  orderNumber={intent.order_number}
                  onSuccess={(payload) => navigate('/order/success', { replace: true, state: { orderId: payload.order_id, orderNumber: intent.order_number } })}
                  onBack={() => setStep(1)}
                />
              </Elements>
            ) : (
              <ErrorState message="Payment session is unavailable. Please go back and try again." onRetry={() => setStep(1)} />
            )}
          </section>
        </div>

        <aside className="summary">
          <p className="eyebrow">Order summary</p>
          <ul className="summary-items">
            {items.slice(0, 6).map((item) => (
              <li key={item.product_id}>
                <span>{item.name} × {item.quantity}</span>
                <strong>{formatMoney(item.line_total)}</strong>
              </li>
            ))}
            {items.length > 6 && <li><span>+ {items.length - 6} more</span></li>}
          </ul>
          <dl className="summary-lines">
            <div><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{cart.shipping_cost > 0 ? formatMoney(cart.shipping_cost) : 'Free'}</dd></div>
            <div><dt>Taxes</dt><dd>{formatMoney(cart.tax_amount)}</dd></div>
            <div className="total"><dt>Total</dt><dd>{formatMoney(cart.total_amount)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
