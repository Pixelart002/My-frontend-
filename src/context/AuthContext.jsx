/**
 * AuthContext — owns session state for the whole app.
 *
 * Token model (mirrors the real backend):
 *  - refresh_token: httpOnly cookie scoped to /api/v1/auth (never readable by JS)
 *  - access_token: short-lived JWT, kept in sessionStorage + memory here
 *
 * On mount we try /auth/refresh if a session hint exists, so a page reload
 * restores the session. Protected routes read `isAuthenticated` from here.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setAccessToken } from '../api/client';
import { API_BASE } from '../config/env';
import { authService } from '../services/auth';
import { userService } from '../services/users';

const AT_KEY = '__lv_at';
const SESSION_HINT = '__lv_has_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(AT_KEY);
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(true);

  const persistToken = useCallback((access) => {
    setAccessToken(access);
    setToken(access);
    try {
      if (access) sessionStorage.setItem(AT_KEY, access);
      else sessionStorage.removeItem(AT_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const loadProfile = useCallback(async (access) => {
    if (!access) return null;
    try {
      const profile = await userService.getMe();
      setUser(profile || null);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    persistToken(null);
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_HINT);
    } catch {
      /* noop */
    }
  }, [persistToken]);

  // Expose token hooks to the API client (used for the 401 refresh path).
  useEffect(() => {
    window.__getLuviioToken = () => token;
    window.__setToken = (access) => persistToken(access);
    window.__clearToken = () => clearSession();
  }, [token, persistToken, clearSession]);

  // Bootstrap: restore session from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(9000),
        });
        if (!res.ok) {
          if (active) clearSession();
          return;
        }
        const json = await res.json();
        const payload = json.data || json;
        const access = payload?.access_token || null;
        if (!active) return;
        if (access) {
          persistToken(access);
          try {
            sessionStorage.setItem(SESSION_HINT, '1');
          } catch {
            /* noop */
          }
          await loadProfile(access);
        } else if (active) {
          clearSession();
        }
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authService.login(email, password);
      const access = data?.access_token;
      if (!access) throw new Error('Login did not return an access token.');
      persistToken(access);
      try {
        sessionStorage.setItem(SESSION_HINT, '1');
      } catch {
        /* noop */
      }
      await loadProfile(access);
      return data;
    },
    [persistToken, loadProfile],
  );

  const register = useCallback((email, password, fullName) => authService.register(email, password, fullName), []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    return loadProfile(token);
  }, [token, loadProfile]);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      refreshProfile,
      clearSession,
    }),
    [user, token, initializing, login, register, logout, refreshProfile, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
}
