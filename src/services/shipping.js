import { request } from '../api/client';

export const shippingService = {
  providerRate: ({ deliveryPostcode, weightKg, cod = false, declaredValue = null }) =>
    request('GET', '/shipping/provider/rate?' + new URLSearchParams({
      delivery_postcode: String(deliveryPostcode || ''),
      weight_kg: String(weightKg || ''),
      cod: String(Boolean(cod)),
      ...(declaredValue !== null ? { declared_value: String(declaredValue) } : {}),
    }).toString()),
};