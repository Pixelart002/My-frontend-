/* ============================================================
   LUVIIO — Push Notification Manager  (v3 — Banner Removed)
   ============================================================
   CHANGE: showPrompt() completely removed.
   init() ab sirf autoSubscribe() call karta hai —
   koi banner ya popup show nahi hoga.
   ============================================================ */

const PUSH = (() => {
  const SW_URL = '/sw.js';
  const VAPID_CACHE_KEY = '__lv_vapid';

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  };

  const isSupported = () =>
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  const notifPermission = () =>
    typeof Notification !== 'undefined' ? Notification.permission : 'denied';

  const registerSW = async () => {
    if (!isSupported()) return null;
    try { return await navigator.serviceWorker.register(SW_URL); }
    catch { return null; }
  };

  // VAPID key cached in sessionStorage — no repeat API calls
  const getVapidKey = async () => {
    try {
      const cached = sessionStorage.getItem(VAPID_CACHE_KEY);
      if (cached) return cached;

      const r = await fetch(`${CONFIG.API_BASE}/push/vapid-key`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const key = d.public_key || null;
      if (key) sessionStorage.setItem(VAPID_CACHE_KEY, key);
      return key;
    } catch { return null; }
  };

  const saveSubscription = async (subscription) => {
    const token = AUTH.getToken();
    if (!token) return;
    try {
      await fetch(`${CONFIG.API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  };

  const removeSubscription = async (subscription) => {
    const token = AUTH.getToken();
    if (!token) return;
    try {
      await fetch(`${CONFIG.API_BASE}/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  };

  return {
    isSupported,

    async subscribe() {
      if (!isSupported() || !AUTH.isLoggedIn()) return false;

      const permission = typeof Notification !== 'undefined' ?
        await Notification.requestPermission() :
        'denied';
      if (permission !== 'granted') return false;

      const [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
      if (!reg || !vapidKey) return false;

      try {
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await saveSubscription(subscription);
        return true;
      } catch { return false; }
    },

    async unsubscribe() {
      if (!isSupported()) return;
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await removeSubscription(sub);
      await sub.unsubscribe();
    },

    // Only runs if permission already granted — no unnecessary API calls
    async autoSubscribe() {
      if (!isSupported() || !AUTH.isLoggedIn()) return;
      if (notifPermission() !== 'granted') return;

      const [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
      if (!reg || !vapidKey) return;

      const existing = await reg.pushManager.getSubscription();
      try {
        if (!existing) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          await saveSubscription(sub);
        } else {
          await saveSubscription(existing);
        }
      } catch {}
    },

    // showPrompt() — REMOVED. Koi banner nahi dikhega.

    // init() — sirf autoSubscribe, koi prompt nahi
    async init() {
      if (!AUTH.isLoggedIn()) return;

      const run = async () => {
        await this.autoSubscribe();
        // showPrompt() call removed — popup nahi chahiye
      };

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(run, { timeout: 5000 });
      } else {
        setTimeout(run, 1000);
      }
    },
  };
})();

// Auth events
window.addEventListener('auth:login',  () => PUSH.init());
window.addEventListener('auth:logout', () => PUSH.unsubscribe());

// Init on page load (no-op for guests)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PUSH.init());
} else {
  PUSH.init();
}
