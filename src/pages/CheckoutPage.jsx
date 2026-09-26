import { Elements } from '@stripe/react-stripe-js';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiAlertLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiCoupon3Line,
  RiErrorWarningLine,
  RiLoader4Line,
  RiLockLine,
} from '@remixicon/react';

import { getStripePromise } from '../services/stripeConfig';
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

const normalizeDeliveryMode = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ');

  if (!raw) return '';

  if (
    raw.includes('quick') ||
    raw.includes('hyperlocal') ||
    raw.includes('instant')
  ) {
    return 'Quick delivery';
  }

  if (
    raw.includes('2 wheel') ||
    raw.includes('two wheel') ||
    raw === '2w'
  ) {
    return '2-wheeler';
  }

  if (
    raw.includes('3 wheel') ||
    raw.includes('three wheel') ||
    raw === '3w'
  ) {
    return '3-wheeler';
  }

  if (
    raw.includes('4 wheel') ||
    raw.includes('four wheel') ||
    raw === '4w'
  ) {
    return '4-wheeler';
  }

  if (raw.includes('surface')) return 'Surface';
  if (raw.includes('air')) return 'Air';

  return String(value).trim();
};

const getDeliveryMode = (courier) =>
  normalizeDeliveryMode(
    courier?.vehicle_type ||
      courier?.vehicle ||
      courier?.vehicle_mode ||
      courier?.delivery_mode ||
      courier?.delivery_type ||
      courier?.mode,
  ) ||
  normalizeDeliveryMode(
    courier?.service_type ||
      courier?.service ||
      courier?.shipment_type ||
      courier?.courier_type,
  );

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
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || '').trim(),
  );

const makeIdempotencyKey = () => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const text = (value, fallback = '') => {
  const result = String(value ?? '').trim();
  return result || fallback;
};

const normalizeCourierOptions = (data) => {
  const quotes = Array.isArray(data?.couriers)
    ? data.couriers
    : Array.isArray(data?.quotes)
      ? data.quotes
      : [];

  const serverSelected = data?.selected;

  const candidates = quotes.length
    ? quotes
    : serverSelected
      ? [serverSelected]
      : [];

  const seen = new Set();

  return candidates.filter((courier) => {
    const id = String(courier?.courier_id || '').trim();
    const cost = Number(courier?.shipping_cost);

    if (!id || !Number.isFinite(cost) || cost < 0) {
      return false;
    }

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

function AddressForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setField = useCallback((name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const email = form.email.trim();
    const phone = form.phone.trim();
    const line1 = form.line1.trim();
    const city = form.city.trim();
    const postalCode = form.postal_code.trim();

    if (!email || !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      setError(
        'Enter a valid 10-digit Indian mobile number.',
      );
      return;
    }

    if (!line1) {
      setError('Address line 1 is required.');
      return;
    }

    if (!city) {
      setError('City is required.');
      return;
    }

    if (!isValidIndianPin(postalCode)) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }

    submittingRef.current = true;
    setBusy(true);
    setError('');

    try {
      const payload = Object.fromEntries(
        Object.entries({
          ...form,
          country: 'IN',
          email,
          phone,
          line1,
          city,
          postal_code: postalCode,
        }).map(([key, value]) => [
          key,
          typeof value === 'string'
            ? value.trim()
            : value,
        ]),
      );

      await userService.addAddress(payload);

      if (mountedRef.current) {
        onSaved?.();
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err?.message ||
            'Unable to save the address.',
        );
      }
    } finally {
      submittingRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  };

  return (
    <form
      className="address-form min-w-0"
      onSubmit={submit}
      noValidate
    >
      {error && (
        <div
          className="form-error mb-4 w-full rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <div className="field-grid grid min-w-0 grid-cols-2 gap-x-4 gap-y-0 max-[560px]:grid-cols-1">
        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-full-name">
            Full name
          </label>
          <input
            id="checkout-full-name"
            name="full_name"
            value={form.full_name}
            onChange={(event) =>
              setField(
                'full_name',
                event.target.value,
              )
            }
            autoComplete="name"
            disabled={busy}
            maxLength={120}
          />
        </div>

        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-email">
            Email *
          </label>
          <input
            id="checkout-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setField(
                'email',
                event.target.value,
              )
            }
            autoComplete="email"
            disabled={busy}
            maxLength={254}
          />
        </div>
      </div>

      <div className="field-grid grid min-w-0 grid-cols-2 gap-x-4 gap-y-0 max-[560px]:grid-cols-1">
        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-phone">
            Phone *
          </label>
          <input
            id="checkout-phone"
            name="phone"
            required
            value={form.phone}
            onChange={(event) =>
              setField(
                'phone',
                event.target.value,
              )
            }
            autoComplete="tel"
            inputMode="tel"
            maxLength={16}
            placeholder="+91 9876543210"
            disabled={busy}
          />
        </div>

        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-pin">
            PIN code *
          </label>
          <input
            id="checkout-pin"
            name="postal_code"
            required
            value={form.postal_code}
            onChange={(event) =>
              setField(
                'postal_code',
                event.target.value,
              )
            }
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={6}
            disabled={busy}
          />
        </div>
      </div>

      <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
        <label htmlFor="checkout-line1">
          Address line 1 *
        </label>
        <input
          id="checkout-line1"
          name="line1"
          required
          value={form.line1}
          onChange={(event) =>
            setField(
              'line1',
              event.target.value,
            )
          }
          autoComplete="address-line1"
          maxLength={250}
          disabled={busy}
        />
      </div>

      <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
        <label htmlFor="checkout-line2">
          Address line 2
        </label>
        <input
          id="checkout-line2"
          name="line2"
          value={form.line2}
          onChange={(event) =>
            setField(
              'line2',
              event.target.value,
            )
          }
          autoComplete="address-line2"
          maxLength={250}
          disabled={busy}
        />
      </div>

      <div className="field-grid grid min-w-0 grid-cols-2 gap-x-4 gap-y-0 max-[560px]:grid-cols-1">
        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-city">
            City *
          </label>
          <input
            id="checkout-city"
            name="city"
            required
            value={form.city}
            onChange={(event) =>
              setField(
                'city',
                event.target.value,
              )
            }
            autoComplete="address-level2"
            maxLength={100}
            disabled={busy}
          />
        </div>

        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-state">
            State
          </label>
          <input
            id="checkout-state"
            name="state"
            value={form.state}
            onChange={(event) =>
              setField(
                'state',
                event.target.value,
              )
            }
            autoComplete="address-level1"
            maxLength={100}
            disabled={busy}
          />
        </div>
      </div>

      <div className="field-grid grid min-w-0 grid-cols-2 gap-x-4 gap-y-0 max-[560px]:grid-cols-1">
        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-landmark">
            Landmark
          </label>
          <input
            id="checkout-landmark"
            name="landmark"
            value={form.landmark}
            onChange={(event) =>
              setField(
                'landmark',
                event.target.value,
              )
            }
            maxLength={150}
            disabled={busy}
          />
        </div>

        <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-line [&_select]:bg-bg [&_select]:px-3.5 [&_select]:text-sm [&_select]:text-text [&_select]:outline-none [&_select:focus]:border-gold [&_select:focus]:ring-2 [&_select:focus]:ring-[rgba(216,173,106,.10)] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-bg [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none [&_textarea:focus]:border-gold [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[rgba(216,173,106,.10)]">
          <label htmlFor="checkout-address-type">
            Address type
          </label>
          <select
            id="checkout-address-type"
            name="address_type"
            value={form.address_type}
            onChange={(event) =>
              setField(
                'address_type',
                event.target.value,
              )
            }
            disabled={busy}
          >
            <option value="home">Home</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <label className="check-line inline-flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-xl border border-line bg-bg px-3.5 text-sm text-text transition-colors hover:border-[rgba(216,173,106,.60)] has-[:checked]:border-gold has-[:checked]:bg-gold-dim has-[:checked]:text-gold-soft [&_input]:h-4 [&_input]:w-4 [&_input]:accent-gold">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(event) =>
            setField(
              'is_default',
              event.target.checked,
            )
          }
          disabled={busy}
        />
        <span>Make this my default address</span>
      </label>

      <div className="btn-row mt-5 flex min-w-0 flex-wrap items-center gap-2.5 max-[480px]:flex-col max-[480px]:items-stretch">
        <button
          type="button"
          className="btn btn-quiet inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-4 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold uppercase tracking-[.04em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          aria-busy={busy}
        >
          {busy && (
            <RiLoader4Line
              className="spin animate-spin"
              size={17}
              aria-hidden="true"
            />
          )}
          {busy ? 'Saving…' : 'Save address'}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    cart,
    loading: cartLoading,
    reload: reloadCart,
  } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [addressError, setAddressError] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState('');
  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);
  const [paymentReview, setPaymentReview] =
    useState(false);

  const [intent, setIntent] = useState(null);
  const [intentError, setIntentError] =
    useState('');

  const [creating, setCreating] = useState(false);
  const [activeOrder, setActiveOrder] =
    useState(null);

  const [checkoutKey, setCheckoutKey] =
    useState('');

  const [paymentSessionKey, setPaymentSessionKey] =
    useState('');

  const [couponInput, setCouponInput] =
    useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] =
    useState('');
  const [couponLoading, setCouponLoading] =
    useState(false);

  const [shippingQuote, setShippingQuote] =
    useState(null);
  const [shippingOptions, setShippingOptions] =
    useState([]);
  const [selectedCourierId, setSelectedCourierId] =
    useState('');
  const [
    shippingQuoteLoading,
    setShippingQuoteLoading,
  ] = useState(false);
  const [
    shippingQuoteError,
    setShippingQuoteError,
  ] = useState('');

  const [
    cancelConfirmOpen,
    setCancelConfirmOpen,
  ] = useState(false);
  const [
    cancellingOrder,
    setCancellingOrder,
  ] = useState(false);

  const mountedRef = useRef(false);
  const addressRequestRef = useRef(0);
  const shippingRequestRef = useRef(0);
  const paymentRequestRef = useRef(0);

  const creatingRef = useRef(false);
  const couponLoadingRef = useRef(false);
  const cancellingRef = useRef(false);
  const retryingRef = useRef(false);

  const cancelModalRef = useRef(null);
  const cancelCloseRef = useRef(null);
  const cancelTitleId = useId();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const items = cart?.items || [];

  const canProceed =
    items.length > 0 &&
    !cart?.has_unavailable_items;

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          String(address.id) ===
          String(selected),
      ) || null,
    [addresses, selected],
  );

  const selectedPhoneValid =
    isValidIndianPhone(
      selectedAddress?.phone,
    );

  const selectedDeliveryMode =
    getDeliveryMode(shippingQuote);

  const couponDiscount =
    Number(coupon?.discount) > 0
      ? Number(coupon.discount)
      : 0;

  const backendCartTotal =
    cart?.total_amount;

  /*
   * This is display-only shipment input for the
   * existing providerRate service contract.
   *
   * The backend MUST recalculate package weight
   * from the authoritative cart/product data before
   * creating the actual shipment/order.
   */
  const shipmentWeightKg = useMemo(() => {
    let total = 0;

    for (const item of items) {
      const rawWeight = Number(item?.weight);

      if (
        !Number.isFinite(rawWeight) ||
        rawWeight <= 0
      ) {
        continue;
      }

      const unit = String(
        item?.weight_unit || 'g',
      ).toLowerCase();

      let kg = 0;

      if (unit === 'kg') {
        kg = rawWeight;
      } else if (unit === 'g') {
        kg = rawWeight / 1000;
      }

      const quantity = Math.max(
        0,
        Number(item?.quantity) || 0,
      );

      total += kg * quantity;
    }

    return total > 0 ? total : 0.5;
  }, [items]);

  const loadAddresses = useCallback(
    async () => {
      const requestId =
        ++addressRequestRef.current;

      setAddressError('');

      try {
        const list =
          await userService.getAddresses();

        if (
          !mountedRef.current ||
          requestId !==
            addressRequestRef.current
        ) {
          return;
        }

        const next = Array.isArray(list)
          ? list
          : [];

        setAddresses(next);

        setSelected((current) => {
          if (
            current &&
            next.some(
              (address) =>
                String(address.id) ===
                String(current),
            )
          ) {
            return current;
          }

          return (
            next.find(
              (address) =>
                address.is_default,
            )?.id ||
            next[0]?.id ||
            ''
          );
        });
      } catch (err) {
        if (
          mountedRef.current &&
          requestId ===
            addressRequestRef.current
        ) {
          setAddressError(
            err?.message ||
              'Unable to load your addresses.',
          );
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  /*
   * Live shipping quote.
   *
   * Provider-specific implementation remains inside
   * shippingService/backend. The UI only consumes the
   * normalized courier quote.
   */
  useEffect(() => {
    const requestId =
      ++shippingRequestRef.current;

    if (
      !selectedAddress?.postal_code ||
      !items.length ||
      !canProceed
    ) {
      setShippingQuote(null);
      setShippingOptions([]);
      setSelectedCourierId('');
      setShippingQuoteError('');
      setShippingQuoteLoading(false);
      return undefined;
    }

    setShippingQuoteLoading(true);
    setShippingQuoteError('');
    setShippingQuote(null);
    setShippingOptions([]);
    setSelectedCourierId('');

    const loadLiveShipping = async () => {
      try {
        const result =
          await shippingService.providerRate({
            deliveryPostcode:
              selectedAddress.postal_code,
            weightKg: shipmentWeightKg,
            cod:
              paymentMethod === 'cod',
            declaredValue:
              Number(cart?.subtotal) || 0,
          });

        if (
          !mountedRef.current ||
          requestId !==
            shippingRequestRef.current
        ) {
          return;
        }

        const data =
          result?.data || result || {};

        const options =
          normalizeCourierOptions(data);

        const serverSelected =
          data?.selected;

        const validServerSelected =
          serverSelected &&
          String(
            serverSelected.courier_id || '',
          ) &&
          Number.isFinite(
            Number(
              serverSelected.shipping_cost,
            ),
          ) &&
          Number(
            serverSelected.shipping_cost,
          ) >= 0
            ? serverSelected
            : null;

        const nextOptions =
          options.length
            ? options
            : validServerSelected
              ? [validServerSelected]
              : [];

        if (!nextOptions.length) {
          throw new Error(
            'Live delivery options are not available for this PIN code yet.',
          );
        }

        const preferredId =
          validServerSelected
            ? String(
                validServerSelected.courier_id,
              )
            : '';

        const next =
          nextOptions.find(
            (courier) =>
              String(
                courier.courier_id,
              ) === preferredId,
          ) || nextOptions[0];

        if (!next) {
          throw new Error(
            'Live delivery options are incomplete.',
          );
        }

        setShippingOptions(nextOptions);
        setSelectedCourierId(
          String(next.courier_id),
        );
        setShippingQuote(next);

        /*
         * Any new shipping quote invalidates a
         * previously created payment session.
         */
        setIntent(null);
        setIntentError('');
        setPaymentReview(false);
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !==
            shippingRequestRef.current
        ) {
          return;
        }

        setShippingQuote(null);
        setShippingOptions([]);
        setSelectedCourierId('');

        setShippingQuoteError(
          err?.message ||
            'Live delivery rates could not be calculated yet.',
        );
      } finally {
        if (
          mountedRef.current &&
          requestId ===
            shippingRequestRef.current
        ) {
          setShippingQuoteLoading(false);
        }
      }
    };

    loadLiveShipping();

    return () => {
      /*
       * requestId invalidates the response.
       * No stale quote can overwrite a newer
       * address/payment/cart selection.
       */
    };
  }, [
    selectedAddress?.postal_code,
    shipmentWeightKg,
    cart?.subtotal,
    items.length,
    canProceed,
  ]);

  const resetPayment = useCallback(() => {
    ++paymentRequestRef.current;

    setIntent(null);
    setIntentError('');
    setPaymentReview(false);
    setPaymentModalOpen(false);
    setPaymentSessionKey('');
  }, []);

  const selectCourier = useCallback(
    (courier) => {
      if (
        activeOrder ||
        !courier?.courier_id
      ) {
        return;
      }

      const cost = Number(
        courier.shipping_cost,
      );

      if (
        !Number.isFinite(cost) ||
        cost < 0
      ) {
        return;
      }

      setSelectedCourierId(
        String(courier.courier_id),
      );
      setShippingQuote(courier);
      resetPayment();
    },
    [activeOrder, resetPayment],
  );

  const applyCoupon = useCallback(
    async () => {
      const code = couponInput
        .trim()
        .toUpperCase();

      if (
        !code ||
        couponLoadingRef.current ||
        coupon ||
        activeOrder
      ) {
        return;
      }

      couponLoadingRef.current = true;
      setCouponLoading(true);
      setCouponError('');

      try {
        const result =
          await couponService.apply(
            code,
            cart?.subtotal,
          );

        const discount = Number(
          result?.discount,
        );

        if (
          !Number.isFinite(discount) ||
          discount <= 0
        ) {
          throw new Error(
            'This coupon does not provide a discount for the current cart.',
          );
        }

        if (!mountedRef.current) {
          return;
        }

        setCoupon({
          ...result,
          subtotal:
            Number(cart?.subtotal) || 0,
        });

        setCouponInput('');
        resetPayment();
      } catch (err) {
        if (mountedRef.current) {
          setCouponError(
            err?.message ||
              'Unable to apply this coupon.',
          );
        }
      } finally {
        couponLoadingRef.current = false;

        if (mountedRef.current) {
          setCouponLoading(false);
        }
      }
    },
    [
      activeOrder,
      cart?.subtotal,
      coupon,
      couponInput,
      resetPayment,
    ],
  );

  const removeCoupon = useCallback(() => {
    if (activeOrder) {
      return;
    }

    setCoupon(null);
    setCouponError('');
    setCouponInput('');
    resetPayment();
  }, [activeOrder, resetPayment]);

  useEffect(() => {
    if (
      !coupon ||
      activeOrder
    ) {
      return;
    }

    if (
      Number(coupon.subtotal) !==
      Number(cart?.subtotal || 0)
    ) {
      setCoupon(null);
      setCouponError('');
      setCouponInput('');
      resetPayment();
    }
  }, [
    cart?.subtotal,
    coupon,
    activeOrder,
    resetPayment,
  ]);

  const openPaymentChooser =
    useCallback(() => {
      if (
        !selected ||
        !selectedCourierId ||
        !shippingQuote ||
        creatingRef.current ||
        activeOrder
      ) {
        return;
      }

      if (!selectedAddress) {
        setIntentError(
          'Please select a delivery address before continuing.',
        );
        return;
      }

      if (!selectedPhoneValid) {
        setIntentError(
          'Please update this delivery address with a valid 10-digit Indian mobile number before payment.',
        );
        return;
      }

      setIntentError('');
      setPaymentReview(false);
      setIntent(null);
      setPaymentModalOpen(true);
    }, [
      activeOrder,
      selected,
      selectedAddress,
      selectedCourierId,
      selectedPhoneValid,
      shippingQuote,
    ]);

  const startPayment = useCallback(
    async () => {
      if (
        creatingRef.current ||
        !selected ||
        !selectedAddress ||
        !selectedCourierId ||
        !shippingQuote ||
        !paymentMethod ||
        activeOrder
      ) {
        return;
      }

      if (!selectedPhoneValid) {
        setIntentError(
          'Please update the delivery address with a valid Indian mobile number.',
        );
        return;
      }

      if (
        paymentMethod === 'stripe' &&
        !(await stripePromise)
      ) {
        setIntentError(
          'Online payment is temporarily unavailable. Please use another payment method.',
        );
        return;
      }

      creatingRef.current = true;
      const requestId =
        ++paymentRequestRef.current;

      setCreating(true);
      setIntentError('');

      try {
        const key =
          checkoutKey || makeIdempotencyKey();

        if (!checkoutKey) {
          setCheckoutKey(key);
        }

        if (paymentMethod === 'cod') {
          const order =
            await paymentService.createCodOrder(
              selected,
              key,
              null,
              coupon?.code || null,
              selectedCourierId,
            );

          if (
            !mountedRef.current ||
            requestId !==
              paymentRequestRef.current
          ) {
            return;
          }

          const orderNumber = text(
            order?.order_number,
          );

          if (!orderNumber) {
            throw new Error(
              'COD order could not be created. Please try again.',
            );
          }

          setActiveOrder({
            orderNumber,
            orderId: order?.order_id,
            paymentMethod: 'cod',
          });

          setPaymentReview(true);
          return;
        }

        const data =
          await paymentService.createIntent(
            selected,
            key,
            null,
            coupon?.code || null,
            selectedCourierId,
          );

        if (
          !data?.client_secret ||
          !data?.payment_intent_id ||
          !data?.order_number
        ) {
          throw new Error(
            'Payment session was not created correctly. Please try again.',
          );
        }

        if (
          !mountedRef.current ||
          requestId !==
            paymentRequestRef.current
        ) {
          return;
        }

        setIntent(data);
        setPaymentSessionKey(
          `${data.payment_intent_id}:${Date.now()}`,
        );

        setActiveOrder({
          orderNumber: data.order_number,
          orderId: data.order_id,
          paymentMethod: 'stripe',
          paymentIntentId:
            data.payment_intent_id,
        });

        setPaymentReview(true);
      } catch (err) {
        if (
          !mountedRef.current ||
          requestId !==
            paymentRequestRef.current
        ) {
          return;
        }

        const message =
          err?.code === 'NETWORK_ERROR'
            ? 'We could not reach the order service. Check your connection and try again.'
            : err?.code === 'TIMEOUT'
              ? 'The order service took too long to respond. Please retry.'
              : err?.status === 401
                ? 'Your session has expired. Please sign in again.'
                : err?.message ||
                  'Unable to place your order. Please try again.';

        setIntentError(message);
      } finally {
        creatingRef.current = false;

        if (mountedRef.current) {
          setCreating(false);
        }
      }
    },
    [
      activeOrder,
      checkoutKey,
      coupon?.code,
      paymentMethod,
      selected,
      selectedAddress,
      selectedCourierId,
      selectedPhoneValid,
      shippingQuote,
    ],
  );

  const handleModalContinue =
    useCallback(() => {
      if (activeOrder) {
        return;
      }

      if (!paymentReview) {
        setPaymentReview(true);
        return;
      }

      startPayment();
    }, [
      activeOrder,
      paymentReview,
      startPayment,
    ]);

  const handleModalBack = useCallback(() => {
    if (activeOrder) {
      return;
    }

    if (intent) {
      setIntent(null);
      setIntentError('');
      setPaymentSessionKey('');
      return;
    }

    setPaymentReview(false);
    setIntentError('');
  }, [activeOrder, intent]);

  const requestCancelOrder =
    useCallback(() => {
      if (
        activeOrder &&
        !cancellingRef.current
      ) {
        setCancelConfirmOpen(true);
      }
    }, [activeOrder]);

  useFocusTrap({
    enabled: cancelConfirmOpen,
    containerRef: cancelModalRef,
    initialFocusRef: cancelCloseRef,
    onEscape: () => {
      if (!cancellingRef.current) {
        setCancelConfirmOpen(false);
      }
    },
  });

  const cancelActiveOrder =
    useCallback(async () => {
      if (
        !activeOrder?.orderNumber ||
        cancellingRef.current
      ) {
        return;
      }

      cancellingRef.current = true;
      setCancellingOrder(true);
      setIntentError('');

      try {
        await paymentService.cancelCheckout(
          activeOrder.orderNumber,
        );

        if (!mountedRef.current) {
          return;
        }

        setCancelConfirmOpen(false);
        resetPayment();
        setActiveOrder(null);
        setCheckoutKey('');
        setPaymentSessionKey('');

        await reloadCart();

        if (mountedRef.current) {
          navigate('/cart', {
            replace: true,
          });
        }
      } catch (err) {
        if (mountedRef.current) {
          setIntentError(
            err?.message ||
              'We could not cancel this order safely. Please try again.',
          );
          setCancelConfirmOpen(false);
        }
      } finally {
        cancellingRef.current = false;

        if (mountedRef.current) {
          setCancellingOrder(false);
        }
      }
    }, [
      activeOrder,
      navigate,
      reloadCart,
      resetPayment,
    ]);

  const retryPayment = useCallback(
    async (orderNumber) => {
      if (
        retryingRef.current ||
        !orderNumber
      ) {
        return;
      }

      retryingRef.current = true;
      setIntentError('');

      try {
        const data =
          await paymentService.retry(
            orderNumber,
          );

        if (!mountedRef.current) {
          return;
        }

        if (
          !data?.client_secret ||
          !data?.payment_intent_id
        ) {
          throw new Error(
            'A fresh payment session could not be created.',
          );
        }

        setPaymentSessionKey(
          `${data.payment_intent_id}:${Date.now()}`,
        );

        setIntent(data);

        setActiveOrder((current) => ({
          ...(current || {}),
          orderNumber:
            data.order_number ||
            orderNumber,
          orderId: data.order_id,
          paymentMethod: 'stripe',
          paymentIntentId:
            data.payment_intent_id,
        }));
      } catch (err) {
        if (mountedRef.current) {
          setIntentError(
            err?.message ||
              'Unable to retry the payment.',
          );
        }

        throw err;
      } finally {
        retryingRef.current = false;
      }
    },
    [],
  );

  const goToOrderSuccess = useCallback(
    (orderNumber, method) => {
      const number = text(orderNumber);

      if (!number) {
        navigate('/orders', {
          replace: true,
        });
        return;
      }

      const params =
        new URLSearchParams({
          order: number,
          payment: method,
        });

      navigate(
        `/order/success?${params.toString()}`,
        { replace: true },
      );
    },
    [navigate],
  );

  /*
   * COD creation is already a completed order
   * creation on the backend. The modal can expose
   * the success action through PaymentMethodModal.
   */
  const handleCodSuccess =
    useCallback(() => {
      goToOrderSuccess(
        activeOrder?.orderNumber,
        'cod',
      );
    }, [
      activeOrder?.orderNumber,
      goToOrderSuccess,
    ]);

  if (cartLoading) {
    return (
      <div className="page container checkout-loading-page mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px]">
        <Spinner label="Preparing your checkout…" />
      </div>
    );
  }

  if (!canProceed && !activeOrder) {
    return (
      <div className="page container mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4">
        <div className="page-heading compact mb-5 min-w-0 max-w-[760px]">
          <p className="eyebrow mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.2em] text-gold">Checkout</p>
          <h1>Your bag is empty.</h1>
        </div>

        <button
          className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold uppercase tracking-[.04em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() =>
            navigate('/shop')
          }
        >
          Continue shopping
        </button>
      </div>
    );
  }

  const paymentContent =
    intent?.client_secret ? (
      <Elements
        key={
          paymentSessionKey ||
          intent.payment_intent_id
        }
        stripe={stripePromise}
        options={{
          clientSecret:
            intent.client_secret,
          loader: 'auto',
        }}
      >
        <StripePaymentForm
          orderNumber={
            intent.order_number ||
            activeOrder?.orderNumber
          }
          clientSecret={
            intent.client_secret
          }
          onSuccess={() =>
            goToOrderSuccess(
              intent.order_number ||
                activeOrder?.orderNumber,
              'stripe',
            )
          }
          onRetry={retryPayment}
        />
      </Elements>
    ) : null;

  return (
    <div className="page container checkout">
      <button
        type="button"
        className="checkout-back mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-transparent px-2 text-xs font-semibold text-muted transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        onClick={() => {
          if (!activeOrder) {
            navigate('/cart');
          }
        }}
        disabled={Boolean(activeOrder)}
      >
        <RiArrowLeftLine
          size={16}
          aria-hidden="true"
        />
        Back to cart
      </button>

      <div className="checkout-heading page-heading compact mb-6 min-w-0 max-w-[760px]">
        <p className="eyebrow mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
          <RiLockLine
            size={13}
            aria-hidden="true"
          />
          Secure checkout
        </p>

        <h1>Complete your order.</h1>

        <p className="checkout-subtitle mt-3 max-w-[58ch] text-sm leading-6 text-muted">
          Your address, payment and order
          details stay protected throughout
          checkout.
        </p>
      </div>

      <div
        className="checkout-steps mb-7 flex min-w-0 items-center gap-2 text-xs text-dim max-[560px]:gap-1.5 [&_span]:inline-flex [&_span]:min-h-10 [&_span]:items-center [&_span]:gap-1.5 [&_span]:rounded-full [&_span]:border [&_span]:border-line [&_span]:px-3 [&_span]:font-semibold [&_span]:whitespace-nowrap [&_span]:max-[560px]:px-2.5 [&_.is-complete]:border-[rgba(111,191,138,.45)] [&_.is-complete]:bg-success-dim [&_.is-complete]:text-success [&_.is-current]:border-gold [&_.is-current]:bg-gold-dim [&_.is-current]:text-gold-soft [&_i]:h-px [&_i]:min-w-4 [&_i]:flex-1 [&_i]:bg-line"
        aria-label="Checkout progress"
      >
        <span className="is-complete">
          <b>1</b> Shipping
        </span>

        <i aria-hidden="true" />

        <span
          className="is-current"
          aria-current="step"
        >
          <b>2</b> Payment
        </span>

        <i aria-hidden="true" />

        <span>
          <b>3</b> Review
        </span>
      </div>

      <div className="checkout-layout checkout-layout-refined grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(300px,380px)] items-start gap-6 max-[900px]:grid-cols-1">
        <div className="checkout-main min-w-0 space-y-4">
          <section className="checkout-section min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card max-[560px]:p-4">
            <div className="checkout-section-heading mb-5 flex min-w-0 items-start justify-between gap-4 max-[560px]:flex-col">
              <div>
                <p className="section-kicker mb-1 text-[10px] font-semibold uppercase tracking-[.16em] text-gold">
                  Delivery
                </p>
                <h2>
                  1 · Delivery address
                </h2>
              </div>

              <span className="checkout-live-badge inline-flex min-h-8 shrink-0 items-center rounded-full border border-[rgba(111,191,138,.40)] bg-success-dim px-2.5 text-[10px] font-semibold uppercase tracking-[.08em] text-success">
                Used for shipping
              </span>
            </div>

            {addressError && (
              <ErrorState
                message={addressError}
                onRetry={loadAddresses}
              />
            )}

            {addresses.length > 0 &&
              !showForm && (
                <div className="address-list grid min-w-0 gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-card ${
                        String(selected) ===
                        String(addr.id)
                          ? 'is-selected'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        disabled={Boolean(
                          activeOrder,
                        )}
                        checked={
                          String(selected) ===
                          String(addr.id)
                        }
                        onChange={() => {
                          setSelected(
                            addr.id,
                          );
                          resetPayment();
                        }}
                      />

                      <div>
                        <strong>
                          {text(
                            addr.full_name,
                            'Delivery',
                          )}
                        </strong>

                        <p>
                          {text(addr.line1)}

                          {addr.line2
                            ? `, ${addr.line2}`
                            : ''}

                          {addr.city
                            ? `, ${addr.city}`
                            : ''}

                          {addr.state
                            ? `, ${addr.state}`
                            : ''}

                          {addr.postal_code
                            ? ` — ${addr.postal_code}`
                            : ''}

                          {addr.country
                            ? `, ${addr.country}`
                            : ''}
                        </p>

                        {addr.email && (
                          <p>
                            {addr.email}
                          </p>
                        )}

                        {addr.is_default && (
                          <span className="chip chip-sm inline-flex min-h-8 items-center rounded-full border border-gold bg-gold-dim px-2.5 text-[10px] font-semibold uppercase tracking-[.08em] text-gold-soft">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}

                  <button
                    className="btn btn-quiet btn-sm inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-transparent px-3 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    type="button"
                    disabled={Boolean(
                      activeOrder,
                    )}
                    onClick={() =>
                      setShowForm(true)
                    }
                  >
                    <RiAddLine
                      size={15}
                      aria-hidden="true"
                    />
                    Add a new address
                  </button>
                </div>
              )}

            {addresses.length === 0 &&
              !showForm && (
                <div className="state flex min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-line bg-bg px-5 py-12 text-center text-muted">
                  <p>
                    You’ll need a delivery
                    address to check out.
                  </p>

                  <button
                    type="button"
                    className="btn btn-sm inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gold px-3.5 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    onClick={() =>
                      setShowForm(true)
                    }
                  >
                    <RiAddLine
                      size={15}
                      aria-hidden="true"
                    />
                    Add address
                  </button>
                </div>
              )}

            {showForm && !activeOrder && (
              <AddressForm
                onSaved={async () => {
                  setShowForm(false);
                  await loadAddresses();
                }}
                onCancel={() =>
                  setShowForm(false)
                }
              />
            )}

            {selectedAddress && (
              <div className="address-flow-note mt-3 rounded-xl border border-line-soft bg-bg px-3.5 py-3 text-xs leading-5 text-dim">
                <RiLockLine
                  size={15}
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Billing address
                  </strong>

                  <span>
                    Same as your delivery
                    address. It will be mapped
                    automatically to the order.
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="checkout-section checkout-shipping-options min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card max-[560px]:p-4">
            <div className="checkout-section-heading mb-5 flex min-w-0 items-start justify-between gap-4 max-[560px]:flex-col">
              <div>
                <p className="section-kicker mb-1 text-[10px] font-semibold uppercase tracking-[.16em] text-gold">
                  Shipping
                </p>

                <h2>
                  Choose delivery partner
                </h2>
              </div>

              <span className="checkout-live-badge inline-flex min-h-8 shrink-0 items-center rounded-full border border-success/40 bg-success-dim px-2.5 text-[10px] font-semibold uppercase tracking-[.08em] text-success">
                Live delivery rates
              </span>
            </div>

            {shippingQuoteLoading && (
              <p
                className="free-ship-note mt-3 rounded-xl border border-[rgba(216,173,106,.30)] bg-gold-dim px-3 py-2.5 text-xs leading-5 text-gold-soft"
                role="status"
              >
                <RiLoader4Line
                  className="spin animate-spin"
                  size={15}
                  aria-hidden="true"
                />
                Loading available delivery
                partners…
              </p>
            )}

            {shippingQuoteError && (
              <div
                className="form-error mb-4 w-full rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
                role="alert"
              >
                {shippingQuoteError}
              </div>
            )}

            {!shippingQuoteLoading &&
              !shippingQuoteError &&
              shippingOptions.length > 0 && (
                <div
                  className="shipping-courier-list grid min-w-0 gap-2.5"
                  role="radiogroup"
                  aria-label="Choose delivery partner"
                >
                  {shippingOptions.map(
                    (courier) => {
                      const id = String(
                        courier?.courier_id ||
                          '',
                      );

                      const checked =
                        id ===
                        String(
                          selectedCourierId,
                        );

                      const deliveryMode =
                        getDeliveryMode(
                          courier,
                        );

                      const estimate =
                        courier?.estimated_delivery_days
                          ? `Estimated delivery: ${courier.estimated_delivery_days} days`
                          : courier?.etd_hours
                            ? `Estimated delivery: ${courier.etd_hours} hours`
                            : 'Delivery estimate provided by the shipping service';

                      return (
                        <label
                          key={id}
                          className={`shipping-courier-card ${
                            checked
                              ? 'is-selected'
                              : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="shipping-courier"
                            value={id}
                            checked={checked}
                            disabled={Boolean(
                              activeOrder,
                            )}
                            onChange={() =>
                              selectCourier(
                                courier,
                              )
                            }
                          />

                          <span className="shipping-courier-copy flex min-w-0 flex-1 flex-col gap-1">
                            <strong>
                              {text(
                                courier.courier_name,
                                'Delivery partner',
                              )}
                            </strong>

                            <small>
                              {deliveryMode
                                ? `${deliveryMode} · `
                                : ''}
                              {estimate}
                            </small>
                          </span>

                          <span className="shipping-courier-price shrink-0 text-sm font-semibold tabular-nums text-text">
                            {formatMoney(
                              courier.shipping_cost,
                            )}
                          </span>
                        </label>
                      );
                    },
                  )}
                </div>
              )}

            {shippingQuote && (
              <p className="free-ship-note mt-3 rounded-xl border border-[rgba(216,173,106,.30)] bg-gold-dim px-3 py-2.5 text-xs leading-5 text-gold-soft">
                <RiArrowRightLine
                  size={15}
                  aria-hidden="true"
                />

                Selected:{' '}
                <b>
                  {text(
                    shippingQuote.courier_name,
                    'Delivery partner',
                  )}
                </b>

                {selectedDeliveryMode
                  ? ` · ${selectedDeliveryMode}`
                  : ''}

                {' · '}

                {formatMoney(
                  shippingQuote.shipping_cost,
                )}
              </p>
            )}

            {shippingQuote &&
              !selectedDeliveryMode && (
                <p className="free-ship-note mt-3 rounded-xl border border-[rgba(216,173,106,.30)] bg-gold-dim px-3 py-2.5 text-xs leading-5 text-gold-soft">
                  Delivery mode is shown only
                  when the shipping service
                  provides it. LUVIIO does not
                  guess the vehicle or delivery
                  mode from a courier name.
                </p>
              )}
          </section>

          <section className="checkout-section min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card max-[560px]:p-4">
            <h2>2 · Coupon</h2>

            {coupon ? (
              <div className="payment-selector flex min-w-0 items-start justify-between gap-4 rounded-xl border border-line bg-bg p-4 max-[560px]:flex-col">
                <div className="payment-selector-copy flex min-w-0 flex-col gap-1.5">
                  <span className="payment-selector-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.08em] text-text">
                    <RiCoupon3Line
                      size={15}
                      aria-hidden="true"
                    />
                    Applied coupon
                  </span>

                  <strong>
                    {coupon.code}
                  </strong>

                  <small>
                    You saved{' '}
                    {formatMoney(
                      couponDiscount,
                    )}{' '}
                    on this order.
                  </small>
                </div>

                <button
                  className="btn btn-quiet btn-sm inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-transparent px-3 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  type="button"
                  disabled={Boolean(
                    activeOrder,
                  )}
                  onClick={removeCoupon}
                >
                  <RiCloseLine
                    size={15}
                    aria-hidden="true"
                  />
                  Remove
                </button>
              </div>
            ) : (
              <div className="payment-selector flex min-w-0 items-start justify-between gap-4 rounded-xl border border-line bg-bg p-4 max-[560px]:flex-col">
                <div className="payment-selector-copy flex min-w-0 flex-col gap-1.5">
                  <span className="payment-selector-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.08em] text-text">
                    <RiCoupon3Line
                      size={15}
                      aria-hidden="true"
                    />
                    Have a coupon?
                  </span>

                  <small>
                    Enter a valid promo code
                    to apply the
                    backend-calculated
                    discount.
                  </small>
                </div>

                <div className="coupon-input-row grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 max-[480px]:grid-cols-1 [&_input]:min-h-11 [&_input]:min-w-0 [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-surface [&_input]:px-3.5 [&_input]:text-sm [&_input]:font-semibold [&_input]:tracking-[.08em] [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)]">
                  <input
                    disabled={Boolean(
                      activeOrder,
                    )}
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(
                        event.target.value.toUpperCase(),
                      );
                      setCouponError('');
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        'Enter'
                      ) {
                        event.preventDefault();
                        applyCoupon();
                      }
                    }}
                    placeholder="PROMO CODE"
                    maxLength={40}
                    autoComplete="off"
                    aria-label="Coupon code"
                  />

                  <button
                    className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold uppercase tracking-[.04em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={applyCoupon}
                    disabled={
                      couponLoading ||
                      !couponInput.trim() ||
                      Boolean(activeOrder)
                    }
                    aria-busy={
                      couponLoading
                    }
                  >
                    {couponLoading
                      ? 'Applying…'
                      : 'Apply'}
                  </button>
                </div>
              </div>
            )}

            {couponError && (
              <div
                className="form-error mb-4 w-full rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
                role="alert"
              >
                {couponError}
              </div>
            )}
          </section>

          <section className="checkout-section checkout-payment-launch min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card max-[560px]:p-4">
            <h2>3 · Payment</h2>

            {intentError && (
              <div
                className="form-error mb-4 w-full rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
                role="alert"
                aria-live="assertive"
              >
                {intentError}
              </div>
            )}

            <div className="payment-selector flex min-w-0 items-start justify-between gap-4 rounded-xl border border-line bg-bg p-4 max-[560px]:flex-col">
              <div className="payment-selector-copy flex min-w-0 flex-col gap-1.5">
                <span className="payment-selector-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.08em] text-text">
                  Payment &amp; review
                </span>

                <strong>
                  {paymentMethod ===
                  'stripe'
                    ? 'Stripe'
                    : paymentMethod ===
                        'cod'
                      ? 'Cash on Delivery'
                      : 'Choose payment method'}
                </strong>

                <small>
                  {activeOrder
                    ? `Order ${activeOrder.orderNumber} is active. Finish payment or cancel this order.`
                    : 'Select your payment method, review the selected address and complete payment securely.'}
                </small>
              </div>

              <button
                className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold uppercase tracking-[.04em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={
                  openPaymentChooser
                }
                disabled={
                  creating ||
                  !selected ||
                  !selectedPhoneValid ||
                  !selectedCourierId ||
                  !shippingQuote ||
                  Boolean(activeOrder)
                }
                aria-busy={creating}
              >
                {creating
                  ? 'Preparing…'
                  : 'Choose Payment Method'}

                <RiArrowRightLine
                  size={17}
                  aria-hidden="true"
                />
              </button>

              {!selectedPhoneValid &&
                selectedAddress && (
                  <p
                    className="form-error mb-4 w-full rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
                    role="alert"
                  >
                    A valid Indian mobile
                    number is required for
                    delivery booking. Edit
                    this address before
                    continuing.
                  </p>
                )}
            </div>
          </section>
        </div>

        <aside
          className="summary checkout-summary sticky top-[92px] min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card max-[900px]:static max-[560px]:p-4"
          aria-label="Order summary"
        >
          <p className="eyebrow mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
            Order summary
          </p>

          <ul className="summary-items mb-4 space-y-2.5 border-b border-line pb-4 text-xs text-muted [&_li]:flex [&_li]:items-start [&_li]:justify-between [&_li]:gap-3 [&_strong]:text-text">
            {items
              .slice(0, 6)
              .map((item) => (
                <li
                  key={
                    item.product_id
                  }
                >
                  <span>
                    {text(
                      item.name,
                      'Product',
                    )}{' '}
                    × {item.quantity}
                  </span>

                  <strong>
                    {formatMoney(
                      item.line_total,
                    )}
                  </strong>
                </li>
              ))}

            {items.length > 6 && (
              <li>
                <span>
                  + {items.length - 6}{' '}
                  more
                </span>
              </li>
            )}
          </ul>

          <dl className="summary-lines space-y-3 text-sm text-muted [&_div]:flex [&_div]:items-start [&_div]:justify-between [&_dd]:m-0 [&_dd]:font-medium [&_dd]:text-text">
            <div>
              <dt>Subtotal</dt>
              <dd>
                {formatMoney(
                  cart?.subtotal,
                )}
              </dd>
            </div>

            <div>
              <dt>Shipping</dt>
              <dd>
                {shippingQuote
                  ? formatMoney(
                      shippingQuote.shipping_cost,
                    )
                  : shippingQuoteLoading
                    ? 'Calculating…'
                    : 'Calculated at checkout'}
              </dd>
            </div>

            {shippingQuote && (
              <div className="checkout-shipping-detail mt-1 text-xs leading-5 text-dim">
                <span>
                  <b>
                    {text(
                      shippingQuote.courier_name,
                      'Delivery partner',
                    )}
                  </b>

                  {shippingQuote.estimated_delivery_days ? (
                    <small>
                      Estimated delivery:{' '}
                      {
                        shippingQuote.estimated_delivery_days
                      }{' '}
                      days
                    </small>
                  ) : shippingQuote.etd_hours ? (
                    <small>
                      Estimated delivery:{' '}
                      {
                        shippingQuote.etd_hours
                      }{' '}
                      hours
                    </small>
                  ) : null}
                </span>

                <em>Live rate</em>
              </div>
            )}

            <div>
              <dt>Product GST</dt>
              <dd>
                {formatMoney(
                  cart?.tax_amount,
                )}
              </dd>
            </div>

            {couponDiscount > 0 && (
              <div>
                <dt>Coupon</dt>
                <dd>
                  −
                  {formatMoney(
                    couponDiscount,
                  )}
                </dd>
              </div>
            )}

            <div>
              <dt>Current cart total</dt>
              <dd>
                {backendCartTotal != null
                  ? formatMoney(
                      backendCartTotal,
                    )
                  : '—'}
              </dd>
            </div>

            <div className="total mt-4 flex items-center justify-between border-t border-line pt-4 text-base font-semibold text-text">
              <dt>Final order total</dt>
              <dd>
                Confirmed securely at
                payment
              </dd>
            </div>
          </dl>

          {shippingQuoteLoading && (
            <p
              className="free-ship-note shipping-loading-note mt-3 rounded-xl border border-line-soft bg-bg px-3 py-2.5 text-xs leading-5 text-dim"
              role="status"
            >
              <RiLoader4Line
                className="spin animate-spin"
                size={15}
                aria-hidden="true"
              />
              Calculating live delivery
              rates…
            </p>
          )}

          {shippingQuote && (
            <p className="free-ship-note mt-3 rounded-xl border border-[rgba(216,173,106,.30)] bg-gold-dim px-3 py-2.5 text-xs leading-5 text-gold-soft">
              <RiArrowRightLine
                size={15}
                aria-hidden="true"
              />

              Selected delivery partner:{' '}
              {text(
                shippingQuote.courier_name,
                'Delivery partner',
              )}
              . Final payable amount is
              confirmed by LUVIIO's backend
              during order/payment creation.
            </p>
          )}
        </aside>
      </div>

      <PaymentMethodModal
        open={paymentModalOpen}
        value={paymentMethod}
        onChange={(method) => {
          if (activeOrder || creating) {
            return;
          }

          setPaymentMethod(method);
          setIntent(null);
          setIntentError('');
          setPaymentReview(false);
          setPaymentSessionKey('');
        }}
        onClose={() => {
          if (
            !creating &&
            !activeOrder
          ) {
            resetPayment();
          }
        }}
        onContinue={
          handleModalContinue
        }
        loading={creating}
        review={paymentReview}
        address={selectedAddress}
        total="Confirmed securely by Luviio at payment"
        onBack={handleModalBack}
        activeOrder={activeOrder}
        onCancelOrder={
          requestCancelOrder
        }
        cancellingOrder={
          cancellingOrder
        }
      >
        {paymentContent ||
          (activeOrder?.paymentMethod ===
          'cod' ? (
            <div className="payment-review mt-4 min-w-0">
              <div className="payment-review-card min-w-0 rounded-xl border border-line bg-bg p-4">
                <RiAlertLine
                  size={20}
                  aria-hidden="true"
                />

                <strong>
                  COD order created
                </strong>

                <p>
                  Order{' '}
                  <b>
                    {
                      activeOrder.orderNumber
                    }
                  </b>{' '}
                  is reserved for you.
                </p>

                <button
                  type="button"
                  className="btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold uppercase tracking-[.04em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={
                    handleCodSuccess
                  }
                >
                  View order
                  <RiArrowRightLine
                    size={17}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          ) : null)}
      </PaymentMethodModal>

      {cancelConfirmOpen && (
        <div
          className="checkout-cancel-modal-backdrop fixed inset-0 z-[500] grid place-items-center bg-black/70 p-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !cancellingRef.current
            ) {
              setCancelConfirmOpen(
                false,
              );
            }
          }}
        >
          <div
            ref={cancelModalRef}
            className="checkout-cancel-modal w-full max-w-[460px] overflow-auto rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,.45)] max-[480px]:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              cancelTitleId
            }
            tabIndex={-1}
          >
            <div
              className="checkout-cancel-modal-icon mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(224,115,95,.12)] text-danger"
              aria-hidden="true"
            >
              <RiErrorWarningLine
                size={26}
              />
            </div>

            <div className="checkout-cancel-modal-copy min-w-0 text-sm leading-6 text-muted">
              <p className="eyebrow mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
                Payment checkout
              </p>

              <h3 id={cancelTitleId}>
                Are you sure you want to
                cancel this order?
              </h3>

              <p>
                This will cancel order{' '}
                <b>
                  #
                  {
                    activeOrder?.orderNumber
                  }
                </b>{' '}
                and release any backend
                reservation associated
                with it. The cancelled
                order items will not be
                added back to your cart
                unless the backend
                explicitly restores them.
              </p>
            </div>

            <div className="checkout-cancel-modal-actions mt-5 flex flex-wrap justify-end gap-2 max-[480px]:flex-col">
              <button
                ref={cancelCloseRef}
                type="button"
                className="btn btn-quiet inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-transparent px-4 text-xs font-semibold text-text transition-colors hover:border-gold hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                  setCancelConfirmOpen(
                    false,
                  )
                }
                disabled={
                  cancellingOrder
                }
              >
                Keep order
              </button>

              <button
                type="button"
                className="btn checkout-cancel-danger inline-flex min-h-11 items-center justify-center rounded-xl border border-danger bg-transparent px-4 text-xs font-bold uppercase tracking-[.04em] text-danger transition-colors hover:bg-danger-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[480px]:w-full"
                onClick={
                  cancelActiveOrder
                }
                disabled={
                  cancellingOrder
                }
                aria-busy={
                  cancellingOrder
                }
              >
                {cancellingOrder
                  ? 'Cancelling…'
                  : 'Yes, cancel order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}