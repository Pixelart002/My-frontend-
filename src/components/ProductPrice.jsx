import { formatMoney } from '../utils/format';

function finitePrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Shared product pricing UI.
 * Keeps selling price, compare-at price, discount and savings consistent
 * anywhere product pricing is rendered.
 */
export default function ProductPrice({
  price,
  comparePrice,
  variant = 'card',
  showSavings = true,
}) {
  const current = finitePrice(price);
  const compare = finitePrice(comparePrice);
  const hasCompare = current > 0 && compare > current;
  const savings = hasCompare ? compare - current : 0;
  const discount = hasCompare
    ? Math.round((savings / compare) * 100)
    : 0;

  if (variant === 'detail') {
    return (
      <div className="product-price">
        <span className="now">{formatMoney(current)}</span>
        {hasCompare && (
          <span className="was">{formatMoney(compare)}</span>
        )}
        {discount > 0 && (
          <span className="save">Save {discount}%</span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 grid min-w-0 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="shrink-0 text-[15px] font-bold tabular-nums tracking-[-0.02em] text-gold-soft sm:text-base">
          {formatMoney(current)}
        </span>
        {hasCompare && (
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-dim line-through sm:text-xs">
            {formatMoney(compare)}
          </span>
        )}
      </div>

      {discount > 0 ? (
        <span className="inline-flex min-h-7 max-w-full items-center justify-center whitespace-nowrap rounded-full border border-success/25 bg-success-dim px-2.5 py-1 text-[9px] font-bold uppercase leading-none tracking-[0.035em] text-success sm:text-[10px]">
          {discount}% off
        </span>
      ) : (
        <span aria-hidden="true" />
      )}

      {showSavings && (
        <p className={`col-span-2 m-0 min-h-4 text-[11px] leading-4 text-muted${savings > 0 ? '' : ' invisible'}`} aria-hidden={savings <= 0}>
          You save {formatMoney(savings)}
        </p>
      )}
    </div>
  );
}
