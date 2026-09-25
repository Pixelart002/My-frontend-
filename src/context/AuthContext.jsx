/**
 * AuthContext — owns session state for the whole app.
 *
 * Token model:
 *  - refresh_token: httpOnly cookie scoped to /api/v1/auth
 *  - access_token: short-lived JWT kept in memory only
 *
 * Responsibilities:
 *  - restore authentication on app startup
 *  - keep the API client synchronized with the access token
 *  - expose authenticated user/profile state
 *  - provide login/register/logout helpers
 *  - safely recover from expired/invalid sessions
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { setAccessToken } from '../api/client';
import { API_BASE } from '../config/env';
import { authService } from '../services/auth';
import { userService } from '../services/users';

const SESSION_HINT = '__lv_has_session';
const REFRESH_TIMEOUT_MS = 9000;

const AuthContext = createContext(null);

function readStorage(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value == null) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // Storage may be unavailable.
  }
}

function createTimeoutSignal(ms) {
  if (
    typeof AbortSignal !== 'undefined' &&
    typeof AbortSignal.timeout === 'function'
  ) {
    return AbortSignal.timeout(ms);
  }

  if (
    typeof AbortController === 'undefined'
  ) {
    return undefined;
  }

  const controller = new AbortController();

  const timer = window.setTimeout(() => {
    controller.abort();
  }, ms);

  controller.signal.addEventListener(
    'abort',
    () => window.clearTimeout(timer),
    { once: true },
  );

  return controller.signal;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(null);

  // Access tokens live only in memory; the refresh token is the only persistent auth credential and is an HttpOnly cookie.

  const [initializing, setInitializing] = useState(true);

  /**
   * Keep React state and the API client synchronized in one place.
   */
  const persistToken = useCallback((accessToken) => {
    setAccessToken(accessToken || null);
    setToken(accessToken || null);

  }, []);

  /**
   * Fetch the current authenticated user.
   */
  const loadProfile = useCallback(async () => {
    try {
      const profile = await userService.getMe();

      setUser(profile || null);

      return profile || null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  /**
   * Clear all client-side authentication state.
   *
   * The refresh cookie is intentionally not manipulated here
   * because it is httpOnly and owned by the backend.
   */
  const clearSession = useCallback(() => {
    persistToken(null);
    setUser(null);

    writeStorage(SESSION_HINT, null);
  }, [persistToken]);

  /**
   * API client compatibility hooks.
   *
   * The API client can use these during its 401 refresh path.
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.__getLuviioToken = () => token;

    window.__setToken = (access) => {
      persistToken(access);
    };

    window.__clearToken = () => {
      clearSession();
    };

    return () => {
      delete window.__getLuviioToken;
      delete window.__setToken;
      delete window.__clearToken;
    };
  }, [
    token,
    persistToken,
    clearSession,
  ]);

  /**
   * Bootstrap authentication from the backend refresh cookie.
   *
   * SESSION_HINT avoids making an unnecessary refresh request
   * for users who have never authenticated in this browser tab.
   */
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const hasSessionHint =
        readStorage(SESSION_HINT) === '1';

      /*
       * Access tokens are memory-only. After a reload, the backend
       * refresh cookie restores a fresh short-lived access token.
       */
      if (!hasSessionHint) {
        if (active) {
          setInitializing(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/auth/refresh`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: createTimeoutSignal(
              REFRESH_TIMEOUT_MS,
            ),
          },
        );

        if (!response.ok) {
          if (active) {
            clearSession();
          }

          return;
        }

        const json = await response.json();

        const payload =
          json?.data || json;

        const access =
          payload?.access_token || null;

        if (!active) return;

        if (!access) {
          clearSession();
          return;
        }

        persistToken(access);
        writeStorage(SESSION_HINT, '1');

        /*
         * persistToken() updates React state, but loadProfile()
         * reads the API client's token, so it can immediately
         * authenticate this request.
         */
        await loadProfile();
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [
    clearSession,
    loadProfile,
    persistToken,
  ]);

  /**
   * Login.
   */
  const login = useCallback(
    async (email, password) => {
      const data = await authService.login(
        email,
        password,
      );

      const access =
        data?.access_token || null;

      if (!access) {
        throw new Error(
          'Login did not return an access token.',
        );
      }

      persistToken(access);
      writeStorage(SESSION_HINT, '1');

      const profile = await loadProfile();

      /*
       * Authentication succeeded, but profile loading failed.
       * Keep the token because the authenticated session itself
       * is still valid.
       */
      if (!profile) {
        setUser(null);
      }

      return data;
    },
    [
      loadProfile,
      persistToken,
    ],
  );

  /**
   * Registration intentionally delegates entirely
   * to authService.
   */
  const register = useCallback(
    (email, password, fullName) =>
      authService.register(
        email,
        password,
        fullName,
      ),
    [],
  );

  /**
   * Logout.
   *
   * Local auth state is cleared even if the backend request
   * fails, preventing a broken server logout from leaving
   * the UI in an apparently authenticated state.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /**
   * Refresh the currently authenticated profile.
   */
  const refreshProfile = useCallback(async () => {
    if (!token) {
      return null;
    }

    return loadProfile();
  }, [
    token,
    loadProfile,
  ]);

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
    [
      user,
      token,
      initializing,
      login,
      register,
      logout,
      refreshProfile,
      clearSession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider.',
    );
  }

  return context;
}