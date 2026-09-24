import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { pushService } from '../services/push';

const getErrorMessage = (
  error,
  fallback,
) => {
  if (
    error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallback;
};

export function usePushNotifications({
  enabled = true,
} = {}) {
  const [supported] = useState(() =>
    pushService.isSupported(),
  );

  const [permission, setPermission] =
    useState(() =>
      pushService.getPermission(),
    );

  const [subscribed, setSubscribed] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const mountedRef = useRef(true);
  const operationRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
    };
  }, []);

  const setSafe = useCallback(
    (callback) => {
      if (mountedRef.current) {
        callback();
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!supported || !enabled) {
      return false;
    }

    const operation =
      ++operationRef.current;

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.serviceWorker
      ) {
        throw new Error(
          'Service workers are not available.',
        );
      }

      const registration =
        await navigator.serviceWorker.ready;

      if (
        !mountedRef.current ||
        operation !== operationRef.current
      ) {
        return false;
      }

      const subscription =
        await registration.pushManager
          .getSubscription();

      if (
        !mountedRef.current ||
        operation !== operationRef.current
      ) {
        return false;
      }

      const nextPermission =
        pushService.getPermission();

      setSubscribed(
        Boolean(subscription),
      );

      setPermission(
        nextPermission,
      );

      setError('');

      return Boolean(subscription);
    } catch (err) {
      if (
        !mountedRef.current ||
        operation !== operationRef.current
      ) {
        return false;
      }

      setError(
        getErrorMessage(
          err,
          'Unable to check notification status.',
        ),
      );

      return false;
    }
  }, [enabled, supported]);

  useEffect(() => {
    if (!enabled || !supported) {
      setSubscribed(false);
      return undefined;
    }

    refresh();

    return undefined;
  }, [
    enabled,
    supported,
    refresh,
  ]);

  const subscribe = useCallback(
    async () => {
      if (!supported || !enabled) {
        return false;
      }

      const operation =
        ++operationRef.current;

      setLoading(true);
      setError('');

      try {
        await pushService.subscribe();

        if (
          !mountedRef.current ||
          operation !== operationRef.current
        ) {
          return false;
        }

        /*
         * Don't blindly assume subscribe() succeeded.
         * Verify the browser's actual PushSubscription.
         */
        let active = false;

        if (
          typeof navigator !== 'undefined' &&
          navigator.serviceWorker
        ) {
          const registration =
            await navigator.serviceWorker.ready;

          const subscription =
            await registration.pushManager
              .getSubscription();

          active = Boolean(
            subscription,
          );
        }

        if (
          !mountedRef.current ||
          operation !== operationRef.current
        ) {
          return false;
        }

        setSubscribed(active);
        setPermission(
          pushService.getPermission(),
        );

        if (!active) {
          throw new Error(
            'Notifications could not be enabled.',
          );
        }

        return true;
      } catch (err) {
        if (
          !mountedRef.current ||
          operation !== operationRef.current
        ) {
          return false;
        }

        setSubscribed(false);
        setPermission(
          pushService.getPermission(),
        );
        setError(
          getErrorMessage(
            err,
            'Unable to enable notifications.',
          ),
        );

        return false;
      } finally {
        if (
          mountedRef.current &&
          operation === operationRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [enabled, supported],
  );

  const unsubscribe = useCallback(
    async () => {
      if (!supported || !enabled) {
        return false;
      }

      const operation =
        ++operationRef.current;

      setLoading(true);
      setError('');

      try {
        await pushService.unsubscribe();

        if (
          !mountedRef.current ||
          operation !== operationRef.current
        ) {
          return false;
        }

        setSubscribed(false);
        setPermission(
          pushService.getPermission(),
        );

        return true;
      } catch (err) {
        if (
          !mountedRef.current ||
          operation !== operationRef.current
        ) {
          return false;
        }

        /*
         * Re-check actual browser state because an
         * unsubscribe request may partially succeed.
         */
        try {
          const registration =
            await navigator.serviceWorker.ready;

          const subscription =
            await registration.pushManager
              .getSubscription();

          setSubscribed(
            Boolean(subscription),
          );
        } catch {
          /*
           * Keep the previous state if verification
           * itself is unavailable.
           */
        }

        setPermission(
          pushService.getPermission(),
        );

        setError(
          getErrorMessage(
            err,
            'Unable to disable notifications.',
          ),
        );

        return false;
      } finally {
        if (
          mountedRef.current &&
          operation === operationRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [enabled, supported],
  );

  return {
    supported,
    permission,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    refresh,
  };
}