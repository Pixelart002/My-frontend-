/**
 * Users / profile / addresses service — real backend endpoints.
 */
import { request } from '../api/client';

export const userService = {
  getMe: () => request('GET', '/users/me'),
  updateMe: (data) => request('PATCH', '/users/me', data),

  getAddresses: () => request('GET', '/users/me/addresses'),
  addAddress: (data) => request('POST', '/users/me/addresses', data),
  deleteAddress: (id) => request('DELETE', `/users/me/addresses/${encodeURIComponent(id)}`),
};
