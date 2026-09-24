/**
 * Users / profile / addresses service — real backend endpoints.
 *
 * Backend remains authoritative for:
 * - user identity
 * - profile permissions
 * - address ownership
 * - delivery eligibility
 * - checkout eligibility
 * - address validation
 */
import { request } from '../api/client';
import { asId } from '../utils/dataTypes';

const INDIA_COUNTRY = 'IN';

function normalizeCountry(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function assertIndiaAddress(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new TypeError(
      'Address data is required.',
    );
  }
  
  const country = normalizeCountry(
    data.country || INDIA_COUNTRY,
  );
  
  if (country !== INDIA_COUNTRY) {
    throw new TypeError(
      'Luviio currently delivers only within India. Please select an Indian address.',
    );
  }
  
  return {
    ...data,
    country: INDIA_COUNTRY,
  };
}

function requireAddressId(value) {
  const id = asId(value);
  
  if (!id) {
    throw new TypeError(
      'A valid address id is required.',
    );
  }
  
  return id;
}

export const userService = {
  getMe: () =>
    request('GET', '/users/me'),
  
  updateMe: (data) => {
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      throw new TypeError(
        'Profile data is required.',
      );
    }
    
    return request(
      'PATCH',
      '/users/me',
      data,
    );
  },
  
  getAddresses: () =>
    request(
      'GET',
      '/users/me/addresses',
    ),
  
  addAddress: (data) =>
    request(
      'POST',
      '/users/me/addresses',
      assertIndiaAddress(data),
    ),
  
  deleteAddress: (id) =>
    request(
      'DELETE',
      `/users/me/addresses/${encodeURIComponent(
        requireAddressId(id),
      )}`,
    ),
};