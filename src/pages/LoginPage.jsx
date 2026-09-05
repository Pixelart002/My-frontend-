import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RiLoginBoxLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back.');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-layout">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="auth-sub">Access your bag, orders and saved addresses.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            <span className="hint" style={{ textAlign: 'right' }}>
              <Link to="/forgot-password">Forgot your password?</Link>
            </span>
          </div>

          <button className="btn btn-block" type="submit" disabled={submitting}>
            <RiLoginBoxLine size={16} /> {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          New to Luviio? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
