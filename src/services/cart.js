/**
 * Cart service — real backend endpoints. The backend computes all totals
 * (subtotal, tax, shipping, free-shipping threshold) and returns them in the
 * cart response, so the UI never does pricing math itself.
 */
import { request } from '../api/client';
import { asId, asPositiveInteger } from '../utils/dataTypes';

function requireId(value, field = 'product id') {
  const id = asId(value);
  if (!id) throw new TypeError(`A valid ${field} is required.`);
  return id;
}

export const cartService = {
  get: () => request('GET', '/cart'),
  clear: () => request('DELETE', '/cart'),

  addItem: (productId, quantity) =>
    request('POST', '/cart/items', {
      product_id: requireId(productId),
      quantity: asPositiveInteger(quantity),
    }),

  updateItem: (productId, quantity) =>
    request('PUT', `/cart/items/${encodeURIComponent(requireId(productId))}`, {
      quantity: asPositiveInteger(quantity),
    }),

  removeItem: (productId) =>
    request('DELETE', `/cart/items/${encodeURIComponent(requireId(productId))}`),
};
