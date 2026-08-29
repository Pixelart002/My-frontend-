/* ============================================================
   LUVIIO — Auth  (v4.3 — Enterprise Strict Sync & Force Refresh)
   ============================================================ */

const AUTH = (() => {
  let _accessToken = null;
  let _userProfile = null;
  let _currentRefreshPromise = null;
  
  const AT_KEY = '__lv_at';
  const PROFILE_KEY = '__lv_profile';
  const PROFILE_TTL = 5 * 60 * 1000;
  const REFRESH_KEY = '__lv_last_refresh';
  const REFRESH_GAP = 30 * 1000;
  const SYNC_LOGOUT_KEY = '__lv_logout_sync';
  const SESSION_HINT = '__lv_has_session';
  
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
    del(k) { try { sessionStorage.removeItem(k); } catch {} },
  };
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  
  // Instantly recover access token from storage on page evaluation
  _accessToken = ss.get(AT_KEY);
  
  function _saveProfileCache(profile) {
    try {
      ss.set(PROFILE_KEY, JSON.stringify({ data: profile, ts: Date.now() }));
    } catch {}
  }
  
  function _loadProfileCache() {
    try {
      const raw = ss.get(PROFILE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > PROFILE_TTL) { ss.del(PROFILE_KEY); return null; }
      return data;
    } catch { return null; }
  }
  
  // Cross-Tab Logout Sync
  window.addEventListener('storage', (e) => {
    if (e.key === SYNC_LOGOUT_KEY) {
      _accessToken = null;
      _userProfile = null;
      ss.del(AT_KEY);
      ss.del(PROFILE_KEY);
      ss.del(REFRESH_KEY);
      ls.del(SESSION_HINT);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  });
  
  return {
    getToken() { return _accessToken; },
    
    setTokens(access) {
      _accessToken = access;
      ss.set(AT_KEY, access);
      ss.set(REFRESH_KEY, String(Date.now()));
      ls.set(SESSION_HINT, '1');
    },
    
    clearTokens() {
      _accessToken = null;
      _userProfile = null;
      ss.del(AT_KEY);
      ss.del(PROFILE_KEY);
      ss.del(REFRESH_KEY);
      ls.del(SESSION_HINT);
      
      try { localStorage.setItem(SYNC_LOGOUT_KEY, String(Date.now())); } catch {}
      
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },
    
    isLoggedIn() { return !!_accessToken; },
    
    setProfile(p) {
      _userProfile = p;
      _saveProfileCache(p);
    },
    
    getProfile() {
      if (_userProfile) return _userProfile;
      const cached = _loadProfileCache();
      if (cached) { _userProfile = cached; return cached; }
      return null;
    },
    
    getCachedProfile() { return _loadProfileCache(); },
    
    _wasRecentlyRefreshed() {
      const last = ss.get(REFRESH_KEY);
      return last && (Date.now() - Number(last)) < REFRESH_GAP;
    },
    
    async init(force = false) {
      // 🛡️ CHANGE 2: Ignore cached access token if force is true
      if (!force && _accessToken) {
        window.dispatchEvent(new CustomEvent('auth:login'));
        return true;
      }
      
      if (!ls.get(SESSION_HINT)) {
        return false;
      }
      
      const path = window.location.pathname;
      if (path.includes('login.html') || path === '/login' || path.endsWith('/login')) {
        return false;
      }
      
      if (_currentRefreshPromise) return _currentRefreshPromise;
      
      _currentRefreshPromise = (async () => {
        try {
          const res = await fetch(`${CONFIG.API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: AbortSignal.timeout(8000),
          }).catch(err => {
            throw new Error("Network unreachable");
          });
          
          if (!res || !res.ok) {
            this.clearTokens();
            return false;
          }
          
          const json = await res.json();
          const payload = json.data || json;
          
          if (payload && payload.access_token) {
            // 🛡️ CHANGE 3: Set tokens, update memory immediately, and save refresh timestamp
            this.setTokens(payload.access_token);
            _accessToken = payload.access_token;
            ss.set(REFRESH_KEY, String(Date.now()));
            
            window.dispatchEvent(new CustomEvent('auth:login'));
            return true;
          }
          return false;
          
        } catch (err) {
          console.warn("Cookie verification skipped locally:", err.message);
          this.clearTokens();
          return false;
        } finally {
          _currentRefreshPromise = null;
        }
      })();
      
      return _currentRefreshPromise;
    },
    
    requireAuth() {
      if (!this.isLoggedIn()) {
        const current = window.location.pathname;
        if (current === '/login.html' || current === '/login' || current.endsWith('/login.html')) {
          return false;
        }
        window.location.href =
          '/login.html?redirect=' + encodeURIComponent(current + window.location.search);
        return false;
      }
      return true;
    },
    
    updateNavUI() {
      const profile = this.getProfile();
      document.querySelectorAll('[data-guest]').forEach(el => {
        el.style.display = this.isLoggedIn() ? 'none' : '';
      });
      document.querySelectorAll('[data-authed]').forEach(el => {
        el.style.display = this.isLoggedIn() ? '' : 'none';
      });
      if (profile) {
        document.querySelectorAll('[data-user-name]').forEach(el => {
          el.textContent = escapeHTML(
            profile.full_name || profile.email?.split('@')[0] || 'Account'
          );
        });
      }
    },
  };
})();