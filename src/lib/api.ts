import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import type { AuthTokens } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Backend URL — env var missing ho toh bhi kaam kare
// Vercel mein NEXT_PUBLIC_API_URL set karo → Settings → Environment Variables
// Value: https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://apparent-jordanna-pixelart002-42e39ac6.koyeb.app";

// ── Axios instance ────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL:         `${BASE_URL}/api/v1`,
  timeout:         15000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Cookie keys ───────────────────────────────────────────────────────────────
// NOTE: ye value middleware.ts mein bhi same rakho — import mat karo wahan se
export const COOKIE_ACCESS  = "ms_access";
export const COOKIE_REFRESH = "ms_refresh";

const COOKIE_OPTS = {
  maxAge:   60 * 60 * 24 * 7,
  path:     "/",
  sameSite: "lax" as const,
  secure:   process.env.NODE_ENV === "production",
};

export function setAuthCookies(tokens: AuthTokens) {
  setCookie(COOKIE_ACCESS, tokens.access_token, {
    ...COOKIE_OPTS,
    maxAge: tokens.expires_in ?? 900,
  });
  setCookie(COOKIE_REFRESH, tokens.refresh_token, COOKIE_OPTS);
}

export function clearAuthCookies() {
  deleteCookie(COOKIE_ACCESS);
  deleteCookie(COOKIE_REFRESH);
}

export function getAccessToken(): string | undefined {
  return getCookie(COOKIE_ACCESS) as string | undefined;
}

export function getRefreshToken(): string | undefined {
  return getCookie(COOKIE_REFRESH) as string | undefined;
}

// ── Request interceptor — attach token ───────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject:  (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing           = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthCookies();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<AuthTokens>(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        );
        setAuthCookies(data);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthCookies();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Error helper ──────────────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.detail ??
      error.message ??
      "Something went wrong"
    );
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}