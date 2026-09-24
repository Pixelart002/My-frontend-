import { CURRENCY } from '../config/env';

const currency = String(CURRENCY ?? '')
  .trim()
  .toUpperCase();

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
});

/**
 * Format a finite numeric value as currency.
 *
 * Business amounts must come from the backend.
 * This utility only controls presentation.
 *
 * Invalid / missing values return an em dash instead
 * of silently displaying a misleading zero amount.
 */
export function formatMoney(
  value,
  opts = {},
) {
  const num =
    typeof value === 'number' ?
    value :
    typeof value === 'string' &&
    value.trim() !== '' ?
    Number(value) :
    NaN;
  
  if (!Number.isFinite(num)) {
    return '—';
  }
  
  if (
    opts?.whole === true ||
    Number.isInteger(num)
  ) {
    return inrWhole.format(num);
  }
  
  return inr.format(num);
}