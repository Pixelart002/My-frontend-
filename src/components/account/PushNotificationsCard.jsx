import React from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function PushNotificationsCard() {
  const { supported, permission, subscribed, loading, error, subscribe, unsubscribe } = usePushNotifications();

  if (!supported) return null;

  return (
    <section className="card push-notifications-card" aria-labelledby="push-notifications-title">
      <div>
        <h2 id="push-notifications-title">Push notifications</h2>
        <p>Get important Luviio order and account updates on this device.</p>
        {permission === 'denied' && (
          <p role="alert">Notifications are blocked by your browser. Allow them in browser site settings, then try again.</p>
        )}
        {error && permission !== 'denied' && <p role="alert">{error}</p>}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        disabled={loading || permission === 'denied'}
        onClick={subscribed ? unsubscribe : subscribe}
      >
        {loading ? 'Please wait…' : subscribed ? 'Disable notifications' : 'Enable notifications'}
      </button>
    </section>
  );
}
