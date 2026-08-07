/* ============================================================
   LUVIIO — Push Notification Manager (v4.1 — Self-Healing & Debug)
   ============================================================
   CHANGE: Added Self-Healing mechanism for "Ghost Subscriptions" 
   and proper console error logging instead of silent 'false'.
   ============================================================ */

const PUSH = (() => {
  const SW_URL = '/sw.js';
  const VAPID_CACHE_KEY = '__lv_vapid';
  const DISMISS_KEY = '__lv_push_prompt_dismissed';
  
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
    catch (err) {
      console.error('SW Reg failed:', err);
      return null;
    }
  };
  
  // Added forceRefresh option
  const getVapidKey = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(VAPID_CACHE_KEY);
        if (cached) return cached;
      }
      
      const r = await fetch(`${CONFIG.API_BASE}/push/vapid-key`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const key = d.public_key || null;
      if (key) sessionStorage.setItem(VAPID_CACHE_KEY, key);
      return key;
    } catch (err) {
      console.error('VAPID Fetch failed:', err);
      return null;
    }
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
    } catch (err) {
      console.error('Save Sub failed:', err);
    }
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
    } catch (err) {
      console.error('Remove Sub failed:', err);
    }
  };
  
  // 🔥 THE SMART UI BANNER
  const showPrompt = () => {
    if (!isSupported() || !AUTH.isLoggedIn() || notifPermission() !== 'default') return;
    
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && (Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000)) return;
    
    const existing = document.getElementById('luviio-push-banner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.id = 'luviio-push-banner';
    banner.innerHTML = `
      <div style="position: fixed; bottom: 24px; left: 24px; background: var(--surface, #1e1e1e); border: 1px solid var(--border, #333); padding: 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 9999; width: 320px; font-family: sans-serif; display: flex; flex-direction: column; gap: 14px; animation: slideUp 0.5s ease-out;">
        <style>@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="background: var(--gold-dim, rgba(212, 175, 55, 0.15)); color: var(--gold, #d4af37); width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 22px; flex-shrink: 0;">
            <i class="ri-notification-3-line"></i>
          </div>
          <div>
            <h4 style="margin: 0; font-size: 15px; color: var(--text, #eee); font-weight: 600;">Enable Order Alerts</h4>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted, #aaa); line-height: 1.4;">Get instant updates when your order is shipped or delivered.</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 2px;">
          <button id="btn-push-later" style="background: transparent; border: 1px solid var(--border-light, #444); color: var(--text-muted, #aaa); padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: 0.2s;">Not Now</button>
          <button id="btn-push-allow" style="background: var(--gold, #d4af37); border: none; color: #000; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;">Allow Notifications</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    
    document.getElementById('btn-push-later').onclick = () => {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
      banner.style.display = 'none';
    };
    
    document.getElementById('btn-push-allow').onclick = async () => {
      banner.style.display = 'none';
      const success = await PUSH.subscribe();
      if (success && typeof showToast === 'function') {
        showToast('Notifications Enabled Successfully!', 'success');
      } else if (!success) {
        console.error("Subscription failed. Check console for details.");
      }
    };
  };
  
  return {
    isSupported,
    
    async subscribe() {
      if (!isSupported() || !AUTH.isLoggedIn()) {
        console.warn('Push not supported or user not logged in');
        return false;
      }
      
      const permission = typeof Notification !== 'undefined' ? await Notification.requestPermission() : 'denied';
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }
      
      let [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
      if (!reg || !vapidKey) {
        console.error('Missing ServiceWorker Registration or VAPID Key');
        return false;
      }
      
      try {
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await saveSubscription(subscription);
        return true;
      } catch (err) {
        console.warn('First subscribe attempt failed. Attempting self-healing...', err);
        
        try {
          // 🔥 SELF-HEALING LOGIC: Kill ghost subscription & fetch new key
          const existing = await reg.pushManager.getSubscription();
          if (existing) await existing.unsubscribe();
          
          sessionStorage.removeItem(VAPID_CACHE_KEY);
          vapidKey = await getVapidKey(true); // Force fresh key
          
          const newSubscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          await saveSubscription(newSubscription);
          return true;
        } catch (retryErr) {
          console.error('Push Subscribe Failed Completely:', retryErr);
          return false;
        }
      }
    },
    
    async unsubscribe() {
      if (!isSupported()) return;
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await removeSubscription(sub);
      await sub.unsubscribe();
      if (typeof showToast === 'function') showToast('Notifications Disabled', 'info');
    },
    
    async autoSubscribe() {
      if (!isSupported() || !AUTH.isLoggedIn() || notifPermission() !== 'granted') return;
      
      let [reg, vapidKey] = await Promise.all([registerSW(), getVapidKey()]);
      if (!reg || !vapidKey) return;
      
      try {
        const existing = await reg.pushManager.getSubscription();
        if (!existing) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          await saveSubscription(sub);
        } else {
          await saveSubscription(existing);
        }
      } catch (err) {
        console.error('AutoSubscribe failed:', err);
      }
    },
    
    async init() {
      if (!AUTH.isLoggedIn()) return;
      
      const run = async () => {
        await PUSH.autoSubscribe(); // Changed 'this' to 'PUSH' to prevent context loss
        setTimeout(showPrompt, 2500);
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
window.addEventListener('auth:login', () => PUSH.init());
window.addEventListener('auth:logout', () => PUSH.unsubscribe());

// Init on page load (no-op for guests)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PUSH.init());
} else {
  PUSH.init();
}