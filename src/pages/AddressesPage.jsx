import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBinLine,
} from '@remixicon/react';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import { userService } from '../services/users';
import { useToast } from '../context/ToastContext';
import {
  EmptyState,
  ErrorState,
  Spinner,
} from '../components/ui/States';

function normalizeCountry(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function AddressForm({
  onSaved,
  onCancel,
  defaultCountry = 'IN',
  isDefault = false,
}) {
  const formId = useId();

  const [values, setValues] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: normalizeCountry(defaultCountry),
    full_name: '',
    email: '',
    phone: '',
    is_default: isDefault,
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const set = (key) => (event) => {
    const value =
      key === 'is_default'
        ? event.target.checked
        : event.target.value;

    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (savingRef.current) {
      return;
    }

    setError('');

    const line1 = values.line1.trim();
    const line2 = values.line2.trim();
    const city = values.city.trim();
    const state = values.state.trim();
    const postalCode = values.postal_code.trim();
    const country = normalizeCountry(values.country);
    const fullName = values.full_name.trim();
    const email = values.email.trim().toLowerCase();
    const phone = values.phone.trim();

    if (!line1 || !city || !postalCode || !email) {
      setError(
        'Street, city, postal code and email are required.',
      );
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(
        'Enter a valid email address for order updates.',
      );
      return;
    }

    if (!/^[A-Z]{2}$/.test(country)) {
      setError(
        'Enter a valid 2-letter country code.',
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await userService.addAddress({
        line1,
        line2: line2 || undefined,
        city,
        state: state || undefined,
        postal_code: postalCode,
        country,
        full_name: fullName || undefined,
        email,
        phone: phone || undefined,
        is_default: values.is_default,
      });

      if (!mountedRef.current) {
        return;
      }

      onSaved();
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err?.message ||
            'Unable to save this address.',
        );
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <form
      className="address-form"
      onSubmit={onSubmit}
      noValidate
    >
      {error && (
        <div
          className="form-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`${formId}-name`}>
            Full name (recipient)
          </label>

          <input
            id={`${formId}-name`}
            name="full_name"
            value={values.full_name}
            onChange={set('full_name')}
            autoComplete="name"
            disabled={saving}
          />
        </div>

        <div className="field">
          <label htmlFor={`${formId}-phone`}>
            Phone
          </label>

          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            value={values.phone}
            onChange={set('phone')}
            autoComplete="tel"
            inputMode="tel"
            disabled={saving}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${formId}-email`}>
          Email address *
        </label>

        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          value={values.email}
          onChange={set('email')}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          required
          aria-required="true"
          disabled={saving}
        />

        <small className="hint">
          Used for order confirmations and delivery updates.
        </small>
      </div>

      <div className="field">
        <label htmlFor={`${formId}-line1`}>
          Street address *
        </label>

        <input
          id={`${formId}-line1`}
          name="line1"
          value={values.line1}
          onChange={set('line1')}
          placeholder="House no, street"
          autoComplete="address-line1"
          required
          disabled={saving}
        />
      </div>

      <div className="field">
        <label htmlFor={`${formId}-line2`}>
          Apartment / area
        </label>

        <input
          id={`${formId}-line2`}
          name="line2"
          value={values.line2}
          onChange={set('line2')}
          autoComplete="address-line2"
          disabled={saving}
        />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`${formId}-city`}>
            City *
          </label>

          <input
            id={`${formId}-city`}
            name="city"
            value={values.city}
            onChange={set('city')}
            autoComplete="address-level2"
            required
            disabled={saving}
          />
        </div>

        <div className="field">
          <label htmlFor={`${formId}-state`}>
            State
          </label>

          <input
            id={`${formId}-state`}
            name="state"
            value={values.state}
            onChange={set('state')}
            autoComplete="address-level1"
            disabled={saving}
          />
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`${formId}-postal`}>
            Postal code *
          </label>

          <input
            id={`${formId}-postal`}
            name="postal_code"
            value={values.postal_code}
            onChange={set('postal_code')}
            autoComplete="postal-code"
            inputMode="numeric"
            required
            disabled={saving}
          />
        </div>

        <div className="field">
          <label htmlFor={`${formId}-country`}>
            Country (2-letter)
          </label>

          <input
            id={`${formId}-country`}
            name="country"
            maxLength={2}
            value={values.country}
            onChange={set('country')}
            autoComplete="country"
            autoCapitalize="characters"
            disabled={saving}
          />
        </div>
      </div>

      <label className="check-line">
        <input
          type="checkbox"
          checked={values.is_default}
          onChange={set('is_default')}
          disabled={saving}
        />

        <span>Set as default address</span>
      </label>

      <div className="btn-row">
        <button
          className="btn"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save address'}
        </button>

        <button
          className="btn btn-quiet"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const { toast } = useToast();

  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const deletingRef = useRef(false);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setError('');

    try {
      const list = await userService.getAddresses();

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setAddresses(
        Array.isArray(list) ? list : [],
      );
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        err?.message ||
          'Unable to load your addresses.',
      );
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [load]);

  const closeForm = () => {
    if (deletingRef.current) {
      return;
    }

    setShowForm(false);
  };

  const onDelete = async (id) => {
    if (!id || deletingRef.current) {
      return;
    }

    deletingRef.current = true;
    setDeleting(true);

    try {
      await userService.deleteAddress(id);

      if (!mountedRef.current) {
        return;
      }

      toast.success('Address removed.');
      setDeleteId(null);
      await load();
    } catch (err) {
      if (mountedRef.current) {
        toast.error(
          err?.message ||
            'Unable to remove this address.',
        );
      }
    } finally {
      deletingRef.current = false;

      if (mountedRef.current) {
        setDeleting(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || deletingRef.current) {
      return;
    }

    await onDelete(deleteId);
  };

  return (
    <div className="page container addresses-page">
      <Link
        className="back-link"
        to="/account"
      >
        <RiArrowLeftLine
          size={15}
          aria-hidden="true"
        />
        Back to profile
      </Link>

      <div className="page-heading compact">
        <p className="eyebrow">Your account</p>
        <h1>Addresses.</h1>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={load}
        />
      ) : addresses === null ? (
        <Spinner label="Loading addresses…" />
      ) : (
        <div className="address-list manage">
          {addresses.length === 0 &&
            !showForm && (
              <EmptyState
                title="No addresses yet"
                message="Add a delivery address for checkout."
              />
            )}

          {addresses.map((address) => (
            <article
              className="address-card-manage"
              key={address.id}
            >
              <div className="address-card-content">
                <div className="address-card-title">
                  <strong>
                    {address.full_name ||
                      'Delivery'}
                  </strong>

                  {address.is_default && (
                    <span className="chip chip-sm">
                      Default
                    </span>
                  )}
                </div>

                <p>
                  {address.line1}

                  {address.line2
                    ? `, ${address.line2}`
                    : ''}

                  {address.city
                    ? `, ${address.city}`
                    : ''}

                  {address.state
                    ? `, ${address.state}`
                    : ''}

                  {address.postal_code
                    ? ` — ${address.postal_code}`
                    : ''}

                  {address.country
                    ? `, ${address.country}`
                    : ''}
                </p>

                {address.email && (
                  <small className="address-email">
                    {address.email}
                  </small>
                )}
              </div>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() =>
                  setDeleteId(address.id)
                }
                disabled={deleting}
                aria-label={`Delete ${
                  address.full_name ||
                  'delivery address'
                }`}
              >
                <RiDeleteBinLine
                  size={15}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  Delete address
                </span>
              </button>
            </article>
          ))}

          {showForm ? (
            <AddressForm
              onSaved={() => {
                setShowForm(false);
                load();
              }}
              onCancel={closeForm}
              isDefault={addresses.length === 0}
            />
          ) : (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() =>
                setShowForm(true)
              }
              disabled={deleting}
            >
              <RiAddLine
                size={15}
                aria-hidden="true"
              />
              Add address
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remove address?"
        message="This saved delivery address will be removed from your account."
        confirmLabel={
          deleting
            ? 'Removing…'
            : 'Remove address'
        }
        danger
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteId(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}