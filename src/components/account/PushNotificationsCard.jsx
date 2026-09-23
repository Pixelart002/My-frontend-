import React from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { 
  RiNotification3Fill, 
  RiNotificationOffLine, 
  RiErrorWarningFill, 
  RiLoader4Line 
} from '@remixicon/react';

export default function PushNotificationsCard() {
  const { supported, permission, subscribed, loading, error, subscribe, unsubscribe } = usePushNotifications();

  if (!supported) return null;

  return (
    <section 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:shadow-md" 
      aria-labelledby="push-notifications-title"
    >
      <div className="flex items-start gap-4 flex-1">
        {/* Remix Icon Container */}
        <div className={`p-3 rounded-full flex-shrink-0 mt-1 ${subscribed ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
          {subscribed ? (
            <RiNotification3Fill size={24} />
          ) : (
            <RiNotificationOffLine size={24} />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <h2 id="push-notifications-title" className="text-lg font-semibold text-gray-900 m-0">
            Push Notifications
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            Get important Luviio order and account updates directly on this device.
          </p>

          {/* Error / Warning States */}
          {permission === 'denied' && (
            <div className="flex items-center gap-2 mt-3 text-sm text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100" role="alert">
              <RiErrorWarningFill size={18} className="flex-shrink-0" />
              <span>Notifications are blocked. Allow them in your browser settings and try again.</span>
            </div>
          )}
          {error && permission !== 'denied' && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100" role="alert">
              <RiErrorWarningFill size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={loading || permission === 'denied'}
        onClick={subscribed ? unsubscribe : subscribe}
        className={`
          flex items-center justify-center min-w-[160px] px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:ring-2 focus:outline-none focus:ring-offset-2
          ${loading || permission === 'denied' 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : subscribed
              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md focus:ring-blue-500'
          }
        `}
      >
        {loading ? (
          <>
            <RiLoader4Line className="animate-spin mr-2" size={18} />
            Please wait...
          </>
        ) : subscribed ? (
          'Disable notifications'
        ) : (
          'Enable notifications'
        )}
      </button>
    </section>
  );
}
