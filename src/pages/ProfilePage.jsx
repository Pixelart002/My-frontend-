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
    <div className="page container profile-page">
      <div className="page-heading compact">
        <p className="eyebrow">
          Your account
        </p>

        <h1>Profile.</h1>
      </div>

      <nav
        className="account-links"
        aria-label="Account navigation"
      >
        <Link to="/orders">
          Order history
        </Link>

        <Link to="/account/addresses">
          Addresses
        </Link>

        <Link to="/account/settings">
          Settings
        </Link>
      </nav>

      <section
        className="profile-card card"
        aria-labelledby="profile-details-heading"
      >
        <div className="profile-card-header">
          <div>
            <p className="eyebrow">
              Account details
            </p>

            <h2 id="profile-details-heading">
              Your information
            </h2>
          </div>

          {!editing && (
            <button
              className="icon-btn"
              type="button"
              onClick={startEditing}
              aria-label="Edit profile"
              title="Edit profile"
              disabled={saving}
            >
              <RiEditLine
                size={20}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {!editing ? (
          <div
            className="profile-details"
            aria-label="Profile details"
          >
            <div className="profile-detail">
              <span>Full name</span>
              <strong>
                {displayName}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Email</span>

              <strong>
                {displayEmail}
              </strong>

              <small>
                Email cannot be changed here.
              </small>
            </div>

            <div className="profile-detail">
              <span>Phone</span>

              <strong>
                {displayPhone}
              </strong>
            </div>
          </div>
        ) : (
          <form
            className="profile-form"
            onSubmit={onSubmit}
            noValidate
            aria-busy={saving}
          >
            <div className="field">
              <label htmlFor="full-name">
                Full name
              </label>

              <input
                id="full-name"
                name="full_name"
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(
                    event.target.value,
                  );

                  if (error) {
                    setError('');
                  }
                }}
                autoComplete="name"
                autoFocus
                maxLength={120}
                aria-invalid={Boolean(error)}
                disabled={saving}
              />
            </div>

            <div className="field">
              <label htmlFor="profile-email">
                Email
              </label>

              <input
                id="profile-email"
                name="email"
                type="email"
                value={displayEmail}
                disabled
                readOnly
                autoComplete="email"
              />

              <span className="hint">
                Email cannot be changed here.
              </span>
            </div>

            <div className="field">
              <label htmlFor="profile-phone">
                Phone
              </label>

              <input
                id="profile-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(
                    event.target.value,
                  );

                  if (error) {
                    setError('');
                  }
                }}
                autoComplete="tel"
                inputMode="tel"
                placeholder="Optional"
                maxLength={16}
                aria-invalid={
                  Boolean(error)
                }
                disabled={saving}
              />
            </div>

            <div className="btn-row profile-actions">
              <button
                className="btn"
                type="submit"
                disabled={saving}
                aria-busy={saving}
              >
                <RiSaveLine
                  size={17}
                  aria-hidden="true"
                />

                {saving
                  ? 'Saving…'
                  : 'Save changes'}
              </button>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={cancelEditing}
                disabled={saving}
              >
                <RiCloseLine
                  size={17}
                  aria-hidden="true"
                />

                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}