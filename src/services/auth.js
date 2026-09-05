/**
 * Auth service — maps to the real /auth/* endpoints.
 * The refresh token lives in an httpOnly cookie; the access token is held in
 * memory and optionally mirrored to sessionStorage by the auth context.
 */
import { request } from '../api/client';

export const authService = {
  register: (email, password, fullName) =>
    request('POST', '/auth/register', { email, password, full_name: fullName || undefined }),

  login: (email, password) => request('POST', '/auth/login', { email, password }),

  logout: async () => {
    try {
      await request('POST', '/auth/logout', {});
    } catch (e) {
      // Best-effort: always clear local tokens even if the API call fails.
    }
  },

  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),

  resetPassword: (newPassword) =>
    request('POST', '/auth/reset-password', { new_password: newPassword }),

  session: () => request('GET', '/auth/session'),
};
