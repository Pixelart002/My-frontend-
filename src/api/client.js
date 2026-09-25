/**
 * Low-level HTTP client for the Luviio backend.
 *
 * Responsibilities:
 *  - Build absolute URLs from the configured API base.
 *  - Attach Bearer access tokens to protected requests.
 *  - Send credentials for httpOnly refresh-cookie authentication.
 *  - Refresh an expired access token once after a 401.
 *  - Retry only safe/idempotent requests after transient network failures.
 *  - Unwrap the standard `{ success, data, meta }` response envelope.
 *  - Normalize backend failures into ApiError.
 */

import { API_BASE } from '../config/env';

const PUBLIC_PREFIXES = [
  '/products',
  '/categories',
  '/reviews/products',
  '/health',
  '/push/vapid-key',
  '/payments/public-config',
];

const PUBLIC_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
]);

function isPublicAuthPath(path) {
  return PUBLIC_AUTH_PATHS.has(path);
}

/*
 * Only retry requests whose repetition cannot create a second mutation.
 *
 * POST is deliberately excluded.
 * PUT is technically idempotent by HTTP semantics, but whether it is safe
 * to replay depends on the backend implementation, so keep the client
 * conservative unless the endpoint is explicitly known to be replay-safe.
 */
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 15_000;
const DOWNLOAD_TIMEOUT_MS = 30_000;
const REFRESH_TIMEOUT_MS = 8_000;

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


/* -------------------------------------------------------------------------- */
/* Request classification                                                     */
/* -------------------------------------------------------------------------- */

function isPublic(path) {
  return PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function isPublicRequest(method, path) {
  return (
    PUBLIC_METHODS.has(method.toUpperCase()) &&
    isPublic(path)
  );
}

function isProtectedRequest(method, path) {
  return (
    !isPublicRequest(method, path) &&
    !isPublicAuthPath(path)
  );
}

function canRetryMethod(method) {
  return RETRYABLE_METHODS.has(method.toUpperCase());
}

function backoff(attempt) {
  return 300 * Math.pow(2, attempt - 1);
}


/* -------------------------------------------------------------------------- */
/* Token handling                                                             */
/* -------------------------------------------------------------------------- */

function readToken() {
  if (accessToken) {
    return accessToken;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const bridged = window.__getLuviioToken
      ? window.__getLuviioToken()
      : null;

    if (bridged) {
      accessToken = bridged;
      return bridged;
    }
  } catch {
    // Browser bridge unavailable.
  }

  // Access tokens are intentionally never read from Web Storage.
  // A page reload obtains a fresh token through the HttpOnly refresh cookie.
  return null;
}

function publishToken(token) {
  setAccessToken(token);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (window.__setToken) {
      window.__setToken(token);
    }
  } catch {
    // Token bridge unavailable.
  }
}

function clearPublishedToken() {
  setAccessToken(null);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (window.__clearToken) {
      window.__clearToken();
    }
  } catch {
    // Token bridge unavailable.
  }
}


/* -------------------------------------------------------------------------- */
/* Token refresh                                                              */
/* -------------------------------------------------------------------------- */

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
      });

      if (!response.ok) {
        return null;
      }

      const json = await response.json().catch(() => null);
      const payload = json?.data || json;

      return payload?.access_token || null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function ensureAccessToken() {
  const current = readToken();

  if (current) {
    return current;
  }

  const freshToken = await refreshAccessToken();

  if (!freshToken) {
    return null;
  }

  publishToken(freshToken);

  return freshToken;
}


/* -------------------------------------------------------------------------- */
/* Backend path compatibility                                                 */
/* -------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------- */
/* Fetch                                                                      */
/* -------------------------------------------------------------------------- */

async function fetchOnce(method, path, body, headers = {}) {
  const normalizedPath = normalizeLegacyOrderPath(
    method,
    path,
    body
  );

  const requestHeaders = {
    ...headers,
  };

  const options = {
    method,
    headers: requestHeaders,
    credentials: 'include',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== null && body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return fetch(
    `${API_BASE}${normalizedPath}`,
    options
  );
}


/* -------------------------------------------------------------------------- */
/* Error normalization                                                        */
/* -------------------------------------------------------------------------- */

async function parseError(response, parsed = null) {
  let data = parsed || {};

  if (!parsed) {
    try {
      data = await response.json();
    } catch {
      // Response has no JSON body.
    }
  }

  let raw;

  if (Array.isArray(data?.detail)) {
    raw = data.detail
      .map(
        (item) =>
          item?.msg ||
          item?.message ||
          'Validation error'
      )
      .join('; ');
  } else {
    raw =
      data?.message ||
      data?.detail ||
      data?.error_code ||
      `Error ${response.status}`;
  }

  return new ApiError(
    String(raw).substring(0, 300),
    response.status,
    data?.error_code || null
  );
}


/* -------------------------------------------------------------------------- */
/* Response envelope                                                          */
/* -------------------------------------------------------------------------- */

function unwrapResponse(json) {
  if (
    !json ||
    json.success === undefined ||
    json.data === undefined
  ) {
    return json;
  }

  const payload = json.data;

  if (json.meta === undefined) {
    return payload;
  }

  if (Array.isArray(payload)) {
    payload.meta = json.meta;
    return payload;
  }

  if (payload && typeof payload === 'object') {
    return {
      ...payload,
      meta: json.meta,
    };
  }

  return payload;
}


/* -------------------------------------------------------------------------- */
/* Main request                                                               */
/* -------------------------------------------------------------------------- */

export async function request(
  method,
  path,
  body = null,
  isRetry = false
) {
  const normalizedMethod = method.toUpperCase();

  const publicRequest = isPublicRequest(
    normalizedMethod,
    path
  );

  /*
   * HSN suggestions are intentionally protected even though they sit under
   * the public /products namespace.
   */
  const protectedPath =
    !publicRequest &&
    path !== '/products/hsn-suggestions' &&
    !isPublicAuthPath(path);

  const retryable = canRetryMethod(normalizedMethod);

  let attempt = 0;
  let refreshed = isRetry;

  /*
   * Protected requests must never be sent without credentials.
   * Recover a short-lived access token from the HttpOnly refresh
   * cookie before the first network attempt when memory is empty.
   */
  let ensuredToken = null;

  if (protectedPath) {
    ensuredToken = await ensureAccessToken();

    if (!ensuredToken) {
      clearPublishedToken();

      throw new ApiError(
        'Your session has expired. Please sign in again.',
        401,
        'AUTH_REQUIRED',
      );
    }
  }

  while (attempt <= (retryable ? MAX_RETRIES : 0)) {
    attempt += 1;

    const headers = {};
    const token = ensuredToken || readToken();

    if (token && protectedPath) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetchOnce(
        normalizedMethod,
        path,
        body,
        headers
      );

      /*
       * One refresh attempt per logical request.
       *
       * Do not recursively call request(), because doing so would create
       * another retry counter and could multiply network attempts.
       */
      if (
        response.status === 401 &&
        protectedPath &&
        !refreshed
      ) {
        refreshed = true;

        const freshToken = await refreshAccessToken();

        if (freshToken) {
          publishToken(freshToken);
          ensuredToken = freshToken;

          /*
           * Retry the same request exactly once with the fresh token.
           * No recursive request() call.
           */
          continue;
        }

        clearPublishedToken();

        throw new ApiError(
          'Your session has expired. Please sign in again.',
          401,
          'AUTH_REQUIRED'
        );
      }

      if (
        response.status === 204 ||
        response.status === 205
      ) {
        return null;
      }

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw await parseError(response, data);
      }

      return unwrapResponse(data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (
        error?.name === 'TimeoutError' ||
        error?.name === 'AbortError'
      ) {
        throw new ApiError(
          'Request timed out — please try again.',
          0,
          'TIMEOUT'
        );
      }

      if (
        !retryable ||
        attempt > MAX_RETRIES
      ) {
        break;
      }

      await new Promise((resolve) => {
        setTimeout(
          resolve,
          backoff(attempt)
        );
      });
    }
  }

  throw new ApiError(
    'Network error — please check your connection.',
    0,
    'NETWORK_ERROR'
  );
}


/* -------------------------------------------------------------------------- */
/* File download                                                              */
/* -------------------------------------------------------------------------- */

export async function downloadFile(
  path,
  defaultFilename
) {
  const requestWithToken = async () => {
    const headers = {};
    const token = readToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
  };

  let response;

  try {
    response = await requestWithToken();

    if (response.status === 401) {
      const freshToken = await refreshAccessToken();

      if (freshToken) {
        publishToken(freshToken);
        response = await requestWithToken();
      } else {
        clearPublishedToken();

        throw new ApiError(
          'Your session has expired. Please sign in again.',
          401,
          'AUTH_REQUIRED'
        );
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError'
    ) {
      throw new ApiError(
        'Download timed out — please try again.',
        0,
        'TIMEOUT'
      );
    }

    throw new ApiError(
      'Network error — please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  if (!response.ok) {
    let message = 'Failed to download file.';
    let code = null;

    try {
      const data = await response.json();

      message =
        data?.detail ||
        data?.message ||
        message;

      code = data?.error_code || null;
    } catch {
      // Binary/error response without JSON.
    }

    throw new ApiError(
      String(message).substring(0, 300),
      response.status,
      code
    );
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new ApiError(
      'Invoice PDF is empty.',
      response.status,
      'EMPTY_FILE'
    );
  }

  const disposition =
    response.headers.get('Content-Disposition') || '';

  const match = disposition.match(
    /filename\*?=(?:UTF-8'')?([^;"]+)/i
  );

  let filename = defaultFilename;

  if (match?.[1]) {
    const rawFilename = match[1]
      .trim()
      .replace(/^"|"$/g, '');

    try {
      filename = decodeURIComponent(rawFilename);
    } catch {
      filename = rawFilename;
    }
  }

  const objectUrl =
    window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download =
    filename ||
    defaultFilename ||
    'Luviio-Invoice.pdf';

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}