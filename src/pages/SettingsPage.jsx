import { Link } from 'react-router-dom';
import { RiArrowRightSLine, RiLockPasswordLine, RiNotification3Line, RiShieldCheckLine, RiSettings3Line } from '@remixicon/react';
import PushNotificationsCard from '../components/account/PushNotificationsCard';

export default function SettingsPage() {
  return (
    <div className="page container settings-page">
      <div className="page-heading compact settings-hero">
        <div className="settings-title-icon" aria-hidden="true"><RiSettings3Line size={22} /></div>
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings.</h1>
          <p>Manage notifications and account security from one place.</p>
        </div>
      </div>

      <section className="settings-section" aria-labelledby="notifications-heading">
        <div className="settings-section-heading">
          <span className="settings-heading-icon" aria-hidden="true"><RiNotification3Line size={19} /></span>
          <div>
            <h2 id="notifications-heading">Notifications</h2>
            <p>Control push notifications for this device.</p>
          </div>
        </div>
        <PushNotificationsCard />
      </section>

      <section className="settings-section" aria-labelledby="security-heading">
        <div className="settings-section-heading">
          <span className="settings-heading-icon" aria-hidden="true"><RiShieldCheckLine size={19} /></span>
          <div>
            <h2 id="security-heading">Security</h2>
            <p>Manage how you protect your Luviio account.</p>
          </div>
        </div>
        <div className="settings-list">
          <Link className="settings-row" to="/account/change-password">
            <span className="settings-row-icon" aria-hidden="true"><RiLockPasswordLine size={20} /></span>
            <span className="settings-row-copy">
              <strong>Change password</strong>
              <small>Set a new password for your signed-in account.</small>
            </span>
            <RiArrowRightSLine size={21} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
