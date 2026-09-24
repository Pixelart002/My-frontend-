import {
  RiLoader4Line,
  RiStore2Line,
  RiErrorWarningLine,
  RiRefreshLine,
} from '@remixicon/react';

const clampCount = (value, fallback = 8) => {
  const parsed = Number(value);
  
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  
  return Math.min(24, Math.max(1, Math.floor(parsed)));
};

export function Spinner({
  label = 'Getting things ready…',
  inline = false,
}) {
  if (inline) {
    return (
      <span
        className="spinner-inline"
        role="status"
        aria-label={label}
      >
        <RiLoader4Line
          className="spin"
          size={18}
          aria-hidden="true"
        />
      </span>
    );
  }
  
  return (
    <div
      className="state state--loading"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="spinner-orbit" aria-hidden="true">
        <span className="spinner-orbit-ring" />
        <RiLoader4Line
          className="spin spinner-core"
          size={19}
        />
      </div>

      <div className="spinner-copy">
        <strong>LUVIIO</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  message,
  action,
}) {
  return (
    <div
      className="state state--empty"
      role="status"
      aria-live="polite"
    >
      <div className="state-icon" aria-hidden="true">
        <RiStore2Line size={22} />
      </div>

      <div className="state-content">
        <h2 className="state-title">{title}</h2>

        {message && (
          <p className="state-message">
            {message}
          </p>
        )}

        {action && (
          <div className="state-action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}) {
  return (
    <div
      className="state state--error"
      role="alert"
      aria-live="assertive"
    >
      <div className="state-icon" aria-hidden="true">
        <RiErrorWarningLine size={22} />
      </div>

      <div className="state-content">
        <h2 className="state-title">
          We ran into a problem
        </h2>

        <p className="state-message">
          {message}
        </p>

        {typeof onRetry === 'function' && (
          <div className="state-action">
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={onRetry}
            >
              <RiRefreshLine
                size={15}
                aria-hidden="true"
              />
              <span>Try again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductSkeletons({
  count = 8,
}) {
  const safeCount = clampCount(count);
  
  return (
    <div
      className="products-grid products-grid--loading"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from(
        { length: safeCount },
        (_, index) => (
          <div
            key={`product-skeleton-${index}`}
            className="product-card product-card--skeleton"
            aria-hidden="true"
          >
            <div className="skeleton skeleton-media" />

            <div className="skeleton-content">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}