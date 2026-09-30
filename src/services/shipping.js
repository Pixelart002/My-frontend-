/**
 * Shipping service — Luviio manual shipping.
 *
 * Checkout pricing is owned by the backend. This helper only mirrors the
 * configured storefront policy for UI previews; it never calls a courier API.
 */

const FREE_SHIPPING_THRESHOLD = 1499;
const FLAT_SHIPPING_RATE = 45.9;

export const shippingService = {
  manualRate: (subtotal = 0) => {
    const value = Number(subtotal) || 0;

    return {
      shipping_cost:
        value >= FREE_SHIPPING_THRESHOLD
          ? 0
          : FLAT_SHIPPING_RATE,
      courier_name: 'Manual shipping',
      service_type: 'manual',
      delivery_mode: 'manual',
      free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    };
  },
};
