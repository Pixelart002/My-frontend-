/* ============================================================
   LUVIIO — Auth
   Security model:
   - Access token: in-memory JS variable (never persisted → XSS safe)
   - Refresh token: sessionStorage (tab-scoped; cleared on tab close)
   - Cart data: sessionStorage (not sensitive)
   ============================================================ */

const AUTH = (() => {
  // NEVER write this to localStorage / sessionStorage
  let _accessToken = null;
  let _userProfile  = null;

  const RT_KEY = '__lv_rt'; // sessionStorage key for refresh token

  return {
    /* ── Token getters/setters ─────────────────────────── */
    getToken() { return _accessToken; },

    setTokens(access, refresh) {
      _accessToken = access;
      if (refresh) {
        try { sessionStorage.setItem(RT_KEY, refresh); }
        catch (e) { console.warn('sessionStorage unavailable', e); }
      }
    },

    clearTokens() {
      _accessToken  = null;
      _userProfile  = null;
      try { sessionStorage.removeItem(RT_KEY); } catch (e) {}
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },

    getRefreshToken() {
      try { return sessionStorage.getItem(RT_KEY); }
      catch (e) { return null; }
    },

    isLoggedIn() { return !!_accessToken; },

    /* ── Profile cache ─────────────────────────────────── */
    setProfile(p) { _userProfile = p; },
    getProfile()  { return _userProfile; },

    /* ── Silent refresh on page load ───────────────────── */
    async init() {
      const rt = this.getRefreshToken();
      if (!rt) return false;

      try {
        const res = await fetch(`${CONFIG.API_BASE}/auth/refresh`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) { this.clearTokens(); return false; }

        const data = await res.json();
        this.setTokens(data.access_token, data.refresh_token);
        window.dispatchEvent(new CustomEvent('auth:login'));
        return true;
      } catch {
        this.clearTokens();
        return false;
      }
    },

    /* ── Redirect if not authed ────────────────────────── */
    requireAuth() {
      if (!this.isLoggedIn()) {
        window.location.href =
          '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return false;
      }
      return true;
    },

    /* ── Update nav UI based on auth state ─────────────── */
    updateNavUI() {
      const guestEls = document.querySelectorAll('[data-guest]');
      const authEls  = document.querySelectorAll('[data-authed]');
      const nameEls  = document.querySelectorAll('[data-user-name]');

      if (this.isLoggedIn()) {
        guestEls.forEach(el => el.style.display = 'none');
        authEls.forEach(el  => el.style.display = '');
        if (_userProfile) {
          nameEls.forEach(el => el.textContent =
            escapeHTML(_userProfile.full_name || _userProfile.email?.split('@')[0] || 'Account'));
        }
      } else {
        guestEls.forEach(el => el.style.display = '');
        authEls.forEach(el  => el.style.display = 'none');
      }
    },
  };
})();
