/* ============================================================
   LUVIIO — Nav  (v12 — Google Sitelinks Ready)
   ============================================================
   Changes from v11:
   - Added About, Blog, Privacy, Terms links (sitelinks fix)
   - Mobile menu has ALL crawlable page links
   - Proper aria-labels for accessibility & SEO
   - aria-expanded on hamburger toggle
   ============================================================ */

const NAV = {
  inject() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    nav.innerHTML = `
      <div class="nav-inner">
        <!-- Brand -->
        <a href="/index.html" class="nav-logo" aria-label="Luviio — Home">LUVIIO</a>

        <!-- Desktop nav links — these power Google sitelinks -->
        <nav class="nav-links" aria-label="Main navigation">
          <a href="/shop.html">Shop</a>
          <a href="/shop.html?category=new">New Arrivals</a>
          <a href="/about.html">About</a>
          <a href="https://blog.luviio.in" target="_blank" rel="noopener noreferrer">Blog</a>
          <a href="/orders.html" data-authed style="display:none;">My Orders</a>
        </nav>

        <!-- Right actions -->
        <div class="nav-actions">
          <!-- Cart icon + badge -->
          <a href="/cart.html" class="nav-icon-btn" aria-label="View cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span data-cart-count class="cart-badge" style="display:none;" aria-live="polite">0</span>
          </a>

          <!-- Guest: Sign In button -->
          <a href="/login.html" class="btn-ghost" data-guest aria-label="Sign in to your account">Sign In</a>

          <!-- Auth: User dropdown -->
          <div class="user-menu" data-authed style="display:none;">
            <button class="nav-icon-btn user-menu-toggle"
                    aria-haspopup="true" aria-expanded="false"
                    aria-label="Open account menu">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span data-user-name class="user-name">Account</span>
            </button>
            <div class="user-dropdown" role="menu" aria-label="Account menu">
              <a href="/profile.html"  role="menuitem">Profile</a>
              <a href="/orders.html"   role="menuitem">My Orders</a>
              <hr style="border:none;border-top:1px solid var(--border);margin:4px 0;">
              <button id="logout-btn" class="logout-btn" role="menuitem">Sign out</button>
            </div>
          </div>
        </div>

        <!-- Mobile hamburger -->
        <button class="mobile-toggle" aria-label="Toggle navigation" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- ═══ Mobile Menu ═══════════════════════════════════════════
           All pages linked here — Google crawls this for sitelinks.
           Keep every important page as a plain <a> tag.
      ══════════════════════════════════════════════════════════════ -->
      <nav class="mobile-menu" aria-label="Mobile navigation">
        <a href="/index.html">Home</a>
        <a href="/shop.html">Shop</a>
        <a href="/shop.html?category=new">New Arrivals</a>
        <a href="/about.html">About Us</a>
        <a href="/cart.html">Cart</a>
        <a href="/orders.html"  data-authed style="display:none;">My Orders</a>
        <a href="/profile.html" data-authed style="display:none;">Profile</a>
        <a href="/login.html"   data-guest>Sign In</a>
        <a href="/privacy.html">Privacy Policy</a>
        <a href="/terms.html">Terms &amp; Conditions</a>
        <a href="https://blog.luviio.in" target="_blank" rel="noopener noreferrer">Blog ↗</a>
        <button id="logout-btn-mobile" class="logout-btn" data-authed style="display:none;">Sign out</button>
      </nav>
    `;

    this._bindEvents();
    if (typeof CART !== 'undefined') CART.init();
    AUTH.updateNavUI();
  },

  _bindEvents() {
    const toggle     = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    /* ── Mobile toggle ───────────────────────────────────────────── */
    toggle?.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close on link click
    mobileMenu?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.mobile-toggle') && !e.target.closest('.mobile-menu')) {
        mobileMenu?.classList.remove('open');
        toggle?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });

    /* ── User dropdown ───────────────────────────────────────────── */
    const uToggle = document.querySelector('.user-menu-toggle');
    const uDrop   = document.querySelector('.user-dropdown');

    uToggle?.addEventListener('click', e => {
      e.stopPropagation();
      const open = uDrop?.classList.toggle('open');
      uToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', () => {
      uDrop?.classList.remove('open');
      uToggle?.setAttribute('aria-expanded', 'false');
    });

    /* ── Logout ──────────────────────────────────────────────────── */
    async function doLogout() {
      try { await API.logout(); } catch (e) { console.warn('Logout API:', e.message); }
      AUTH.clearTokens();
      if (typeof CART !== 'undefined') CART.clear();
      window.location.href = '/index.html';
    }
    document.getElementById('logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('logout-btn-mobile')?.addEventListener('click', doLogout);

    /* ── Auth state → UI ─────────────────────────────────────────── */
    window.addEventListener('auth:login',  () => AUTH.updateNavUI());
    window.addEventListener('auth:logout', () => AUTH.updateNavUI());
  },
};

/* ══════════════════════════════════════════════════════════════
   pageInit — run on every page
   opts.requireAuth  → redirect to /login.html if not logged in
══════════════════════════════════════════════════════════════ */
async function pageInit(opts = {}) {
  NAV.inject();

  // Show cached profile instantly (no auth flash)
  const cached = AUTH.getProfile();
  if (cached) { AUTH.setProfile(cached); AUTH.updateNavUI(); }

  try {
    const loggedIn = await AUTH.init();

    if (loggedIn) {
      if (!cached) {
        try {
          const profile = await API.getMe();
          AUTH.setProfile(profile);
          AUTH.updateNavUI();
        } catch (e) { console.warn('[Nav] Profile fetch failed:', e.message); }
      } else {
        // Non-blocking background refresh
        setTimeout(async () => {
          try { AUTH.setProfile(await API.getMe()); } catch {}
        }, 2500);
      }
    }

    if (opts.requireAuth && !loggedIn) {
      AUTH.requireAuth();
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Nav] pageInit error:', err.message);
    return false;
  }
}