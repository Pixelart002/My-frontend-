import React from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import {
  RiNotification3Fill,
  RiNotification3Line,
  RiNotificationOffLine,
  RiErrorWarningFill,
  RiLoader4Line,
} from '@remixicon/react';

export default function PushNotificationsCard() {
  const {
    supported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  
  if (!supported) return null;
  
  return (
    <section
      aria-labelledby="push-notifications-title"
      className="
        w-full
        rounded-2xl
        border border-gray-200/80
        bg-white
        p-5 sm:p-6
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]
        transition-shadow duration-200
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]
      "
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        {/* Content */}
        <div className="flex min-w-0 items-start gap-4">

          {/* Icon */}
          <div
            className={`
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-xl
              ${
                subscribed
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-gray-50 text-gray-400'
              }
            `}
            aria-hidden="true"
          >
            {subscribed ? (
              <RiNotification3Fill size={21} />
            ) : (
              <RiNotificationOffLine size={21} />
            )}
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2
                id="push-notifications-title"
                className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-gray-900"
              >
                Push Notifications
              </h2>

              {subscribed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-green-500"
                    aria-hidden="true"
                  />
                  Enabled
                </span>
              )}
            </div>

            <p className="m-0 mt-1 text-sm leading-5 text-gray-500">
              Get important updates from LUVIIO.
            </p>

            {/* Permission warning */}
            {permission === 'denied' && (
              <div
                role="alert"
                className="
                  mt-3 flex items-start gap-2.5
                  rounded-lg
                  border border-amber-100
                  bg-amber-50
                  px-3 py-2.5
                  text-xs leading-5 text-amber-700
                "
              >
                <RiErrorWarningFill
                  size={17}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />

                <span>
                  Notifications are blocked. Allow them in your browser
                  settings and try again.
                </span>
              </div>
            )}

            {/* Generic error */}
            {error && permission !== 'denied' && (
              <div
                role="alert"
                className="
                  mt-3 flex items-start gap-2.5
                  rounded-lg
                  border border-red-100
                  bg-red-50
                  px-3 py-2.5
                  text-xs leading-5 text-red-700
                "
              >
                <RiErrorWarningFill
                  size={17}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />

                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          type="button"
          disabled={loading || permission === 'denied'}
          onClick={subscribed ? unsubscribe : subscribe}
          className={`
            inline-flex
            min-h-10
            w-full sm:w-auto
            shrink-0
            items-center
            justify-center
            rounded-lg
            px-4
            text-sm
            font-medium
            transition-all
            duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            disabled:cursor-not-allowed
            disabled:opacity-50

            ${
              subscribed
                ? `
                  border border-gray-200
                  bg-white
                  text-gray-700
                  hover:border-gray-300
                  hover:bg-gray-50
                  focus:ring-gray-200
                `
                : `
                  bg-gray-900
                  text-white
                  shadow-sm
                  hover:bg-gray-800
                  hover:shadow-md
                  focus:ring-gray-900
                `
            }
          `}
        >
          {loading ? (
            <>
              <RiLoader4Line
                className="mr-2 animate-spin"
                size={17}
                aria-hidden="true"
              />
              Please wait...
            </>
          ) : subscribed ? (
            <>
              <RiNotificationOffLine
                className="mr-2"
                size={17}
                aria-hidden="true"
              />
              Disable notifications
            </>
          ) : (
            <>
              <RiNotification3Line
                className="mr-2"
                size={17}
                aria-hidden="true"
              />
              Enable notifications
            </>
          )}
        </button>
      </div>
    </section>
  );
}