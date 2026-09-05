import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Please enter your email address.');
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
      toast.success('If that email exists, a recovery link is on its way.');
    } catch (err) {
      setError(err.message || 'Unable to send the recovery email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-layout">
      <p className="eyebrow">Account recovery</p>
      <h1>Forgot password</h1>
      <p className="auth-sub">
        Enter your email and we’ll send you a secure link to reset your password.
      </p>

      {sent ? (
        <div className="form-success">
          We’ve sent a recovery link to <strong>{email}</strong>. Check your inbox and follow the
          instructions to choose a new password.
        </div>
      ) : (
        <>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button className="btn btn-block" type="submit" disabled={submitting}>
              <Mail size={16} /> {submitting ? 'Sending…' : 'Send recovery link'}
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
