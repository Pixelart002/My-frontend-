import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({ page = 1, totalPages = 0, onChange }) {
  const total = Math.max(0, Number(totalPages) || 0);
  const current = Math.min(total || 1, Math.max(1, Number(page) || 1));
  if (total <= 1 || typeof onChange !== 'function') return null;

  const change = (next) => onChange(Math.min(total, Math.max(1, next)));

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        onClick={() => change(current - 1)}
        disabled={current <= 1}
        aria-label="Previous page"
      >
        <RiArrowLeftSLine size={16} aria-hidden="true" />
      </button>

      {pageNumbers(current, total).map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="dim-text" aria-hidden="true">…</span>
        ) : (
          <button
            type="button"
            key={item}
            className={`page-btn ${item === current ? 'is-active' : ''}`}
            onClick={() => change(item)}
            aria-current={item === current ? 'page' : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="page-btn"
        onClick={() => change(current + 1)}
        disabled={current >= total}
        aria-label="Next page"
      >
        <RiArrowRightSLine size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
