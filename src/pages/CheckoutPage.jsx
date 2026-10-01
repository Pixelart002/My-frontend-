import { Elements } from '@stripe/react-stripe-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCoupon3Line,
  RiLockLine,
  RiMapPinLine,
  RiMoneyRupeeCircleLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiUser3Line,
} from '@remixicon/react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getStripePromise } from '../services/stripeConfig';
import { userService } from '../services/users';
import { couponService } from '../services/coupons';
import { paymentService } from '../services/payments';
import { orderService } from '../services/orders';
import StripePaymentForm from '../components/checkout/StripePaymentForm';
import PaymentMethodModal from '../components/checkout/PaymentMethodModal';
import { useToast } from '../context/ToastContext';
import { ErrorState, Spinner } from '../components/ui/States';
import { formatMoney } from '../utils/format';

const stripePromise = getStripePromise();

const EMPTY_ADDRESS = {
  full_name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'IN',
  landmark: '',
  address_type: 'home',
  company_name: '',
  gstin: '',
  is_default: false,
};

const isValidIndianPhone = (value) => {
  const raw = String(value || '').replace(/[\s()-]/g, '');
  const digits =
    raw.startsWith('+91')
      ? raw.slice(3)
      : raw.startsWith('91') && raw.length === 12
        ? raw.slice(2)
        : raw.startsWith('0') && raw.length === 11
          ? raw.slice(1)
          : raw;
  return /^[6-9]\d{9}$/.test(digits);
};

const isValidIndianPin = (value) =>
  /^\d{6}$/.test(String(value || '').trim());

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const makeIdempotencyKey = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'checkout-' + Date.now() + '-' + Math.random().toString(36).slice(2);

const getErrorMessage = (error, fallback) => {
  const candidates = [
    error?.details?.message,
    error?.details?.detail,
    error?.details?.error,
    error?.response?.data?.detail?.message,
    error?.response?.data?.detail,
    error?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (candidate && typeof candidate === 'object') {
      const nested = candidate.message || candidate.detail || candidate.error;
      if (typeof nested === 'string' && nested.trim()) {
        return nested.trim();
      }
    }
  }

  return fallback;
};

function Field({ label, className = '', ...props }) {
  return (
    <label className={'block ' + className}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.08em] text-muted">
        {label}
      </span>
      <input
        {...props}
        className="min-h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-[rgba(216,173,106,.12)] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function AddressForm({ initialValues, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_ADDRESS,
    ...(initialValues || {}),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setField = useCallback((name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    if (!isValidEmail(form.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isValidIndianPhone(form.phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!String(form.line1 || '').trim()) {
      setError('Address line 1 is required.');
      return;
    }
    if (!String(form.city || '').trim()) {
      setError('City is required.');
      return;
    }
    if (!isValidIndianPin(form.postal_code)) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }

    setBusy(true);

    try {
      const payload = Object.fromEntries(
        Object.entries({
          ...form,
          country: 'IN',
          email: form.email.trim(),
          phone: form.phone.trim(),
          line1: form.line1.trim(),
          line2: form.line2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
        }).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ]),
      );

      const saved = await userService.addAddress(payload);
      onSaved?.(saved);
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          'Unable to save the address. Please try again.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="mt-5 rounded-2xl border border-line bg-bg/70 p-4 sm:p-5"
      onSubmit={submit}
      noValidate
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-gold-soft">
            New address
          </p>
          <h3 className="mt-1 text-base font-semibold text-text">
            Delivery details
          </h3>
        </div>
        <button
          type="button"
          className="min-h-10 rounded-xl border border-line px-3 text-xs font-semibold text-muted transition hover:border-gold hover:text-text"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>

      {error && (
        <p
          className="mt-4 rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="full_name"
          autoComplete="name"
          value={form.full_name}
          onChange={(event) => setField('full_name', event.target.value)}
          maxLength={120}
          disabled={busy}
        />
        <Field
          label="Email *"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setField('email', event.target.value)}
          maxLength={254}
          disabled={busy}
          required
        />
        <Field
          label="Mobile *"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+91 9876543210"
          value={form.phone}
          onChange={(event) => setField('phone', event.target.value)}
          maxLength={16}
          disabled={busy}
          required
        />
        <Field
          label="PIN code *"
          name="postal_code"
          autoComplete="postal-code"
          inputMode="numeric"
          value={form.postal_code}
          onChange={(event) => setField('postal_code', event.target.value)}
          maxLength={6}
          disabled={busy}
          required
        />
        <Field
          label="Address line 1 *"
          name="line1"
          className="sm:col-span-2"
          autoComplete="address-line1"
          value={form.line1}
          onChange={(event) => setField('line1', event.target.value)}
          maxLength={255}
          disabled={busy}
          required
        />
        <Field
          label="Address line 2"
          name="line2"
          className="sm:col-span-2"
          autoComplete="address-line2"
          value={form.line2}
          onChange={(event) => setField('line2', event.target.value)}
          maxLength={255}
          disabled={busy}
        />
        <Field
          label="City *"
          name="city"
          autoComplete="address-level2"
          value={form.city}
          onChange={(event) => setField('city', event.target.value)}
          maxLength={100}
          disabled={busy}
          required
        />
        <Field
          label="State"
          name="state"
          autoComplete="address-level1"
          value={form.state}
          onChange={(event) => setField('state', event.target.value)}
          maxLength={100}
          disabled={busy}
        />
      </div>

      <button
        type="submit"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.05em] text-gold-ink transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={busy}
      >
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-ink/30 border-t-gold-ink motion-reduce:animate-none" />
            Saving…
          </>
        ) : (
          <>
            <RiCheckLine size={16} aria-hidden="true" />
            Save address
          </>
        )}
      </button>
    </form>
  );
}

function AddressCard({ address, selected, disabled, onSelect }) {
  return (
    <label
      className={[
        'block rounded-2xl border p-4 transition',
        selected
          ? 'border-gold bg-gold-dim shadow-[0_0_0_1px_rgba(216,173,106,.10)]'
          : 'border-line bg-bg hover:border-[rgba(216,173,106,.35)]',
        disabled ? 'cursor-default opacity-70' : 'cursor-pointer',
      ].join(' ')}
    >
      <input
        type="radio"
        name="delivery-address"
        value={String(address?.id || '')}
        checked={selected}
        onChange={() => onSelect(String(address.id))}
        disabled={disabled}
        className="sr-only"
      />
      <div className="flex items-start gap-3">
        <span
          className={[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selected
              ? 'border-gold bg-gold text-gold-ink'
              : 'border-line text-transparent',
          ].join(' ')}
          aria-hidden="true"
        >
          <span className="h-2 w-2 rounded-full bg-current" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-text">
              {address?.full_name || 'Delivery address'}
            </strong>
            {address?.is_default && (
              <span className="rounded-full border border-success/30 bg-success-dim px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-success">
                Default
              </span>
            )}
          </span>
          <span className="mt-1 block break-words text-sm leading-6 text-muted">
            {address?.line1}
            {address?.line2 ? ', ' + address.line2 : ''}
          </span>
          <span className="block text-sm leading-6 text-muted">
            {[address?.city, address?.state, address?.postal_code]
              .filter(Boolean)
              .join(', ')}
          </span>
          <span className="mt-1 block text-xs text-dim">
            {address?.phone || 'Mobile number missing'}
          </span>
        </span>
      </div>
    </label>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    reload: reloadCart,
  } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [intent, setIntent] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderPreview, setOrderPreview] = useState(null);
  const [orderPreviewLoading, setOrderPreviewLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paymentSessionKey, setPaymentSessionKey] = useState('');

  const requestVersion = useRef(0);
  const creatingRef = useRef(false);
  const couponRef = useRef(false);
  const cancellingRef = useRef(false);
  const idempotencyKeyRef = useRef('');

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const canCheckout = items.length > 0 && !cart?.has_unavailable_items;
  const locked = Boolean(intent || activeOrder);

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          String(address?.id) === String(selectedAddressId),
      ) || null,
    [addresses, selectedAddressId],
  );

  const addressSeed = useMemo(
    () => ({
      ...EMPTY_ADDRESS,
      full_name: user?.full_name || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }),
    [user?.full_name, user?.name, user?.email, user?.phone],
  );


  const shippingAmount =
    cart?.shipping_cost === null || cart?.shipping_cost === undefined
      ? null
      : Number(cart.shipping_cost);

  const cartTotal =
    cart?.total_amount === null || cart?.total_amount === undefined
      ? null
      : Number(cart.total_amount);

  const serverOrderTotal =
    orderPreview?.total_amount ?? orderPreview?.grand_total;

  const displayedTotal =
    serverOrderTotal !== null && serverOrderTotal !== undefined
      ? Number(serverOrderTotal)
      : cartTotal;

  const loadAddresses = useCallback(async () => {
    const version = ++requestVersion.current;
    setAddressesLoading(true);
    setAddressError('');

    try {
      const data = await userService.getAddresses();

      if (version !== requestVersion.current) {
        return;
      }

      const next = Array.isArray(data) ? data : [];
      setAddresses(next);

      setSelectedAddressId((current) => {
        if (
          current &&
          next.some(
            (address) => String(address?.id) === String(current),
          )
        ) {
          return current;
        }

        return String(
          next.find((address) => address?.is_default)?.id ||
            next[0]?.id ||
            '',
        );
      });
    } catch (error) {
      if (version === requestVersion.current) {
        setAddressError(
          getErrorMessage(
            error,
            'Unable to load your saved addresses.',
          ),
        );
      }
    } finally {
      if (version === requestVersion.current) {
        setAddressesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const resetPaymentSession = useCallback(() => {
    setIntent(null);
    setActiveOrder(null);
    setOrderPreview(null);
    setPaymentSessionKey('');
    setPageError('');
    idempotencyKeyRef.current = '';
  }, []);

  const applyCoupon = useCallback(async () => {
    const code = couponInput.trim().toUpperCase();

    if (!code || couponRef.current || coupon || locked) {
      return;
    }

    couponRef.current = true;
    setCouponLoading(true);
    setCouponError('');

    try {
      const result = await couponService.apply(code, cart?.subtotal);
      const discount = Number(result?.discount);

      if (!Number.isFinite(discount) || discount <= 0) {
        throw new Error(
          'This coupon does not provide a discount for the current cart.',
        );
      }

      setCoupon({
        ...result,
        discount,
        subtotal: Number(cart?.subtotal) || 0,
      });
      setCouponInput('');
      toast.success(`Coupon ${code} applied.`);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to apply this coupon.');
      setCouponError(message);
      toast.error(message);
    } finally {
      couponRef.current = false;
      setCouponLoading(false);
    }
  }, [cart?.subtotal, coupon, couponInput, locked, toast]);

  useEffect(() => {
    if (
      coupon &&
      !locked &&
      Number(coupon.subtotal) !== Number(cart?.subtotal || 0)
    ) {
      setCoupon(null);
      setCouponError('');
      setCouponInput('');
    }
  }, [cart?.subtotal, coupon, locked]);

  const handleAddressSaved = useCallback(
    async (saved) => {
      setShowAddressForm(false);
      await loadAddresses();
      toast.success('Delivery address saved.');

      if (saved?.id) {
        setSelectedAddressId(String(saved.id));
      }
    },
    [loadAddresses, toast],
  );

  const addressReady =
    Boolean(selectedAddress) &&
    isValidIndianPhone(selectedAddress?.phone) &&
    isValidEmail(selectedAddress?.email);

  const validateCheckout = useCallback(() => {
    if (!canCheckout) {
      const message = cart?.has_unavailable_items
        ? 'One or more cart items are unavailable. Update your cart and try again.'
        : 'Your cart is empty.';
      setPageError(message);
      toast.error(message);
      return false;
    }

    if (!selectedAddress) {
      const message = 'Select a delivery address before continuing.';
      setPageError(message);
      toast.error(message);
      return false;
    }

    if (!isValidIndianPhone(selectedAddress.phone)) {
      const message = 'This address needs a valid 10-digit Indian mobile number.';
      setPageError(message);
      toast.error(message);
      return false;
    }

    if (!isValidEmail(selectedAddress.email)) {
      const message = 'This address needs a valid email address.';
      setPageError(message);
      toast.error(message);
      return false;
    }

    return true;
  }, [canCheckout, cart?.has_unavailable_items, selectedAddress, toast]);

  const openPaymentSelection = useCallback(() => {
    setPageError('');

    if (!validateCheckout()) {
      return;
    }

    setPaymentModalOpen(true);
  }, [validateCheckout]);

  const loadOrderPreview = useCallback(async (orderNumber) => {
    if (!orderNumber) {
      return;
    }

    setOrderPreviewLoading(true);

    try {
      const data = await orderService.myOrder(orderNumber);
      setOrderPreview(data || null);
    } catch {
      setOrderPreview(null);
    } finally {
      setOrderPreviewLoading(false);
    }
  }, []);

  const createCheckout = useCallback(async () => {
    if (creatingRef.current || locked) {
      return;
    }

    setPageError('');

    if (!validateCheckout()) {
      return;
    }

    if (paymentMethod === 'stripe' && !(await stripePromise)) {
      setPageError(
        'Online payment is temporarily unavailable. Please try again later or choose Cash on Delivery.',
      );
      return;
    }

    creatingRef.current = true;
    setPlacing(true);

    try {
      const idempotencyKey =
        idempotencyKeyRef.current || makeIdempotencyKey();

      idempotencyKeyRef.current = idempotencyKey;

      if (paymentMethod === 'cod') {
        const result = await paymentService.createCodOrder(
          selectedAddress.id,
          idempotencyKey,
          null,
          coupon?.code || null,
        );

        const orderNumber = String(result?.order_number || '').trim();

        if (!orderNumber) {
          throw new Error(
            'The COD order reference was not returned. Please check My Orders.',
          );
        }

        setActiveOrder({
          orderNumber,
          paymentMethod: 'cod',
        });
        toast.success(`Order #${orderNumber} placed successfully.`);
        return;
      }

      const result = await paymentService.createIntent(
        selectedAddress.id,
        idempotencyKey,
        null,
        coupon?.code || null,
      );

      if (
        !result?.client_secret ||
        !result?.payment_intent_id ||
        !result?.order_number
      ) {
        throw new Error(
          'The payment session was not created correctly. Please try again.',
        );
      }

      setIntent(result);
      setActiveOrder({
        orderNumber: result.order_number,
        paymentIntentId: result.payment_intent_id,
        paymentMethod: 'stripe',
      });
      setPaymentSessionKey(
        result.payment_intent_id + ':' + Date.now(),
      );

      void loadOrderPreview(result.order_number);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Unable to start checkout. Please try again.',
      );
      setPageError(message);
      toast.error(message);
    } finally {
      creatingRef.current = false;
      setPlacing(false);
    }
  }, [
    coupon?.code,
    loadOrderPreview,
    locked,
    navigate,
    paymentMethod,
    selectedAddress,
    toast,
    validateCheckout,
  ]);

  const cancelPayment = useCallback(async () => {
    const orderNumber = activeOrder?.orderNumber;

    if (!orderNumber || cancellingRef.current) {
      return;
    }

    cancellingRef.current = true;
    setCancelling(true);
    setPageError('');

    try {
      await paymentService.cancelCheckout(orderNumber);
      resetPaymentSession();
      await reloadCart();
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          'We could not safely cancel this payment session. Please try again.',
        ),
      );
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  }, [activeOrder?.orderNumber, reloadCart, resetPaymentSession]);

  const retryPayment = useCallback(
    async (orderNumber) => {
      const result = await paymentService.retry(orderNumber);

      if (!result?.client_secret || !result?.payment_intent_id) {
        throw new Error('A fresh payment session could not be created.');
      }

      setIntent(result);
      setActiveOrder((current) => ({
        ...(current || {}),
        orderNumber: result.order_number || orderNumber,
        paymentIntentId: result.payment_intent_id,
        paymentMethod: 'stripe',
      }));
      setPaymentSessionKey(
        result.payment_intent_id + ':' + Date.now(),
      );
      void loadOrderPreview(result.order_number || orderNumber);
    },
    [loadOrderPreview],
  );

  const handlePaymentSuccess = useCallback(
    (result) => {
      const orderNumber = String(
        result?.order_number || activeOrder?.orderNumber || '',
      ).trim();

      if (!orderNumber) {
        setPageError(
          'Payment completed, but no order reference was returned. Check My Orders.',
        );
        return;
      }

      navigate(
        '/order/success?order=' +
          encodeURIComponent(orderNumber) +
          '&payment=stripe',
        { replace: true },
      );
    },
    [activeOrder?.orderNumber, navigate],
  );

  const stripeOptions = useMemo(() => {
    if (!intent?.client_secret) {
      return undefined;
    }

    return {
      clientSecret: intent.client_secret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#d8ad6a',
          colorBackground: '#0e0e0e',
          colorText: '#f2f0ea',
          colorTextSecondary: '#a7a4a0',
          colorDanger: '#e07a7a',
          borderRadius: '12px',
          fontFamily:
            'DM Sans, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      },
    };
  }, [intent?.client_secret]);

  if (cartLoading && items.length === 0) {
    return (
      <div className="page container py-10">
        <Spinner label="Loading your cart…" />
      </div>
    );
  }

  if (cartError && items.length === 0) {
    return (
      <div className="page container py-10">
        <ErrorState message={cartError} onRetry={reloadCart} />
      </div>
    );
  }

  if (!canCheckout) {
    return (
      <div className="page container py-10">
        <section className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-6 text-center shadow-luviio-card sm:p-8">
          <RiMoneyRupeeCircleLine
            size={26}
            className="mx-auto text-gold-soft"
            aria-hidden="true"
          />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.12em] text-gold-soft">
            Checkout
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-text sm:text-3xl">
            {cart?.has_unavailable_items
              ? 'Your cart needs an update.'
              : 'Your cart is empty.'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            {cart?.has_unavailable_items
              ? 'Review the unavailable items in your cart before checkout.'
              : 'Add a product to your bag before starting checkout.'}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.05em] text-gold-ink transition hover:bg-gold-soft"
              to="/shop"
            >
              Browse products
              <RiArrowRightLine size={16} aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-xs font-semibold text-text transition hover:border-gold"
              to="/cart"
            >
              Back to cart
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const paymentButtonLabel =
    paymentMethod === 'cod'
      ? 'Place COD order'
      : 'Continue to secure payment';

  const cartItems = items.map((item, index) => ({
    id: String(item?.id || item?.product_id || index),
    name: item?.product_name || item?.name || 'Product',
    quantity: Number(item?.quantity) || 0,
  }));

  return (
    <div className="page container py-7 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-muted transition hover:text-gold disabled:opacity-50"
          onClick={() => navigate('/cart')}
          disabled={locked}
        >
          <RiArrowLeftLine size={16} aria-hidden="true" />
          Back to cart
        </button>

        <header className="max-w-2xl">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-gold-soft">
            <RiLockLine size={14} aria-hidden="true" />
            Secure checkout
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-text sm:text-4xl">
            Complete your order.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Delivery first, server-verified order next, then secure payment.
          </p>
        </header>

        {pageError && (
          <div
            className="mt-5 rounded-2xl border border-danger bg-danger-dim px-4 py-3 text-sm leading-6 text-danger"
            role="alert"
          >
            {pageError}
          </div>
        )}

        <div className="mt-7 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0 space-y-5">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-gold-soft">
                  <RiMapPinLine size={17} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-text">Delivery address</h2>
                  <p className="mt-0.5 text-sm text-muted">Select a saved Indian address or add a new one.</p>
                </div>
              </div>
              {addressesLoading ? (
                <div className="mt-5 rounded-2xl border border-line bg-bg px-4 py-8 text-center">
                  <Spinner inline label="Loading saved addresses" />
                  <p className="mt-2 text-xs text-muted">
                    Loading saved addresses…
                  </p>
                </div>
              ) : addressError ? (
                <div className="mt-5">
                  <ErrorState message={addressError} onRetry={loadAddresses} />
                </div>
              ) : (
                <>
                  {addresses.length > 0 && (
                    <div className="mt-5 grid gap-3">
                      {addresses.map((address) => (
                        <AddressCard
                          key={String(address.id)}
                          address={address}
                          selected={
                            String(address.id) ===
                            String(selectedAddressId)
                          }
                          disabled={locked}
                          onSelect={setSelectedAddressId}
                        />
                      ))}
                    </div>
                  )}

                  {!locked && (
                    <button
                      type="button"
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 text-xs font-semibold text-text transition hover:border-gold hover:bg-surface-2"
                      onClick={() => setShowAddressForm(true)}
                    >
                      <RiAddLine size={17} aria-hidden="true" />
                      Add address
                    </button>
                  )}

                  {addresses.length === 0 && !showAddressForm && (
                    <div className="mt-5 rounded-2xl border border-line bg-bg p-5 text-center">
                      <RiUser3Line
                        size={24}
                        className="mx-auto text-dim"
                        aria-hidden="true"
                      />
                      <h3 className="mt-3 text-sm font-semibold text-text">
                        No saved address
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Add your delivery details to continue.
                      </p>
                    </div>
                  )}

                  {showAddressForm && !locked && (
                    <AddressForm
                      initialValues={addressSeed}
                      onSaved={handleAddressSaved}
                      onCancel={() => setShowAddressForm(false)}
                    />
                  )}

                  {selectedAddress && (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-success/20 bg-success-dim px-4 py-3 text-xs leading-5 text-success">
                      <RiCheckLine
                        size={16}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {addressReady
                          ? 'This address is ready for checkout.'
                          : 'Update this address with a valid email and Indian mobile number.'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-gold-soft">
                  <RiCoupon3Line size={17} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-text">Coupon</h2>
                  <p className="mt-0.5 text-sm text-muted">Apply one valid coupon before order creation.</p>
                </div>
              </div>
              <div className="mt-5">
                {coupon ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-success/20 bg-success-dim p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.1em] text-success">
                        Applied coupon
                      </p>
                      <strong className="mt-1 block text-sm text-text">
                        {coupon.code}
                      </strong>
                      <span className="mt-1 block text-xs text-muted">
                        Discount: {formatMoney(coupon.discount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="min-h-10 rounded-xl border border-success/30 px-3 text-xs font-semibold text-text transition hover:border-gold disabled:opacity-50"
                      onClick={() => {
                        setCoupon(null);
                        setCouponInput('');
                        setCouponError('');
                      }}
                      disabled={locked}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="sr-only" htmlFor="checkout-coupon">
                      Coupon code
                    </label>
                    <input
                      id="checkout-coupon"
                      className="min-h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-sm font-semibold uppercase tracking-[.08em] text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-[rgba(216,173,106,.12)]"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      maxLength={40}
                      disabled={locked}
                    />
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.05em] text-gold-ink transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => void applyCoupon()}
                      disabled={
                        locked ||
                        couponLoading ||
                        !couponInput.trim()
                      }
                    >
                      {couponLoading ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p
                    className="mt-3 rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm text-danger"
                    role="alert"
                  >
                    {couponError}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-bg text-gold-soft">
                  <RiMoneyRupeeCircleLine size={17} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-text">Payment</h2>
                  <p className="mt-0.5 text-sm text-muted">Choose how you want to pay.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    id: 'stripe',
                    title: 'Online payment',
                    body: 'Pay securely with Stripe-supported payment methods.',
                  },
                  {
                    id: 'cod',
                    title: 'Cash on Delivery',
                    body: 'Place the order now and pay when it arrives.',
                  },
                ].map((option) => {
                  const selected = paymentMethod === option.id;

                  return (
                    <label
                      key={option.id}
                      className={[
                        'block rounded-2xl border p-4 transition',
                        selected
                          ? 'border-gold bg-gold-dim'
                          : 'border-line bg-bg hover:border-[rgba(216,173,106,.35)]',
                        locked
                          ? 'cursor-default opacity-70'
                          : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="checkout-payment-method"
                        value={option.id}
                        checked={selected}
                        onChange={() => setPaymentMethod(option.id)}
                        disabled={locked}
                        className="sr-only"
                      />
                      <strong className="block text-sm text-text">
                        {option.title}
                      </strong>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {option.body}
                      </span>
                    </label>
                  );
                })}
              </div>

              {intent && activeOrder ? (
                <div className="mt-5 rounded-2xl border border-gold/30 bg-bg p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.1em] text-gold-soft">
                        Payment session
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-text">
                        Order #{activeOrder.orderNumber}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="min-h-10 rounded-xl border border-line px-3 text-xs font-semibold text-text transition hover:border-danger hover:text-danger disabled:opacity-50"
                      onClick={() => void cancelPayment()}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling…' : 'Cancel payment'}
                    </button>
                  </div>

                  {orderPreviewLoading ? (
                    <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted">
                      Confirming the server-side order total…
                    </div>
                  ) : orderPreview ? (
                    <div className="mt-4 rounded-xl border border-line bg-surface p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted">
                          Final order total
                        </span>
                        <strong className="text-lg text-text">
                          {serverOrderTotal === null ||
                          serverOrderTotal === undefined
                            ? 'Calculated'
                            : formatMoney(serverOrderTotal)}
                        </strong>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-2xl border border-line bg-surface p-3 sm:p-4">
                    <Elements
                      key={paymentSessionKey}
                      stripe={stripePromise}
                      options={stripeOptions}
                    >
                      <StripePaymentForm
                        orderNumber={activeOrder.orderNumber}
                        clientSecret={intent.client_secret}
                        onSuccess={handlePaymentSuccess}
                        onRetry={retryPayment}
                      />
                    </Elements>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-line bg-bg p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-gold-soft">
                      <RiShieldCheckLine size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong className="block text-sm text-text">
                        Ready to place the order
                      </strong>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Select a valid address, choose a payment method, and continue.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.05em] text-gold-ink transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void createCheckout()}
                    disabled={placing || locked || !addressReady}
                  >
                    {placing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-ink/30 border-t-gold-ink motion-reduce:animate-none" />
                        {paymentMethod === 'cod'
                          ? 'Creating order…'
                          : 'Starting secure payment…'}
                      </>
                    ) : (
                      <>
                        {paymentButtonLabel}
                        <RiArrowRightLine size={17} aria-hidden="true" />
                      </>
                    )}
                  </button>

                  {!selectedAddress && (
                    <p className="mt-3 text-center text-xs text-dim">
                      Select a delivery address to continue.
                    </p>
                  )}

                  {selectedAddress && !addressReady && (
                    <p className="mt-3 text-center text-xs text-danger">
                      Add a valid email and Indian mobile number to this address.
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>

          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-gold-soft">
                    Order summary
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-text">
                    Your bag
                  </h2>
                </div>
                <span className="rounded-full border border-success/20 bg-success-dim px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-success">
                  Secure
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium text-text">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-dim">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-semibold text-text">
                    {formatMoney(cart.subtotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="font-semibold text-text">
                    {shippingAmount === null
                      ? 'Calculated'
                      : shippingAmount === 0
                        ? 'Free'
                        : formatMoney(shippingAmount)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">GST</dt>
                  <dd className="font-semibold text-text">
                    {formatMoney(cart.tax_amount)}
                  </dd>
                </div>
                {coupon && (
                  <div className="flex items-center justify-between gap-4 text-success">
                    <dt>Coupon</dt>
                    <dd className="font-semibold">
                      −{formatMoney(coupon.discount)}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
                  <dt className="font-semibold text-text">
                    {intent ? 'Final order total' : 'Current total'}
                  </dt>
                  <dd className="text-xl font-semibold text-text">
                    {displayedTotal !== null &&
                    Number.isFinite(displayedTotal)
                      ? formatMoney(displayedTotal)
                      : 'Calculated'}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 rounded-xl border border-gold/20 bg-gold-dim px-3 py-2.5 text-[11px] leading-5 text-gold-soft">
                The backend is the source of truth for price, GST, shipping, coupon validity and inventory.
              </p>

              <p className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-bg px-3.5 py-3 text-[11px] leading-5 text-dim">
                <RiShieldCheckLine
                  size={16}
                  className="mt-0.5 shrink-0 text-gold-soft"
                  aria-hidden="true"
                />
                <span>
                  Stripe handles online payment details. Luviio receives only the payment result required to complete the order.
                </span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}