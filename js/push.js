/* ============================================================
   LUVIIO — Push Notification Manager (v4 — With Smart UI Banner)
   ============================================================
   CHANGE: Added a non-intrusive HTML banner.
   Features 24-hour cooldown if the user clicks "Not Now".
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
    catch { return null; }
  };
  
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
  
  // 🔥 THE NEW SMART UI BANNER
  const showPrompt = () => {
    // Agar push support nahi karta, user logged in nahi hai, ya permission already granted/denied hai -> Wapas jao
    if (!isSupported() || !AUTH.isLoggedIn() || notifPermission() !== 'default') return;
    
    // Check 24-hour Cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && (Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000)) return;
    
    // Remove if already exists
    const existing = document.getElementById('luviio-push-banner');
    if (existing) existing.remove();
    
    // Create Banner HTML
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
    
    // "Not Now" Button Logic
    document.getElementById('btn-push-later').onclick = () => {
      localStorage.setItem(DISMISS_KEY, Date.now().toString()); // Set 24h cooldown
      banner.style.display = 'none';
    };
    
    // "Allow" Button Logic
    document.getElementById('btn-push-allow').onclick = async () => {
      banner.style.display = 'none';
      const success = await PUSH.subscribe();
      if (success && typeof showToast === 'function') {
        showToast('Notifications Enabled Successfully!', 'success');
      }
    };
  };
  
  return {
    isSupported,
    
    async subscribe() {
      if (!isSupported() || !AUTH.isLoggedIn()) return false;
      
      // Real browser prompt trigger
      const permission = typeof Notification !== 'undefined' ? await Notification.requestPermission() : 'denied';
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
      if (typeof showToast === 'function') showToast('Notifications Disabled', 'info');
    },
    
    // Runs silently in background to keep DB synced if permission is already granted
    async autoSubscribe() {
      if (!isSupported() || !AUTH.isLoggedIn() || notifPermission() !== 'granted') return;
      
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
    
    // Initialization
    async init() {
      if (!AUTH.isLoggedIn()) return;
      
      const run = async () => {
        await this.autoSubscribe();
        
        // Show the banner if permission is still "default", after a slight 2.5 second delay so UX feels smooth
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