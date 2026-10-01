import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import {
  RiArrowRightSLine,
  RiCloseLine,
  RiEditLine,
  RiSaveLine,
} from '@remixicon/react';
import { userService } from '../services/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

function text(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizePhone(value) {
  const normalized = text(value).replace(
    /[\s()-]/g,
    '',
  );

  if (normalized.startsWith('+91')) {
    return normalized.slice(3);
  }

  if (normalized.startsWith('91') && normalized.length === 12) {
    return normalized.slice(2);
  }

  if (normalized.startsWith('0') && normalized.length === 11) {
    return normalized.slice(1);
  }

  return normalized;
}

function getUserName(user) {
  return text(
    user?.full_name || user?.name,
  );
}

function getUserPhone(user) {
  return text(user?.phone);
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      savingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (editing || savingRef.current) {
      return;
    }

    setFullName(getUserName(user));
    setPhone(getUserPhone(user));
  }, [editing, user]);

  const startEditing = () => {
    if (savingRef.current) {
      return;
    }

    setError('');
    setFullName(getUserName(user));
    setPhone(getUserPhone(user));
    setEditing(true);
  };

  const cancelEditing = () => {
    if (savingRef.current) {
      return;
    }

    setError('');
    setFullName(getUserName(user));
    setPhone(getUserPhone(user));
    setEditing(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (
      savingRef.current ||
      saving
    ) {
      return;
    }

    setError('');

    const nextFullName = text(fullName);
    const nextPhone = normalizePhone(phone);

    if (
      nextFullName &&
      nextFullName.length > 120
    ) {
      setError(
        'Full name must be 120 characters or fewer.',
      );
      return;
    }

    if (
      nextPhone &&
      !PHONE_PATTERN.test(nextPhone)
    ) {
      setError(
        'Please enter a valid Indian mobile number.',
      );
      return;
    }

    const currentFullName =
      getUserName(user);

    const currentPhone =
      normalizePhone(getUserPhone(user));

    const payload = {};

    if (
      nextFullName !== currentFullName
    ) {
      payload.full_name =
        nextFullName || undefined;
    }

    if (
      nextPhone !== currentPhone
    ) {
      payload.phone =
        nextPhone || undefined;
    }

    if (
      Object.keys(payload).length === 0
    ) {
      setEditing(false);
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await userService.updateMe(payload);

      if (!mountedRef.current) {
        return;
      }

      await refreshProfile();

      if (!mountedRef.current) {
        return;
      }

      setEditing(false);
      setError('');

      toast.success(
        'Profile updated.',
      );
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(
        err?.message ||
          'Unable to update your profile.',
      );
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  const displayName =
    getUserName(user) || 'Not set';

  const displayPhone =
    getUserPhone(user) || 'Not set';

  const displayEmail =
    text(user?.email) ||
    'Not available';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Your account
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Profile
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Keep your contact details up to date for orders and delivery.
            </p>
          </div>
        </div>
      </header>

      <nav
        className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-surface/80 p-1.5 sm:mb-8 sm:inline-flex sm:w-auto"
        aria-label="Account navigation"
      >
        <Link
          to="/orders"
          className="rounded-xl px-3 py-2.5 text-center text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-4 sm:text-sm"
        >
          Orders
        </Link>
        <Link
          to="/account/addresses"
          className="rounded-xl px-3 py-2.5 text-center text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-4 sm:text-sm"
        >
          Addresses
        </Link>
        <Link
          to="/account/settings"
          className="rounded-xl px-3 py-2.5 text-center text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-4 sm:text-sm"
        >
          Settings
        </Link>
      </nav>

      <section
        className="overflow-hidden rounded-3xl border border-line bg-surface shadow-luviio-card"
        aria-labelledby="profile-details-heading"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Account details
            </p>
            <h2
              id="profile-details-heading"
              className="text-lg font-semibold text-text sm:text-xl"
            >
              Your information
            </h2>
          </div>

          {!editing && (
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={startEditing}
              aria-label="Edit profile"
              title="Edit profile"
              disabled={saving}
            >
              <RiEditLine size={19} aria-hidden="true" />
            </button>
          )}
        </div>

        {error && (
          <div
            className="mx-5 mt-5 rounded-2xl border border-danger/30 bg-danger-dim px-4 py-3 text-sm leading-6 text-text sm:mx-7"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {!editing ? (
          <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Full name
              </p>
              <p className="mt-2 break-words text-base font-semibold text-text">
                {displayName}
              </p>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Email
              </p>
              <p className="mt-2 break-all text-base font-semibold text-text">
                {displayEmail}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-dim">
                Email cannot be changed here.
              </p>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Phone
              </p>
              <p className="mt-2 break-words text-base font-semibold text-text">
                {displayPhone}
              </p>
            </div>
          </div>
        ) : (
          <form
            className="space-y-5 px-5 py-5 sm:px-7 sm:py-7"
            onSubmit={onSubmit}
            noValidate
            aria-busy={saving}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-text"
                  htmlFor="full-name"
                >
                  Full name
                </label>
                <input
                  className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-text outline-none transition placeholder:text-dim focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
                  id="full-name"
                  name="full_name"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="name"
                  autoFocus
                  maxLength={120}
                  aria-invalid={Boolean(error)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-text"
                  htmlFor="profile-email"
                >
                  Email
                </label>
                <input
                  className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted outline-none"
                  id="profile-email"
                  name="email"
                  type="email"
                  value={displayEmail}
                  disabled
                  readOnly
                  autoComplete="email"
                />
                <p className="text-xs leading-5 text-dim">
                  Email cannot be changed here.
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label
                  className="block text-sm font-semibold text-text"
                  htmlFor="profile-phone"
                >
                  Phone
                </label>
                <input
                  className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-text outline-none transition placeholder:text-dim focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xl"
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Optional"
                  maxLength={16}
                  aria-invalid={Boolean(error)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-transparent px-5 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={cancelEditing}
                disabled={saving}
              >
                <RiCloseLine size={17} aria-hidden="true" />
                Cancel
              </button>

              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-bold text-gold-ink shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={saving}
                aria-busy={saving}
              >
                <RiSaveLine size={17} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default ProfilePage;
