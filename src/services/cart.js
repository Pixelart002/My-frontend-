/**
 * Cart service — real backend endpoints. The backend computes all totals
 * (subtotal, tax, shipping, free-shipping threshold) and returns them in the
 * cart response, so the UI never does pricing math itself.
 */
import { request } from '../api/client';

export const cartService = {
  get: () => request('GET', '/cart'),
  clear: () => request('DELETE', '/cart'),
  addItem: (productId, quantity) =>
    request('POST', '/cart/items', { product_id: productId, quantity }),
  updateItem: (productId, quantity) =>
    request('PUT', `/cart/items/${encodeURIComponent(productId)}`, { quantity }),
  removeItem: (productId) => request('DELETE', `/cart/items/${encodeURIComponent(productId)}`),
};
