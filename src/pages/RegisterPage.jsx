import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
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

  return (
    <div className="page auth-layout">
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
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, upper, lower, number"
          />
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
          />
        </div>

        <button className="btn btn-block" type="submit" disabled={submitting}>
          <UserPlus size={16} /> {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
