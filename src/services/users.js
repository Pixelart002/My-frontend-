/**
 * Users / profile / addresses service — real backend endpoints.
 */
import { request } from '../api/client';

const INDIA_COUNTRY = 'IN';

function assertIndiaAddress(data) {
  const country = String(data?.country || INDIA_COUNTRY).trim().toUpperCase();
  if (country !== INDIA_COUNTRY) {
    throw new Error('Luviio currently delivers only within India. Please select an Indian address.');
  }
  return { ...data, country: INDIA_COUNTRY };
}

export const userService = {
  getMe: () => request('GET', '/users/me'),
  updateMe: (data) => request('PATCH', '/users/me', data),

  // India-only storefront: foreign saved addresses must never become checkout options.
  getAddresses: async () => {
    const list = await request('GET', '/users/me/addresses');
    return Array.isArray(list)
      ? list.filter((address) => String(address?.country || '').trim().toUpperCase() === INDIA_COUNTRY)
      : [];
  },

  // Keep the client-side address contract India-only; backend remains authoritative.
  addAddress: (data) => request('POST', '/users/me/addresses', assertIndiaAddress(data)),
  deleteAddress: (id) => request('DELETE', `/users/me/addresses/${encodeURIComponent(id)}`),
};
