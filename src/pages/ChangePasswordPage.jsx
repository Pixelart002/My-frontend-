import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
  RiLoader4Line,
} from '@remixicon/react';

import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fieldId = useId();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] =
    useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] =
    useState(false);

  const mountedRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const passwordLengthValid =
    newPassword.length >= 8 &&
    newPassword.length <= 128;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const canSubmit =
    passwordLengthValid &&
    passwordsMatch &&
    !submitting;

  const passwordStatus = !newPassword
    ? 'Enter a new password.'
    : newPassword.length < 8
      ? 'Use at least 8 characters.'
      : newPassword.length > 128
        ? 'Password cannot exceed 128 characters.'
        : passwordsMatch
          ? 'Password is ready to use.'
          : 'Enter the same password below.';

  const onSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    setError('');

    if (!passwordLengthValid) {
      setError(
        'Password must be between 8 and 128 characters.',
      );
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      await authService.resetPassword(
        newPassword,
      );

      if (!mountedRef.current) {
        return;
      }

      toast.success(
        'Password updated successfully.',
      );

      navigate('/account/settings', {
        replace: true,
      });
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err?.message ||
            'Unable to update your password.',
        );
      }
    } finally {
      submittingRef.current = false;

      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="page container change-password-page">
      <Link
        className="back-link"
        to="/account/settings"
      >
        <RiArrowLeftLine
          size={16}
          aria-hidden="true"
        />
        Back to settings
      </Link>

      <section
        className="change-password-card card"
        aria-labelledby={`${fieldId}-title`}
      >
        <div className="change-password-header">
          <span
            className="change-password-icon"
            aria-hidden="true"
          >
            <RiLockPasswordLine size={22} />
          </span>

          <div>
            <p className="eyebrow">
              Account security
            </p>

            <h1 id={`${fieldId}-title`}>
              Change password
            </h1>

            <p>
              Choose a new password for your
              signed-in Luviio account.
            </p>
          </div>
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

        <form
          className="change-password-form"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="field">
            <label htmlFor={`${fieldId}-new`}>
              New password
            </label>

            <div className="password-input-wrap">
              <input
                id={`${fieldId}-new`}
                name="new-password"
                type={
                  showNew
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(
                    event.target.value,
                  );
                  if (error) {
                    setError('');
                  }
                }}
                minLength={8}
                maxLength={128}
                aria-describedby={`${fieldId}-status ${fieldId}-rules`}
                required
                disabled={submitting}
              />

              <button
                className="password-visibility"
                type="button"
                onClick={() =>
                  setShowNew(
                    (value) => !value,
                  )
                }
                disabled={submitting}
                aria-label={
                  showNew
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-controls={`${fieldId}-new`}
                aria-pressed={showNew}
              >
                {showNew ? (
                  <RiEyeOffLine
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <RiEyeLine
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>

          <div
            id={`${fieldId}-rules`}
            className="password-rules"
            aria-label="Password requirements"
          >
            <div
              className={`password-rule ${
                passwordLengthValid
                  ? 'is-valid'
                  : ''
              }`}
            >
              <RiCheckLine
                size={15}
                aria-hidden="true"
              />
              <span>
                8–128 characters
              </span>
            </div>

            <div
              className={`password-rule ${
                passwordsMatch
                  ? 'is-valid'
                  : ''
              }`}
            >
              <RiCheckLine
                size={15}
                aria-hidden="true"
              />
              <span>
                Passwords match
              </span>
            </div>

            <small
              id={`${fieldId}-status`}
              className="hint"
              aria-live="polite"
            >
              {passwordStatus}
            </small>
          </div>

          <div className="field">
            <label htmlFor={`${fieldId}-confirm`}>
              Confirm new password
            </label>

            <div className="password-input-wrap">
              <input
                id={`${fieldId}-confirm`}
                name="confirm-password"
                type={
                  showConfirm
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value,
                  );
                  if (error) {
                    setError('');
                  }
                }}
                minLength={8}
                maxLength={128}
                aria-invalid={
                  confirmPassword.length > 0 &&
                  !passwordsMatch
                }
                required
                disabled={submitting}
              />

              <button
                className="password-visibility"
                type="button"
                onClick={() =>
                  setShowConfirm(
                    (value) => !value,
                  )
                }
                disabled={submitting}
                aria-label={
                  showConfirm
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-controls={`${fieldId}-confirm`}
                aria-pressed={showConfirm}
              >
                {showConfirm ? (
                  <RiEyeOffLine
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <RiEyeLine
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="btn-row change-password-actions">
            <button
              className="btn"
              type="submit"
              disabled={!canSubmit}
              aria-busy={submitting}
            >
              {submitting ? (
                <RiLoader4Line
                  className="spin"
                  size={17}
                  aria-hidden="true"
                />
              ) : (
                <RiLockPasswordLine
                  size={17}
                  aria-hidden="true"
                />
              )}

              {submitting
                ? 'Updating…'
                : 'Update password'}
            </button>

            <Link
              className="btn btn-ghost"
              to="/account/settings"
              aria-disabled={submitting}
              onClick={(event) => {
                if (submitting) {
                  event.preventDefault();
                }
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}