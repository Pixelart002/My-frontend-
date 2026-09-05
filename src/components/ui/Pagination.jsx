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

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="page-btn"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <RiArrowLeftSLine size={16} />
      </button>

      {pageNumbers(page, totalPages).map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="dim-text">…</span>
        ) : (
          <button
            key={item}
            className={`page-btn ${item === page ? 'is-active' : ''}`}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        className="page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <RiArrowRightSLine size={16} />
      </button>
    </nav>
  );
}
