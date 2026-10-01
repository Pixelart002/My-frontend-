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
        className="inline-flex size-5 items-center justify-center text-gold"
        role="status"
        aria-label={label}
      >
        <RiLoader4Line
          className="animate-spin"
          size={18}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <div
      className="flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-surface px-5 py-10 text-center shadow-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="relative flex size-12 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border border-line" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin motion-reduce:animate-none" />
        <RiLoader4Line
          className="text-gold"
          size={19}
          aria-hidden="true"
        />
      </span>

      <span className="space-y-1">
        <strong className="block font-display text-sm font-semibold tracking-[0.16em] text-text">
          LUVIIO
        </strong>
        <span className="block text-xs font-medium text-muted">
          {label}
        </span>
      </span>
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
      className="flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface px-5 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gold-dim text-gold" aria-hidden="true">
        <RiStore2Line size={22} />
      </div>

      <div className="mt-4 max-w-md">
        <h2 className="text-lg font-bold text-text">{title}</h2>

        {message && (
          <p className="mt-1.5 text-sm leading-6 text-muted">
            {message}
          </p>
        )}

        {action && (
          <div className="mt-5">
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
      className="flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-danger/25 bg-danger-dim px-5 py-10 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger" aria-hidden="true">
        <RiErrorWarningLine size={22} />
      </div>

      <div className="mt-4 max-w-md">
        <h2 className="text-lg font-bold text-text">
          We ran into a problem
        </h2>

        <p className="mt-1.5 text-sm leading-6 text-muted">
          {message}
        </p>

        {typeof onRetry === 'function' && (
          <div className="mt-5">
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              onClick={onRetry}
            >
              <RiRefreshLine size={16} aria-hidden="true" />
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
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from(
        { length: safeCount },
        (_, index) => (
          <div
            key={`product-skeleton-${index}`}
            className="overflow-hidden rounded-2xl border border-line bg-surface"
            aria-hidden="true"
          >
            <div className="aspect-square animate-pulse bg-surface-2 motion-reduce:animate-none" />
            <div className="space-y-2 p-3.5 sm:p-4">
              <div className="h-3.5 w-4/5 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none" />
              <div className="h-3 w-2/5 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none" />
              <div className="mt-3 h-5 w-1/2 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}