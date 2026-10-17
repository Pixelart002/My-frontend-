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
const SESSION_RESTORE_ATTEMPTS = 3;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

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
  const [restoreError, setRestoreError] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);

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
   * The refresh cookie is the source of truth. Do not gate session
   * restoration on a client-side hint, because the hint can be lost
   * independently of the HttpOnly cookie.
   */
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setRestoreError(false);

      for (let attempt = 0; attempt < SESSION_RESTORE_ATTEMPTS; attempt += 1) {
        if (!active) return;

        try {
          const response = await fetch(
            `${API_BASE}/auth/refresh`,
            {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: createTimeoutSignal(REFRESH_TIMEOUT_MS),
            },
          );

          if (!response.ok) {
            // Invalid/expired credentials are definitive. Server errors,
            // rate limits and gateway failures may be transient.
            if ([401, 403].includes(response.status)) {
              if (active) clearSession();
              return;
            }

            if (response.status < 500 && response.status !== 429) {
              if (active) clearSession();
              return;
            }

            if (attempt < SESSION_RESTORE_ATTEMPTS - 1) {
              await wait(300 * (attempt + 1));
              continue;
            }

            if (active) setRestoreError(true);
            return;
          }

          const json = await response.json();
          const payload = json?.data || json;
          const access = payload?.access_token || null;

          if (!active) return;

          if (!access) {
            clearSession();
            return;
          }

          persistToken(access);
          writeStorage(SESSION_HINT, '1');

          // Finish restoring the session and profile before protected routes
          // render, so they never observe a false logged-out startup state.
          await loadProfile();
          return;
        } catch {
          if (!active) return;

          if (attempt < SESSION_RESTORE_ATTEMPTS - 1) {
            await wait(300 * (attempt + 1));
            continue;
          }

          // Network failure is not proof that the user's session is invalid.
          // Keep the session hint and let the user retry restoration.
          setRestoreError(true);
        }
      }
    };

    bootstrap().finally(() => {
      if (active) setInitializing(false);
    });

    return () => {
      active = false;
    };
  }, [
    clearSession,
    loadProfile,
    persistToken,
    restoreAttempt,
  ]);

  const retrySession = useCallback(() => {
    setRestoreError(false);
    setInitializing(true);
    setRestoreAttempt((attempt) => attempt + 1);
  }, []);

  /**
   * Login.
   */
  const login = useCallback(
    async (email, password) => {
      // A fresh credential-based login supersedes any previous refresh error.
      setRestoreError(false);

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

      return {
        ...data,
        profile,
      };
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
   * Apply only server-confirmed, self-editable profile fields.
   * Never let a profile edit overwrite identity or authorization fields.
   */
  const applyProfileUpdate = useCallback((profile) => {
    if (!profile || typeof profile !== 'object') {
      return;
    }

    setUser((current) => {
      if (!current) {
        return current;
      }

      const patch = {};

      if (Object.prototype.hasOwnProperty.call(profile, 'full_name')) {
        patch.full_name = profile.full_name;
      }

      if (Object.prototype.hasOwnProperty.call(profile, 'phone')) {
        patch.phone = profile.phone;
      }

      return Object.keys(patch).length
        ? { ...current, ...patch }
        : current;
    });
  }, []);

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
      restoreError,
      isAuthenticated: Boolean(token),

      login,
      register,
      logout,
      refreshProfile,
      applyProfileUpdate,
      clearSession,
      retrySession,
    }),
    [
      user,
      token,
      initializing,
      restoreError,
      login,
      register,
      logout,
      refreshProfile,
      applyProfileUpdate,
      clearSession,
      retrySession,
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