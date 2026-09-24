/**
 * Auth service — maps to the real /auth/* endpoints.
 *
 * Authentication contract:
 * - Refresh token: httpOnly cookie.
 * - Access token: managed by AuthContext.
 * - This service does not store, refresh, or clear tokens directly.
 */
import { request } from '../api/client';

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

function normalizeName(fullName) {
  const value = String(
    fullName ?? '',
  ).trim();

  return value || undefined;
}

export const authService = {
  register: (
    email,
    password,
    fullName,
  ) =>
    request(
      'POST',
      '/auth/register',
      {
        email: normalizeEmail(email),
        password,
        full_name:
          normalizeName(fullName),
      },
    ),

  login: (
    email,
    password,
  ) =>
    request(
      'POST',
      '/auth/login',
      {
        email: normalizeEmail(email),
        password,
      },
    ),

  logout: async () => {
    try {
      await request(
        'POST',
        '/auth/logout',
        {},
      );
    } catch {
      // Logout is best-effort.
      // AuthContext remains responsible for
      // clearing the local access-token state.
    }
  },

  forgotPassword: (email) =>
    request(
      'POST',
      '/auth/forgot-password',
      {
        email: normalizeEmail(email),
      },
    ),

  resetPassword: (
    newPassword,
  ) =>
    request(
      'POST',
      '/auth/reset-password',
      {
        new_password: newPassword,
      },
    ),

  session: () =>
    request(
      'GET',
      '/auth/session',
    ),
};