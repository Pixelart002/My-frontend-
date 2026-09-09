import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RiArrowRightSLine, RiEditLine, RiCloseLine, RiSaveLine } from '@remixicon/react';
import { userService } from '../services/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  const startEditing = () => {
    setError('');
    setFullName(user?.full_name || user?.name || '');
    setPhone(user?.phone || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setError('');
    setFullName(user?.full_name || user?.name || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {};
      if (fullName.trim() !== (user?.full_name || '')) payload.full_name = fullName.trim() || undefined;
      if (phone.trim() !== (user?.phone || '')) payload.phone = phone.trim() || undefined;
      if (Object.keys(payload).length) {
        await userService.updateMe(payload);
        await refreshProfile();
      }
      setEditing(false);
      toast.success('Profile updated.');
    } catch (err) {
      setError(err.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.full_name || user?.name || 'Not set';
  const displayPhone = user?.phone || 'Not set';
  const displayEmail = user?.email || 'Not available';

  return (
    <div className="page container profile-page">
      <div className="page-heading compact">
        <p className="eyebrow">Your account</p>
        <h1>Profile.</h1>
      </div>

      <div className="account-links">
        <Link to="/orders">Order history</Link>
        <Link to="/account/addresses">Addresses</Link>
        <Link to="/account/settings">Settings</Link>
      </div>

      <section className="profile-card card" aria-labelledby="profile-details-heading">
        <div className="profile-card-header">
          <div>
            <p className="eyebrow">Account details</p>
            <h2 id="profile-details-heading">Your information</h2>
          </div>
          {!editing && (
            <button className="icon-btn" type="button" onClick={startEditing} aria-label="Edit profile" title="Edit profile">
              <RiEditLine size={20} aria-hidden="true" />
            </button>
          )}
        </div>

        {error && <div className="form-error">{error}</div>}

        {!editing ? (
          <div className="profile-details" aria-label="Profile details">
            <div className="profile-detail">
              <span>Full name</span>
              <strong>{displayName}</strong>
            </div>
            <div className="profile-detail">
              <span>Email</span>
              <strong>{displayEmail}</strong>
              <small>Email cannot be changed here.</small>
            </div>
            <div className="profile-detail">
              <span>Phone</span>
              <strong>{displayPhone}</strong>
            </div>
          </div>
        ) : (
          <form className="profile-form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="full-name">Full name</label>
              <input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" value={displayEmail} disabled readOnly />
              <span className="hint">Email cannot be changed here.</span>
            </div>
            <div className="field">
              <label htmlFor="profile-phone">Phone</label>
              <input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div className="btn-row profile-actions">
              <button className="btn" type="submit" disabled={saving}>
                <RiSaveLine size={17} aria-hidden="true" /> {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={cancelEditing} disabled={saving}>
                <RiCloseLine size={17} aria-hidden="true" /> Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="profile-nav-list">
        <Link to="/orders"><span>Order history</span><RiArrowRightSLine size={20} aria-hidden="true" /></Link>
        <Link to="/account/addresses"><span>Addresses</span><RiArrowRightSLine size={20} aria-hidden="true" /></Link>
        <Link to="/account/settings"><span>Settings</span><RiArrowRightSLine size={20} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
