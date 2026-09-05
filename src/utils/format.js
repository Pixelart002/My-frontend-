import { CURRENCY } from '../config/env';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

/** Format a number as INR; uses whole-currency (no paise) when the value is an integer. */
export function formatMoney(value, opts = {}) {
  const num = Number(value) || 0;
  if (opts.whole || Number.isInteger(num)) return inrWhole.format(num);
  return inr.format(num);
}
