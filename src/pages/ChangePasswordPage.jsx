import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiLockPasswordLine, RiShieldCheckLine } from '@remixicon/react';
import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8 || newPassword.length > 128) {
      return setError('Password must be between 8 and 128 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(newPassword);
      toast.success('Password updated successfully.');
      navigate('/account/settings', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to update your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page auth-layout">
      <p className="eyebrow">Account security</p>
      <h1>Reset password</h1>
      <p className="auth-sub">
        Choose a new password for your signed-in account. This uses the authenticated password-reset endpoint.
      </p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <div className="password-field">
            <RiLockPasswordLine size={18} aria-hidden="true" />
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="confirm-password">Confirm new password</label>
          <div className="password-field">
            <RiShieldCheckLine size={18} aria-hidden="true" />
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>
        </div>

        <button className="btn btn-block" type="submit" disabled={submitting}>
          <RiLockPasswordLine size={16} />
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="auth-footer">
        <Link to="/account/settings"><RiArrowLeftLine size={15} /> Back to settings</Link>
      </p>
    </div>
  );
}
