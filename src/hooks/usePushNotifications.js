import { useCallback, useEffect, useState } from 'react';
import { pushService } from '../services/push';

export function usePushNotifications({ enabled = true } = {}) {
  const [supported] = useState(() => pushService.isSupported());
  const [permission, setPermission] = useState(() => pushService.getPermission());
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!supported || !enabled) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(subscription));
      setPermission(pushService.getPermission());
    } catch (err) {
      setError(err?.message || 'Unable to check notification status.');
    }
  }, [enabled, supported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await pushService.subscribe();
      setSubscribed(true);
      setPermission(pushService.getPermission());
      return true;
    } catch (err) {
      setError(err?.message || 'Unable to enable notifications.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await pushService.unsubscribe();
      setSubscribed(false);
      return true;
    } catch (err) {
      setError(err?.message || 'Unable to disable notifications.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

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
