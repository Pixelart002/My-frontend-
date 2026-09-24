/**
 * Shipping service — real backend/provider rate endpoint.
 *
 * Backend remains authoritative for:
 * - courier availability
 * - shipping rate
 * - COD charges
 * - declared-value rules
 * - weight validation
 * - final shipping amount
 *
 * Frontend performs input validation only.
 */
import { request } from '../api/client';

function requirePostcode(value) {
  const postcode =
    String(value ?? '').trim();

  if (!postcode) {
    throw new TypeError(
      'A valid delivery postcode is required.',
    );
  }

  return postcode;
}

function requireWeight(value) {
  const weight =
    Number(value);

  if (
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    throw new TypeError(
      'A valid shipment weight is required.',
    );
  }

  return weight;
}

function optionalDeclaredValue(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const declaredValue =
    Number(value);

  if (
    !Number.isFinite(
      declaredValue,
    ) ||
    declaredValue < 0
  ) {
    throw new TypeError(
      'A valid declared value is required.',
    );
  }

  return declaredValue;
}

export const shippingService = {
  providerRate: ({
    deliveryPostcode,
    weightKg,
    cod = false,
    declaredValue = null,
  } = {}) => {
    const postcode =
      requirePostcode(
        deliveryPostcode,
      );

    const weight =
      requireWeight(weightKg);

    const value =
      optionalDeclaredValue(
        declaredValue,
      );

    const params =
      new URLSearchParams({
        delivery_postcode:
          postcode,

        weight_kg:
          String(weight),

        cod:
          String(Boolean(cod)),
      });

    if (value !== null) {
      params.set(
        'declared_value',
        String(value),
      );
    }

    return request(
      'GET',
      `/shipping/provider/rate?${params.toString()}`,
    );
  },
};