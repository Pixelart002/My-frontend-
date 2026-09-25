import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiUserAddLine,
} from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 120;

function getPasswordRequirements(password) {
  return {
    length:
      password.length >=
        MIN_PASSWORD_LENGTH &&
      password.length <=
        MAX_PASSWORD_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] =
    useState('');
  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [confirm, setConfirm] =
    useState('');
  const [showPw, setShowPw] =
    useState(false);
  const [showConfirm, setShowConfirm] =
    useState(false);
  const [error, setError] =
    useState('');
  const [submitting, setSubmitting] =
    useState(false);

  const requirements =
    getPasswordRequirements(password);

  const passwordValid =
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number;

  const passwordsMatch =
    confirm.length > 0 &&
    password === confirm;

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError('');

    const normalizedName =
      fullName.trim();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedName) {
      setError(
        'Please enter your name.',
      );
      return;
    }

    if (
      normalizedName.length >
      MAX_NAME_LENGTH
    ) {
      setError(
        `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
      );
      return;
    }

    if (!normalizedEmail) {
      setError(
        'Please enter your email.',
      );
      return;
    }

    if (
      normalizedEmail.length > 254 ||
      !EMAIL_PATTERN.test(
        normalizedEmail,
      )
    ) {
      setError(
        'Please enter a valid email address.',
      );
      return;
    }

    if (!requirements.length) {
      setError(
        `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (!requirements.uppercase) {
      setError(
        'Password must include an uppercase letter.',
      );
      return;
    }

    if (!requirements.lowercase) {
      setError(
        'Password must include a lowercase letter.',
      );
      return;
    }

    if (!requirements.number) {
      setError(
        'Password must include a number.',
      );
      return;
    }

    if (!passwordsMatch) {
      setError(
        'Passwords do not match.',
      );
      return;
    }

    setSubmitting(true);

    try {
      await register(
        normalizedEmail,
        password,
        normalizedName,
      );

      toast.success(
        'Your account has been created. Please sign in.',
      );

      navigate('/login', {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.message ||
          'Unable to create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const passwordHint = password ? (
    <span
      id="register-password-hint"
      className={`pw-strength ${
        passwordValid
          ? 'is-valid'
          : 'is-invalid'
      }`}
      role="status"
      aria-live="polite"
    >
      {passwordValid
        ? 'Password requirements are met.'
        : 'Use 8–128 characters with upper, lower and a number.'}
    </span>
  ) : (
    <span
      id="register-password-hint"
      className="hint mt-1 text-xs leading-5 text-dim"
    >
      Use 8–128 characters with upper,
      lower and a number.
    </span>
  );

  return (
    <div className="page auth-layout mx-auto w-full max-w-[460px] px-4 py-[clamp(40px,8vw,80px)] max-[560px]:px-3">
      <div className="auth-card w-full rounded-2xl border border-line bg-surface p-[clamp(24px,5vw,40px)] shadow-luviio-card max-[560px]:px-[18px]">
        <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
          New here
        </p>

        <h1>Create account</h1>

        <p className="auth-sub mb-6 text-sm leading-6 text-muted">
          Save your details and track
          orders across visits.
        </p>

        {error && (
          <div
            className="form-error mb-4 w-full rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          noValidate
          aria-busy={submitting}
        >
          <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_.err-text]:text-xs [&_.err-text]:text-danger [&_.hint]:text-xs [&_.hint]:leading-5 [&_.hint]:text-dim">
            <label htmlFor="register-full-name">
              Full name
            </label>

            <input
              id="register-full-name"
              name="full_name"
              type="text"
              autoComplete="name"
              autoFocus
              value={fullName}
              onChange={(event) => {
                setFullName(
                  event.target.value,
                );
                clearError();
              }}
              placeholder="Your name"
              maxLength={MAX_NAME_LENGTH}
              disabled={submitting}
              required
            />
          </div>

          <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_.err-text]:text-xs [&_.err-text]:text-danger [&_.hint]:text-xs [&_.hint]:leading-5 [&_.hint]:text-dim">
            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value,
                );
                clearError();
              }}
              placeholder="you@example.com"
              maxLength={254}
              disabled={submitting}
              required
            />
          </div>

          <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_.err-text]:text-xs [&_.err-text]:text-danger [&_.hint]:text-xs [&_.hint]:leading-5 [&_.hint]:text-dim">
            <label htmlFor="register-password">
              Password
            </label>

            <div className="password-input-wrap relative min-w-0">
              <input
                id="register-password"
                name="password"
                className="password-input w-full pr-12"
                type={
                  showPw
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );
                  clearError();
                }}
                placeholder="Min 8 chars, upper, lower, number"
                minLength={
                  MIN_PASSWORD_LENGTH
                }
                maxLength={
                  MAX_PASSWORD_LENGTH
                }
                aria-describedby="register-password-hint"
                aria-invalid={
                  password.length > 0 &&
                  !passwordValid
                }
                disabled={submitting}
                required
              />

              <button
                className="password-visibility absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-muted transition-colors hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                type="button"
                onClick={() =>
                  setShowPw(
                    (value) => !value,
                  )
                }
                aria-label={
                  showPw
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-pressed={showPw}
                title={
                  showPw
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={submitting}
              >
                {showPw ? (
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

            {passwordHint}
          </div>

          <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_.err-text]:text-xs [&_.err-text]:text-danger [&_.hint]:text-xs [&_.hint]:leading-5 [&_.hint]:text-dim">
            <label htmlFor="register-confirm">
              Confirm password
            </label>

            <div className="password-input-wrap relative min-w-0">
              <input
                id="register-confirm"
                name="confirm_password"
                className="password-input w-full pr-12"
                type={
                  showConfirm
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => {
                  setConfirm(
                    event.target.value,
                  );
                  clearError();
                }}
                placeholder="Repeat password"
                minLength={
                  MIN_PASSWORD_LENGTH
                }
                maxLength={
                  MAX_PASSWORD_LENGTH
                }
                aria-invalid={
                  confirm.length > 0 &&
                  !passwordsMatch
                }
                aria-describedby={
                  confirm.length > 0
                    ? 'register-confirm-hint'
                    : undefined
                }
                disabled={submitting}
                required
              />

              <button
                className="password-visibility absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-muted transition-colors hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                type="button"
                onClick={() =>
                  setShowConfirm(
                    (value) => !value,
                  )
                }
                aria-label={
                  showConfirm
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-pressed={
                  showConfirm
                }
                title={
                  showConfirm
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={submitting}
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

            {confirm && (
              <span
                id="register-confirm-hint"
                className={
                  passwordsMatch
                    ? 'hint is-valid'
                    : 'hint is-invalid'
                }
                role="status"
                aria-live="polite"
              >
                {passwordsMatch
                  ? 'Passwords match.'
                  : 'Passwords do not match.'}
              </span>
            )}
          </div>

          <button
            className="btn btn-block mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.06em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={
              submitting ||
              !fullName.trim() ||
              !email.trim() ||
              !passwordValid ||
              !passwordsMatch
            }
            aria-busy={submitting}
          >
            <RiUserAddLine
              size={16}
              aria-hidden="true"
            />

            {submitting
              ? 'Creating account…'
              : 'Create account'}
          </button>
        </form>

        <p className="auth-footer mt-6 text-center text-sm leading-6 text-muted [&_a]:font-semibold [&_a]:text-gold-soft [&_a:hover]:text-gold">
          Already have an account?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}