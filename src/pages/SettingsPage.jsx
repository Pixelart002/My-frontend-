import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/settings.css';
import {
  RiArrowRightSLine,
  RiLockPasswordLine,
  RiNotification3Line,
  RiSettings3Line,
  RiShieldCheckLine,
  RiDeleteBin6Line,
} from '@remixicon/react';
import PushNotificationsCard from '../components/account/PushNotificationsCard';
import { userService } from '../services/users';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { clearSession } = useAuth();
  const { toast } = useToast();
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (deleting || deleteConfirmation !== 'DELETE MY ACCOUNT' || !deletePassword) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await userService.deleteMe({ password: deletePassword, confirmation: deleteConfirmation });
      toast.success('Your account has been deleted.');
      clearSession();
      window.location.assign('/');
    } catch (error) {
      setDeleteError(error?.message || 'Account deletion failed. Please contact support before retrying.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page container settings-page">
      <header className="page-heading compact settings-hero">
        <div
          className="settings-title-icon"
          aria-hidden="true"
        >
          <RiSettings3Line
            size={22}
          />
        </div>

        <div>
          <p className="eyebrow">
            Account
          </p>

          <h1>Settings.</h1>

          <p>
            Manage notifications and
            account security from one
            place.
          </p>
        </div>
      </header>

      <section
        className="settings-section"
        aria-labelledby="notifications-heading"
      >
        <div className="settings-section-heading">
          <span
            className="settings-heading-icon"
            aria-hidden="true"
          >
            <RiNotification3Line
              size={19}
            />
          </span>

          <div>
            <h2 id="notifications-heading">
              Notifications
            </h2>

            <p>
              Control push notifications
              for this device.
            </p>
          </div>
        </div>

        <PushNotificationsCard />
      </section>

      <section
        className="settings-section"
        aria-labelledby="security-heading"
      >
        <div className="settings-section-heading">
          <span
            className="settings-heading-icon"
            aria-hidden="true"
          >
            <RiShieldCheckLine
              size={19}
            />
          </span>

          <div>
            <h2 id="security-heading">
              Security
            </h2>

            <p>
              Manage how you protect your
              Luviio account.
            </p>
          </div>
        </div>

        <nav
          className="settings-list"
          aria-label="Security settings"
        >
          <Link
            className="settings-row"
            to="/account/change-password"
          >
            <span
              className="settings-row-icon"
              aria-hidden="true"
            >
              <RiLockPasswordLine
                size={20}
              />
            </span>

            <span className="settings-row-copy">
              <strong>
                Change password
              </strong>

              <small>
                Set a new password for your
                signed-in account.
              </small>
            </span>

            <RiArrowRightSLine
              size={21}
              aria-hidden="true"
            />
          </Link>
        </nav>
      </section>
      <section className="settings-section" aria-labelledby="account-deletion-heading">
        <div className="settings-section-heading">
          <span className="settings-heading-icon text-danger" aria-hidden="true"><RiDeleteBin6Line size={19} /></span>
          <div>
            <h2 id="account-deletion-heading">Delete account</h2>
            <p>Delete your sign-in identity and anonymize your profile. Historical order records may be retained where required.</p>
          </div>
        </div>
        {!showDeleteForm ? (
          <div className="rounded-2xl border border-danger/25 bg-danger-dim/30 p-4 sm:p-5">
            <p className="text-sm leading-6 text-muted">This action cannot be undone. Your profile identifiers are anonymized; order records may remain for accounting, support, and legal retention.</p>
            <button type="button" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:opacity-50" onClick={() => setShowDeleteForm(true)}>Delete my account</button>
          </div>
        ) : (
          <form className="space-y-4 rounded-2xl border border-danger/30 bg-surface p-4 sm:p-5" onSubmit={deleteAccount} aria-busy={deleting}>
            <div>
              <label htmlFor="delete-account-password" className="mb-2 block text-sm font-semibold text-text">Confirm your password</label>
              <input id="delete-account-password" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required maxLength={128} disabled={deleting} className="min-h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-text outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:opacity-60" />
            </div>
            <div>
              <label htmlFor="delete-account-confirmation" className="mb-2 block text-sm font-semibold text-text">Type <span className="font-mono text-danger">DELETE MY ACCOUNT</span> to confirm</label>
              <input id="delete-account-confirmation" type="text" autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} required maxLength={40} disabled={deleting} className="min-h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-text outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 disabled:opacity-60" />
            </div>
            {deleteError && <p className="rounded-xl border border-danger/30 bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger" role="alert">{deleteError}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted hover:text-text disabled:opacity-50" onClick={() => { setShowDeleteForm(false); setDeletePassword(''); setDeleteConfirmation(''); setDeleteError(''); }} disabled={deleting}>Cancel</button>
              <button type="submit" className="min-h-11 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={deleting || !deletePassword || deleteConfirmation !== 'DELETE MY ACCOUNT'}>{deleting ? 'Deleting account…' : 'Permanently delete account'}</button>
            </div>
          </form>
        )}
      </section>

    </div>
  );
}