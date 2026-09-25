import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiLoginBoxLine,
} from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function getSafeRedirect(location) {
  const from = location.state?.from;
  
  if (typeof from !== 'string' || !from.trim()) {
    return '/';
  }
  
  // Keep redirects inside the Luviio SPA.
  if (!from.startsWith('/') || from.startsWith('//')) {
    return '/';
  }
  
  return from;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = getSafeRedirect(location);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const onSubmit = async (event) => {
    event.preventDefault();
    
    if (submitting) return;
    
    setError('');
    
    const normalizedEmail = email.trim();
    
    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await login(normalizedEmail, password);
      
      toast.success('Welcome back.');
      
      navigate(from, {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.message ||
        'Unable to sign in. Please check your details and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="page auth-layout mx-auto w-full max-w-[460px] px-4 py-[clamp(40px,8vw,80px)] max-[560px]:px-3">
      <div className="auth-card w-full rounded-2xl border border-line bg-surface p-[clamp(24px,5vw,40px)] shadow-luviio-card max-[560px]:px-[18px]">
        <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">Welcome back</p>

        <h1>Sign in</h1>

        <p className="auth-sub mb-6 text-sm leading-6 text-muted">
          Access your bag, orders and saved addresses.
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
            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              inputMode="email"
              spellCheck={false}
              autoCapitalize="none"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
              }}
              placeholder="you@example.com"
              required
              disabled={submitting}
            />
          </div>

          <div className="field mb-4 flex min-w-0 flex-col gap-1.5 [&>label]:text-[11px] [&>label]:font-semibold [&>label]:uppercase [&>label]:tracking-[.06em] [&>label]:text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-bg [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-text [&_input]:outline-none [&_input:focus]:border-gold [&_input:focus]:ring-2 [&_input:focus]:ring-[rgba(216,173,106,.10)] [&_.err-text]:text-xs [&_.err-text]:text-danger [&_.hint]:text-xs [&_.hint]:leading-5 [&_.hint]:text-dim">
            <label htmlFor="login-password">
              Password
            </label>

            <div className="password-input-wrap relative min-w-0">
              <input
                id="login-password"
                name="password"
                className="password-input w-full pr-12"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                required
                disabled={submitting}
              />

              <button
                className="password-visibility absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-muted transition-colors hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-pressed={showPassword}
                title={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={submitting}
              >
                {showPassword ? (
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

            <span className="hint auth-forgot mt-1 flex justify-end text-xs text-dim hover:text-gold">
              <Link to="/forgot-password">
                Forgot your password?
              </Link>
            </span>
          </div>

          <button
            className="btn btn-block mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.06em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={
              submitting ||
              !email.trim() ||
              !password
            }
            aria-disabled={
              submitting ||
              !email.trim() ||
              !password
            }
          >
            <RiLoginBoxLine
              size={16}
              aria-hidden="true"
            />

            {submitting
              ? 'Signing in…'
              : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer mt-6 text-center text-sm leading-6 text-muted [&_a]:font-semibold [&_a]:text-gold-soft [&_a:hover]:text-gold">
          New to Luviio?{' '}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}