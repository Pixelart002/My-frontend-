/**
 * Low-level HTTP client for the Luviio backend.
 *
 * Responsibilities (kept separate from UI):
 *  - Build absolute URL from the configured API base.
 *  - Attach the Bearer access token to authenticated requests.
 *  - Send credentials for auth endpoints (httpOnly refresh cookie).
 *  - On 401, trigger a cookie-based token refresh and retry once.
 *  - Unwrap the standard `{ success, data, meta }` envelope.
 *  - Normalize backend errors into a readable ApiError.
 */

import { API_BASE } from '../config/env';

const PUBLIC_PREFIXES = [
  '/products',
  '/categories',
  '/pricing/config',
  '/health',
  '/push/vapid-key',
];

const PUBLIC_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const IDEMPOTENT = new Set(['GET', 'PUT', 'HEAD']);
const MAX_RETRIES = 2;

export class ApiError extends Error {
  constructor(message, status = 0, code = null) {
    super(message || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

function isPublic(path) {
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

function isPublicRequest(method, path) {
  return PUBLIC_METHODS.has(method.toUpperCase()) && isPublic(path);
}

function backoff(attempt) {
  return 300 * Math.pow(2, attempt - 1);
}

function readToken() {
  if (accessToken) return accessToken;

  try {
    const bridged = window.__getLuviioToken ? window.__getLuviioToken() : null;
    if (bridged) {
      accessToken = bridged;
      return bridged;
    }
  } catch {
    /* noop */
  }

  try {
    const stored = sessionStorage.getItem('__lv_at');
    if (stored) {
      accessToken = stored;
      return stored;
    }
  } catch {
    /* storage unavailable */
  }

  return null;
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      const payload = json.data || json;
      return payload && payload.access_token ? payload.access_token : null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function normalizeLegacyOrderPath(method, path, body) {
  if (
    method.toUpperCase() === 'POST' &&
    path === '/orders' &&
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    String(body.payment_method || '').toLowerCase() === 'cod'
  ) {
    return '/orders/cod';
  }
  return path;
}

async function fetchOnce(method, path, body, headers) {
  const normalizedPath = normalizeLegacyOrderPath(method, path, body);
  const opts = {
    method,
    headers: { ...headers },
    credentials: 'include',
    signal: AbortSignal.timeout(15000),
  };

  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== null && body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  return fetch(`${API_BASE}${normalizedPath}`, opts);
}

async function parseError(res, parsed = null) {
  let data = parsed || {};
  if (!parsed) {
    try {
      data = await res.json();
    } catch {
      /* no body */
    }
  }
  const raw = Array.isArray(data?.detail)
    ? data.detail.map((d) => d.msg || d.message || 'Validation error').join('; ')
    : data?.message || data?.detail || (data?.error_code ? data.error_code : null) || `Error ${res.status}`;
  return new ApiError(String(raw).substring(0, 300), res.status, data?.error_code);
}

/** Preserve pagination metadata without changing existing service return shapes. */
function unwrapResponse(json) {
  if (!json || json.success === undefined || json.data === undefined) return json;

  const payload = json.data;
  if (json.meta === undefined) return payload;

  if (Array.isArray(payload)) {
    // Arrays remain arrays for existing callers, while metadata is available
    // to pagination-aware pages as `result.meta`.
    payload.meta = json.meta;
    return payload;
  }

  if (payload && typeof payload === 'object') {
    return { ...payload, meta: json.meta };
  }

  return payload;
}

export async function request(method, path, body = null, isRetry = false) {
  const headers = {};
  const token = readToken();
  const normalizedMethod = method.toUpperCase();
  const publicRequest = isPublicRequest(normalizedMethod, path);
  const protectedPath = !publicRequest && !path.startsWith('/auth/');

  if (token && protectedPath) headers.Authorization = `Bearer ${token}`;

  const canRetry = IDEMPOTENT.has(normalizedMethod);
  let attempt = 0;

  const performForRefresh = async () => {
    const res = await fetchOnce(method, path, body, headers);
    if (res.status === 401 && !isRetry && protectedPath) {
      const fresh = await refreshAccessToken();
      if (fresh) {
        setAccessToken(fresh);
        try {
          if (window.__setToken) window.__setToken(fresh);
        } catch {
          /* noop */
        }
        return request(method, path, body, true);
      }
      try {
        if (window.__clearToken) window.__clearToken();
      } catch {
        /* noop */
      }
      throw new ApiError('Your session has expired. Please sign in again.', 401, 'AUTH_REQUIRED');
    }
    return res;
  };

  while (attempt <= (canRetry ? MAX_RETRIES : 0)) {
    attempt += 1;
    try {
      const res = await performForRefresh();
      if (res === null) return null;
      if (res.status === 204) return null;

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) throw await parseError(res, data);

      return unwrapResponse(data);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw new ApiError('Request timed out — please try again.', 0, 'TIMEOUT');
      }
      if (!canRetry || attempt > MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, backoff(attempt)));
    }
  }

  throw new ApiError('Network error — please check your connection.', 0, 'NETWORK_ERROR');
}

export async function downloadFile(path, defaultFilename) {
  const headers = {};
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new ApiError('Failed to download file.', res.status);

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}
