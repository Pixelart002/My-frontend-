import { useEffect, useMemo, useRef } from 'react';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from '@remixicon/react';

const ELLIPSIS = 'ellipsis';

function buildPageItems(current, total) {
  if (total <= 7) {
    return Array.from(
      { length: total },
      (_, index) => index + 1,
    );
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
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result = [];
  let previous = null;

  for (const page of sorted) {
    if (
      previous !== null &&
      page - previous > 1
    ) {
      result.push(ELLIPSIS);
    }

    result.push(page);
    previous = page;
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
    Number.isFinite(Number(totalPages))
      ? Number(totalPages)
      : 0,
  );

  const current = Math.min(
    Math.max(Number(page) || 1, 1),
    Math.max(total, 1),
  );

  const previousPageRef = useRef(current);

  const items = useMemo(
    () => buildPageItems(current, total),
    [current, total],
  );

  useEffect(() => {
    previousPageRef.current = current;
  }, [current]);

  if (
    total <= 1 ||
    typeof onChange !== 'function'
  ) {
    return null;
  }

  const change = (nextPage) => {
    const next = Math.min(
      total,
      Math.max(1, Number(nextPage) || 1),
    );

    if (next === current) return;

    onChange(next);
  };

  const goPrevious = () => {
    if (current > 1) {
      change(current - 1);
    }
  };

  const goNext = () => {
    if (current < total) {
      change(current + 1);
    }
  };

  return (
    <nav
      className="pagination"
      aria-label="Pagination"
      aria-describedby="pagination-status"
    >
      <button
        type="button"
        className="page-btn page-btn--arrow"
        onClick={goPrevious}
        disabled={current <= 1}
        aria-label="Go to previous page"
      >
        <RiArrowLeftSLine
          size={18}
          aria-hidden="true"
        />
      </button>

      <span
        id="pagination-status"
        className="pagination-mobile-status"
        aria-live="polite"
      >
        {current} / {total}
      </span>

      <div
        className="pagination-pages"
        role="list"
        aria-label="Page numbers"
      >
        {items.map((item, index) => {
          if (item === ELLIPSIS) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="page-gap"
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
              role="listitem"
              className={`page-btn ${
                active ? 'is-active' : ''
              }`}
              onClick={() => change(item)}
              aria-current={
                active ? 'page' : undefined
              }
              aria-label={
                active
                  ? `Page ${item}, current page`
                  : `Go to page ${item}`
              }
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="page-btn page-btn--arrow"
        onClick={goNext}
        disabled={current >= total}
        aria-label="Go to next page"
      >
        <RiArrowRightSLine
          size={18}
          aria-hidden="true"
        />
      </button>
    </nav>
  );
}