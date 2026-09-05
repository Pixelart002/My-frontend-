import { LoaderCircle, PackageOpen, AlertTriangle } from 'lucide-react';

export function Spinner({ label = 'Loading…', inline = false }) {
  if (inline) return <LoaderCircle className="spin" size={18} />;
  return (
    <div className="state spinner">
      <LoaderCircle className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="state">
      <PackageOpen size={34} />
      <div className="state-title">{title}</div>
      {message && <p style={{ margin: 0 }}>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state">
      <AlertTriangle size={30} />
      <div className="state-title">We ran into a problem</div>
      <p style={{ margin: 0 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-quiet btn-sm" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

/** Product-card skeletons for initial load. */
export function ProductSkeletons({ count = 8 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card">
          <div className="skeleton skeleton-media" />
          <div className="skeleton skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        </div>
      ))}
    </div>
  );
}
