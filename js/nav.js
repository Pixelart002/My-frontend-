/* ============================================================
   LUVIIO — Nav  (v10 — Fixed)
   ============================================================
   FIXES:
   1. BUG: `\${bannerHTML}` — backslash escape kar raha tha
      template literal, banner inject hi nahi ho raha tha.
      FIX: Backtick string ke andar bannerHTML ko
      `+ bannerHTML +` se append kiya (string concat).

   2. BUG: onclick="enableNotifications()" — yeh function
      exist hi nahi karta tha → ReferenceError on click.
      FIX: enableNotifications() function add kiya jo
      PUSH.subscribe() call karta hai properly.

   3. BUG: autoSubscribe() re-registers on EVERY page load.
      FIX: sessionStorage flag se guard lagaya.
   ============================================================ */

// ── Global function (banner ke onclick ke liye) ──────────────
async function enableNotifications() {
  const btn = document.getElementById('btn-allow-push');
  if (btn) { btn.textContent = '…'; btn.disabled = true; }

  const ok = await PUSH.subscribe();

  const banner = document.getElementById('notification-banner');
  if (ok) {
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('push_dismissed', '1');
    // showToast available hai utils.js se
    if (typeof showToast === 'function') {
      showToast('Notifications enabled! ✓', 'success');
    }
  } else {
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('push_dismissed', '1');
  }
}

const NAV = {
  inject() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const path = window.location.pathname;
    let bannerHTML = '';

    if (path === '/' || path.includes('index.html')) {
      // 🟦 BLUE BANNER — HOME PAGE ONLY
      bannerHTML = `
        <div id="notification-banner" style="display:none; position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#0a1122; border-radius:12px; padding:16px 20px; align-items:center; gap:16px; box-shadow:0 10px 30px rgba(0,0,0,0.7); z-index:99999; width:90%; max-width:400px; border:1px solid #1e293b;">
          <div style="font-size:24px;">🔔</div>
          <div style="flex:1;">
            <h4 style="margin:0; color:#fff; font-size:15px; font-family:'Jost',sans-serif; font-weight:600;">Enable notifications</h4>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:13px; font-family:'Jost',sans-serif;">Get order updates instantly</p>
          </div>
          <button id="btn-allow-push" onclick="enableNotifications()" style="background:#00d2ff; color:#000; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; font-family:'Jost',sans-serif;">Allow</button>
          <button id="btn-close-push" onclick="document.getElementById('notification-banner').style.display='none'; sessionStorage.setItem('push_dismissed','1');" style="background:none; border:none; color:#64748b; font-size:20px; cursor:pointer; padding:0;">✕</button>
        </div>`;

    } else if (path.includes('cart.html') || path.endsWith('/cart')) {
      // 👑 GOLD BANNER — CART PAGE ONLY
      bannerHTML = `
        <div id="notification-banner" style="display:none; position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#0a0a0a; border-radius:8px; padding:16px 20px; align-items:center; gap:16px; box-shadow:0 20px 40px rgba(0,0,0,0.8); z-index:99999; width:90%; max-width:420px; border:1px solid #222222;">
          <div style="color:#c9a55e; display:flex; align-items:center; justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div style="flex:1;">
            <h4 style="margin:0; color:#f4f0ea; font-size:13px; font-family:'Jost',sans-serif; font-weight:600; text-transform:uppercase; letter-spacing:1.5px;">Enable Notifications</h4>
            <p style="margin:4px 0 0; color:#8c8881; font-size:12px; font-family:'Jost',sans-serif;">Get exclusive updates and order tracking.</p>
          </div>
          <button id="btn-allow-push" onclick="enableNotifications()" style="background:#c9a55e; color:#000; border:none; padding:10px 18px; border-radius:4px; font-weight:600; cursor:pointer; font-family:'Jost',sans-serif; text-transform:uppercase; letter-spacing:1px; font-size:11px;">ALLOW</button>
          <button id="btn-close-push" onclick="document.getElementById('notification-banner').style.display='none'; sessionStorage.setItem('push_dismissed','1');" style="background:none; border:none; color:#8c8881; font-size:20px; cursor:pointer; padding:0; display:flex; align-items:center;">✕</button>
        </div>`;
    }

    // ── FIX: String concatenation instead of \${bannerHTML} ──
    // Pehle \${bannerHTML} tha jo backslash ki wajah se
    // template literal evaluate nahi ho raha tha.
    nav.innerHTML =
      `<div class="nav-inner">
        <a href="/index.html" class="nav-logo">LUVIIO</a>
        <div class="nav-links">
          <a href="/shop.html">Shop</a>
          <a href="/shop.html?category=new">New Arrivals</a>
          <a href="/orders.html" data-authed style="display:none">My Orders</a>
        </div>
        <div class="nav-actions">
          <a href="/cart.html" class="nav-icon-btn" aria-label="Cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span data-cart-count class="cart-badge" style="display:none">0</span>
          </a>
          <a href="/login.html" class="btn-ghost" data-guest>Login</a>
          <div class="user-menu" data-authed style="display:none">
            <button class="nav-icon-btn user-menu-toggle" aria-label="Account">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span data-user-name class="user-name">Account</span>
            </button>
            <div class="user-dropdown">
              <a href="/profile.html">Profile</a>
              <a href="/orders.html">Orders</a>
              <button id="logout-btn" class="logout-btn">Sign out</button>
            </div>
          </div>
        </div>
        <button class="mobile-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="mobile-menu">
        <a href="/shop.html">Shop</a>
        <a href="/shop.html?category=new">New Arrivals</a>
        <a href="/orders.html" data-authed style="display:none">My Orders</a>
        <a href="/profile.html" data-authed style="display:none">Profile</a>
        <a href="/login.html" data-guest>Login</a>
        <button id="logout-btn-mobile" class="logout-btn" data-authed style="display:none">Sign out</button>
      </div>` +
      bannerHTML; // ← FIX: direct concatenation, no backslash

    this._bindEvents();
    CART.init();
    AUTH.updateNavUI();
  },

  _bindEvents() {
    // ── Mobile menu toggle ────────────────────────────────
    const toggle    = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    toggle?.addEventListener('click', () => {
      mobileMenu?.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    document.querySelectorAll('.mobile-menu a').forEach(a => {
      a.addEventListener('click', () => mobileMenu?.classList.remove('open'));
    });

    // ── User dropdown ─────────────────────────────────────
    const uToggle = document.querySelector('.user-menu-toggle');
    const uDrop   = document.querySelector('.user-dropdown');
    uToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      uDrop?.classList.toggle('open');
    });
    document.addEventListener('click', () => uDrop?.classList.remove('open'));

    // ── Logout ────────────────────────────────────────────
    async function doLogout() {
      try { await API.logout(); } catch {}
      AUTH.clearTokens();
      CART.clear();
      window.location.href = '/index.html';
    }
    document.getElementById('logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', doLogout);

    // ── Auth events → nav update ──────────────────────────
    window.addEventListener('auth:login',  () => AUTH.updateNavUI());
    window.addEventListener('auth:logout', () => AUTH.updateNavUI());

    // ── Show notification banner ──────────────────────────
    // Only if: browser supports it, permission is default,
    // and user hasn't dismissed it this session
    const banner = document.getElementById('notification-banner');
    if (banner) {
      const alreadyDismissed = sessionStorage.getItem('push_dismissed');
      if (
        !alreadyDismissed &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        Notification.permission === 'default'
      ) {
        // Small delay so page finishes loading first
        setTimeout(() => { banner.style.display = 'flex'; }, 2000);
      }
    }
  },
};

/* ── pageInit — runs on every page ──────────────────────────── */
async function pageInit(opts = {}) {
  NAV.inject();

  const cachedProfile = AUTH.getProfile();
  if (cachedProfile) {
    AUTH.setProfile(cachedProfile);
    AUTH.updateNavUI();
  }

  try {
    const loggedIn = await AUTH.init();

    if (loggedIn) {
      if (!cachedProfile) {
        try {
          const profile = await API.getMe();
          AUTH.setProfile(profile);
          AUTH.updateNavUI();
        } catch (e) {
          console.warn('Could not fetch profile:', e);
        }
      } else {
        // Background refresh (non-blocking)
        setTimeout(async () => {
          try {
            const profile = await API.getMe();
            AUTH.setProfile(profile);
          } catch {}
        }, 2000);
      }
    }

    if (opts.requireAuth && !loggedIn) {
      AUTH.requireAuth();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('pageInit auth check failed safely:', error);
    return false;
  }
}