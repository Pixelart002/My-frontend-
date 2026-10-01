import { useMemo } from 'react';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from '@remixicon/react';

const ELLIPSIS = 'ellipsis';

function buildPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    current - 1,
    current,
    current + 1,
    total - 1,
    total,
  ]);

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b);

  const result = [];
  let previous = null;

  for (const value of sorted) {
    if (previous !== null && value - previous > 1) {
      result.push(ELLIPSIS);
    }

    result.push(value);
    previous = value;
  }

  return result;
}

export default function Pagination({
  page = 1,
  totalPages = 0,
  onChange,
}) {
  const total = Math.max(
    0,
    Number.isFinite(Number(totalPages)) ? Number(totalPages) : 0,
  );

  const current = Math.min(
    Math.max(Number(page) || 1, 1),
    Math.max(total, 1),
  );

  const items = useMemo(
    () => buildPageItems(current, total),
    [current, total],
  );

  if (total <= 1 || typeof onChange !== 'function') {
    return null;
  }

  const change = (nextPage) => {
    const next = Math.min(
      total,
      Math.max(1, Number(nextPage) || 1),
    );

    if (next !== current) {
      onChange(next);
    }
  };

  const previousDisabled = current <= 1;
  const nextDisabled = current >= total;

  return (
    <nav
      className="rounded-2xl border border-line bg-surface p-3 shadow-sm sm:p-4"
      aria-label="Orders pagination"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-text sm:min-h-11 sm:min-w-11"
          onClick={() => change(current - 1)}
          disabled={previousDisabled}
          aria-label="Go to previous page"
        >
          <RiArrowLeftSLine size={19} aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="min-w-0 text-center">
          <p className="text-sm font-bold tabular-nums text-text">
            Page {current} <span className="font-medium text-muted">of {total}</span>
          </p>
          <p className="mt-0.5 hidden text-xs text-muted sm:block">
            Choose a page to view more orders
          </p>
        </div>

        <button
          type="button"
          className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-text sm:min-h-11 sm:min-w-11"
          onClick={() => change(current + 1)}
          disabled={nextDisabled}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <RiArrowRightSLine size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 hidden items-center justify-center gap-1.5 border-t border-line pt-3 sm:flex" role="list" aria-label="Page numbers">
        {items.map((item, index) => {
          if (item === ELLIPSIS) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex size-10 items-center justify-center text-sm text-muted"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const active = item === current;

          return (
            <button
              key={item}
              type="button"
              className={`inline-flex size-10 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                active
                  ? 'bg-gold text-gold-ink shadow-sm'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              }`}
              onClick={() => change(item)}
              aria-current={active ? 'page' : undefined}
              aria-label={active ? `Page ${item}, current page` : `Go to page ${item}`}
              role="listitem"
            >
              {item}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
