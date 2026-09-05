import { useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {};
      if (fullName.trim() !== user?.full_name) payload.full_name = fullName.trim() || undefined;
      if (phone.trim() !== user?.phone) payload.phone = phone.trim() || undefined;
      if (Object.keys(payload).length) {
        await userService.updateMe(payload);
        await refreshProfile();
      }
      toast.success('Profile updated.');
    } catch (err) {
      setError(err.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page container">
      <div className="page-heading compact">
        <p className="eyebrow">Your account</p>
        <h1>Profile.</h1>
      </div>

      <div className="account-links">
        <Link to="/orders">Order history</Link>
        <Link to="/account/addresses">Addresses</Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="profile-form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="full-name">Full name</label>
          <input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" value={user?.email || ''} disabled readOnly />
          <span className="hint">Email cannot be changed here.</span>
        </div>
        <div className="field">
          <label htmlFor="profile-phone">Phone</label>
          <input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
        </div>
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
