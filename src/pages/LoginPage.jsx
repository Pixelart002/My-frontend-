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
    <div className="page auth-layout">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>

        <h1>Sign in</h1>

        <p className="auth-sub">
          Access your bag, orders and saved addresses.
        </p>

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
          onSubmit={onSubmit}
          noValidate
          aria-busy={submitting}
        >
          <div className="field">
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

          <div className="field">
            <label htmlFor="login-password">
              Password
            </label>

            <div className="password-input-wrap">
              <input
                id="login-password"
                name="password"
                className="password-input"
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
                className="password-visibility"
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

            <span className="hint auth-forgot">
              <Link to="/forgot-password">
                Forgot your password?
              </Link>
            </span>
          </div>

          <button
            className="btn btn-block"
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

        <p className="auth-footer">
          New to Luviio?{' '}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}