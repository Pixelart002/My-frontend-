import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiCheckLine, RiEyeLine, RiEyeOffLine, RiLockPasswordLine } from '@remixicon/react';
import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordLengthValid = newPassword.length >= 8 && newPassword.length <= 128;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = passwordLengthValid && passwordsMatch && !submitting;

  const passwordStatus = useMemo(() => {
    if (!newPassword) return 'Enter a new password.';
    if (newPassword.length < 8) return 'Use at least 8 characters.';
    return 'Password length looks good.';
  }, [newPassword]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordLengthValid) return setError('Password must be between 8 and 128 characters.');
    if (!passwordsMatch) return setError('Passwords do not match.');

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
    <div className="page container change-password-page">
      <Link className="back-link" to="/account/settings">
        <RiArrowLeftLine size={16} aria-hidden="true" /> Back to settings
      </Link>

      <section className="change-password-card card" aria-labelledby="change-password-title">
        <div className="change-password-header">
          <span className="change-password-icon" aria-hidden="true"><RiLockPasswordLine size={22} /></span>
          <div>
            <p className="eyebrow">Account security</p>
            <h1 id="change-password-title">Change password</h1>
            <p>Choose a new password for your signed-in Luviio account.</p>
          </div>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <form className="change-password-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <div className="password-input-wrap">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                aria-describedby="password-status password-rules"
                required
              />
              <button className="password-visibility" type="button" onClick={() => setShowNew((value) => !value)} aria-label={showNew ? 'Hide password' : 'Show password'}>
                {showNew ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          <div id="password-rules" className="password-rules" aria-label="Password requirements">
            <div className={`password-rule ${passwordLengthValid ? 'is-valid' : ''}`}>
              <RiCheckLine size={15} aria-hidden="true" />
              <span>8–128 characters</span>
            </div>
            <div className={`password-rule ${passwordsMatch ? 'is-valid' : ''}`}>
              <RiCheckLine size={15} aria-hidden="true" />
              <span>Passwords match</span>
            </div>
            <small id="password-status" className="hint">{passwordStatus}</small>
          </div>

          <div className="field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <div className="password-input-wrap">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                required
              />
              <button className="password-visibility" type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          <div className="btn-row change-password-actions">
            <button className="btn" type="submit" disabled={!canSubmit}>
              <RiLockPasswordLine size={17} aria-hidden="true" />
              {submitting ? 'Updating…' : 'Update password'}
            </button>
            <Link className="btn btn-ghost" to="/account/settings">Cancel</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
