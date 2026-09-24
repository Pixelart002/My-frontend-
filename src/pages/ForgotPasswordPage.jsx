import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiMailLine } from '@remixicon/react';
import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const onSubmit = async (event) => {
    event.preventDefault();
    
    if (submitting) return;
    
    const normalizedEmail = email.trim().toLowerCase();
    
    setError('');
    
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }
    
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await authService.forgotPassword(normalizedEmail);
      
      setSent(true);
      toast.success(
        'If that email exists, a recovery link is on its way.'
      );
    } catch (err) {
      setError(
        err?.message || 'Unable to send the recovery email. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    
    if (error) {
      setError('');
    }
    
    if (sent) {
      setSent(false);
    }
  };
  
  return (
    <div className="page auth-layout">
      <p className="eyebrow">Account recovery</p>

      <h1>Forgot password</h1>

      <p className="auth-sub">
        Enter your email and we’ll send you a secure link to reset your
        password.
      </p>

      {sent ? (
        <div
          className="form-success"
          role="status"
          aria-live="polite"
        >
          We’ve sent a recovery link to{' '}
          <strong>{email.trim()}</strong>. Check your inbox and follow the
          instructions to choose a new password.
        </div>
      ) : (
        <>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="forgot-password-email">
                Email
              </label>

              <input
                id="forgot-password-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                maxLength={254}
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'forgot-password-error' : undefined}
                required
              />

              {error && (
                <span
                  id="forgot-password-error"
                  className="sr-only"
                >
                  {error}
                </span>
              )}
            </div>

            <button
              className="btn btn-block"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              <RiMailLine size={16} aria-hidden="true" />
              {submitting ? 'Sending…' : 'Send recovery link'}
            </button>
          </form>
        </>
      )}

      <p className="auth-footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}