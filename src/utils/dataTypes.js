/**
 * Shared runtime data-type guards/coercers for the frontend/backend boundary.
 *
 * Rules:
 * - IDs, slugs, codes, postal codes and phone numbers stay strings.
 * - Quantities/pages/limits are finite integers.
 * - Money/rates are finite numbers; callers must decide whether null is valid.
 * - Booleans accept only real booleans or explicit true/false strings.
 * - Never use `Number(value) || fallback` for identifiers or optional numeric fields.
 */

export function asString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function asTrimmedString(value, fallback = '') {
  return asString(value, fallback).trim();
}

export function asId(value) {
  const id = asTrimmedString(value);
  return id || null;
}

export function asFiniteNumber(value, fallback = null) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function asInteger(value, fallback = null) {
  const number = asFiniteNumber(value, null);
  return number === null ? fallback : Math.trunc(number);
}

export function asPositiveInteger(value, fallback = 1) {
  const number = asInteger(value, null);
  return number !== null && number > 0 ? number : fallback;
}

export function asNonNegativeNumber(value, fallback = 0) {
  const number = asFiniteNumber(value, null);
  return number !== null && number >= 0 ? number : fallback;
}

export function asBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function asObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
