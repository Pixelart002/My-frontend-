import { RiLoader4Line, RiStore2Line, RiErrorWarningLine } from '@remixicon/react';

export function Spinner({ label = 'Loading…', inline = false }) {
  if (inline) {
    return <RiLoader4Line className="spin" size={18} aria-hidden="true" />;
  }

  return (
    <div className="state spinner" role="status" aria-live="polite">
      <RiLoader4Line className="spin" size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="state" role="status">
      <RiStore2Line size={34} aria-hidden="true" />
      <div className="state-title">{title}</div>
      {message && <p className="state-message">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state" role="alert">
      <RiErrorWarningLine size={30} aria-hidden="true" />
      <div className="state-title">We ran into a problem</div>
      <p className="state-message">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-quiet btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ProductSkeletons({ count = 8 }) {
  const safeCount = Math.min(24, Math.max(1, Number(count) || 8));

  return (
    <div className="products-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: safeCount }, (_, i) => (
        <div key={i} className="product-card" aria-hidden="true">
          <div className="skeleton skeleton-media" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
  );
}
