import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiUserAddLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName) return setError('Please enter your name.');
    if (!email) return setError('Please enter your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!/[A-Z]/.test(password)) return setError('Password must include an uppercase letter.');
    if (!/[a-z]/.test(password)) return setError('Password must include a lowercase letter.');
    if (!/\d/.test(password)) return setError('Password must include a number.');

    setSubmitting(true);
    try {
      await register(email.trim(), password, fullName.trim());
      toast.success('Your account has been created. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pwHint = password ? (
    <span
      className="pw-strength"
      style={{
        display: 'block',
        fontSize: 12,
        marginTop: 6,
        color: password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)
          ? 'var(--danger, #c9655a)'
          : 'var(--success, #6fae7d)',
      }}
    >
      {password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)
        ? 'Needs 8+ chars, upper, lower and a number.'
        : 'Looking good.'}
    </span>
  ) : null;

  return (
    <div className="page auth-layout">
      <div className="auth-card">
        <p className="eyebrow">New here</p>
        <h1>Create account</h1>
        <p className="auth-sub">Save your details and track orders across visits.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

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

          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, upper, lower, number"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 0,
                  background: 'transparent',
                  color: 'var(--dim)',
                  padding: 6,
                  display: 'inline-flex',
                }}
              >
                {showPw ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
            {pwHint}
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 0,
                  background: 'transparent',
                  color: 'var(--dim)',
                  padding: 6,
                  display: 'inline-flex',
                }}
              >
                {showConfirm ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          <button className="btn btn-block" type="submit" disabled={submitting}>
            <RiUserAddLine size={16} /> {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
