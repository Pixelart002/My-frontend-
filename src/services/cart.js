/**
 * Cart service — real backend endpoints only.
 *
 * Pricing authority:
 * - subtotal: backend
 * - tax: backend
 * - shipping: backend
 * - free-shipping threshold: backend
 * - final total: backend
 *
 * This service performs transport/input validation only.
 * It never calculates cart prices or totals.
 */
import { request } from '../api/client';
import {
  asId,
  asPositiveInteger,
} from '../utils/dataTypes';

function requireId(
  value,
  field = 'product id',
) {
  const id = asId(value);

  if (!id) {
    throw new TypeError(
      `A valid ${field} is required.`,
    );
  }

  return id;
}

function requireQuantity(
  value,
) {
  const quantity =
    asPositiveInteger(value);

  if (!quantity) {
    throw new TypeError(
      'A valid positive quantity is required.',
    );
  }

  return quantity;
}

export const cartService = {
  get: () =>
    request(
      'GET',
      '/cart',
    ),

  clear: () =>
    request(
      'DELETE',
      '/cart',
    ),

  addItem: (
    productId,
    quantity,
  ) =>
    request(
      'POST',
      '/cart/items',
      {
        product_id: requireId(
          productId,
        ),
        quantity:
          requireQuantity(
            quantity,
          ),
      },
    ),

  updateItem: (
    productId,
    quantity,
  ) =>
    request(
      'PUT',
      `/cart/items/${encodeURIComponent(
        requireId(productId),
      )}`,
      {
        quantity:
          requireQuantity(
            quantity,
          ),
      },
    ),

  removeItem: (
    productId,
  ) =>
    request(
      'DELETE',
      `/cart/items/${encodeURIComponent(
        requireId(productId),
      )}`,
    ),
};