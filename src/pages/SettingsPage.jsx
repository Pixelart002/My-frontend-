import { Link } from 'react-router-dom';
import { RiArrowRightSLine, RiLockPasswordLine, RiNotification3Line, RiShieldCheckLine, RiSettings3Line } from '@remixicon/react';
import PushNotificationsCard from '../components/account/PushNotificationsCard';

export default function SettingsPage() {
  return (
    <div className="page container settings-page">
      <div className="page-heading compact">
        <div className="settings-title-icon"><RiSettings3Line size={22} /></div>
        <p className="eyebrow">Account</p>
        <h1>Settings.</h1>
        <p>Manage notifications and account security from one place.</p>
      </div>

      <section className="settings-section" aria-labelledby="notifications-heading">
        <div className="settings-section-heading">
          <span className="settings-heading-icon"><RiNotification3Line size={19} /></span>
          <div><h2 id="notifications-heading">Notifications</h2><p>Control push notifications for this device.</p></div>
        </div>
        <PushNotificationsCard />
      </section>

      <section className="settings-section" aria-labelledby="security-heading">
        <div className="settings-section-heading">
          <span className="settings-heading-icon"><RiShieldCheckLine size={19} /></span>
          <div><h2 id="security-heading">Security</h2><p>Keep your account credentials secure.</p></div>
        </div>
        <div className="settings-list">
          <Link className="settings-row" to="/account/change-password">
            <span className="settings-row-icon"><RiLockPasswordLine size={19} /></span>
            <span className="settings-row-copy"><strong>Reset password</strong><small>Change your password while signed in.</small></span>
            <RiArrowRightSLine size={20} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
