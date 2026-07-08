/* ============================================================
   LUVIIO — Nav  (v12 — Enterprise API Sync + Push Banner Removed)
   ============================================================
   FIXES & CHANGES:
   1. Push notification banner completely removed.
   2. ENTERPRISE SYNC: Safely extracts profile from { success: true, data: ... }
   3. SAFE CHECKS: Guards for CART and AUTH to prevent runtime errors.
   4. UX UPGRADE: Improved outside click handling for dropdowns & mobile menu.
   ============================================================ */

const NAV = {
  inject() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    
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
      </div>`;
    
    this._bindEvents();
    
    // SAFE CHECK: Agar CART exist karta hai tabhi init call hoga
    if (typeof CART !== 'undefined' && typeof CART.init === 'function') {
      CART.init();
    }
    
    // SAFE CHECK: Agar AUTH exist karta hai tabhi UI update hogi
    if (typeof AUTH !== 'undefined' && typeof AUTH.updateNavUI === 'function') {
      AUTH.updateNavUI();
    }
  },
  
  _bindEvents() {
    // ── Mobile menu toggle ────────────────────────────────
    const toggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenu?.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    
    document.querySelectorAll('.mobile-menu a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu?.classList.remove('open');
        toggle?.classList.remove('open');
      });
    });
    
    // ── User dropdown ─────────────────────────────────────
    const uToggle = document.querySelector('.user-menu-toggle');
    const uDrop = document.querySelector('.user-dropdown');
    
    uToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      uDrop?.classList.toggle('open');
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!uDrop?.contains(e.target) && !uToggle?.contains(e.target)) {
        uDrop?.classList.remove('open');
      }
      if (!mobileMenu?.contains(e.target) && !toggle?.contains(e.target)) {
        mobileMenu?.classList.remove('open');
        toggle?.classList.remove('open');
      }
    });
    
    // ── Logout ────────────────────────────────────────────
    async function doLogout(e) {
      if (e) e.preventDefault();
      try { await API.logout(); } catch {}
      
      if (typeof AUTH !== 'undefined') AUTH.clearTokens();
      if (typeof CART !== 'undefined' && typeof CART.clear === 'function') CART.clear();
      
      window.location.href = '/index.html';
    }
    
    document.getElementById('logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', doLogout);
    
    // ── Auth events → nav update ──────────────────────────
    window.addEventListener('auth:login', () => {
      if (typeof AUTH !== 'undefined') AUTH.updateNavUI();
    });
    window.addEventListener('auth:logout', () => {
      if (typeof AUTH !== 'undefined') AUTH.updateNavUI();
    });
  },
};

/* ── pageInit — runs on every page ──────────────────────────── */
async function pageInit(opts = {}) {
  NAV.inject();
  
  if (typeof AUTH === 'undefined') return true;
  
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
          const rawProfile = await API.getMe();
          // 🔥 ENTERPRISE SYNC: Safely unpack wrapper { success: true, data: {...} }
          const profile = rawProfile.data || rawProfile;
          AUTH.setProfile(profile);
          AUTH.updateNavUI();
        } catch (e) {
          console.warn('Could not fetch profile:', e);
        }
      } else {
        // Background refresh (non-blocking)
        setTimeout(async () => {
          try {
            const rawProfile = await API.getMe();
            const profile = rawProfile.data || rawProfile;
            AUTH.setProfile(profile);
            AUTH.updateNavUI();
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