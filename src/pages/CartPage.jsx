import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiLockLine,
  RiLoader4Line,
  RiSubtractLine,
  RiTruckLine,
} from '@remixicon/react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import {
  EmptyState,
  ErrorState,
  Spinner,
} from '../components/ui/States';

const pageShell =
  'mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8 lg:pb-24 lg:pt-10';

const mutedText =
  'text-sm leading-6 text-muted';

function QuantityEditor({ item, disabled, onUpdate }) {
  const [value, setValue] = useState(String(item.quantity));
  const quantity = Number(item.quantity) || 1;
  const stock = Number(item.stock);
  const max =
    Number.isFinite(stock) && stock > 0
      ? stock
      : 9999;

  useEffect(() => {
    setValue(String(item.quantity));
  }, [item.quantity]);

  const commit = (requested) => {
    const parsed = Number.parseInt(requested, 10);
    const next = Math.min(
      max,
      Math.max(1, Number.isFinite(parsed) ? parsed : 1),
    );

    setValue(String(next));

    if (next !== quantity) {
      onUpdate(next);
    }
  };

  return (
    <div
      className={[
        'inline-flex h-10 items-center overflow-hidden rounded-xl border border-line bg-bg',
        disabled ? 'opacity-60' : '',
      ].join(' ')}
      aria-label={`Quantity for ${item.name || 'product'}`}
    >
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => commit(quantity - 1)}
        disabled={disabled || quantity <= 1}
        aria-label={`Decrease quantity for ${item.name || 'product'}`}
      >
        <RiSubtractLine size={15} aria-hidden="true" />
      </button>

      <span
        className="flex h-10 min-w-11 items-center justify-center border-x border-line px-2 text-sm font-semibold tabular-nums text-text"
        aria-live="polite"
        aria-atomic="true"
      >
        {value || '1'}
      </span>

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => commit(quantity + 1)}
        disabled={disabled || quantity >= max}
        aria-label={`Increase quantity for ${item.name || 'product'}`}
      >
        <RiAddLine size={15} aria-hidden="true" />
      </button>

      {disabled && (
        <RiLoader4Line
          className="mr-2 animate-spin text-gold"
          size={13}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function CartHeader({ description }) {
  return (
    <header className="mb-8 min-w-0 sm:mb-10">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
        Your selection
      </p>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-text sm:text-4xl lg:text-5xl">
            Your Cart
          </h1>
          <p className={`mt-2 max-w-2xl ${mutedText}`}>
            {description}
          </p>
        </div>
      </div>
    </header>
  );
}

function CartItem({ item, actionBusy, updating, removing, onQuantity, onRemove }) {
  const unavailable = !item.in_stock || item.is_active === false;
  const productPath = `/product/${item.slug || item.product_id}`;
  const itemBusy = updating || removing;

  return (
    <article
      className={[
        'group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-b border-line p-4 transition-colors sm:gap-5 sm:p-5',
        'last:border-b-0 hover:bg-surface-2/30',
        unavailable ? 'bg-danger-dim/40' : '',
      ].join(' ')}
      aria-busy={itemBusy}
    >
      <Link
        to={productPath}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-bg sm:h-24 sm:w-24"
        aria-label={`View ${item.name || 'product'}`}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name || 'Product'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="text-lg font-semibold text-dim" aria-hidden="true">
            {(item.name || 'L').slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
              {item.hsn_code ? `HSN ${item.hsn_code}` : 'Product'}
            </p>
            <h2 className="min-w-0 text-sm font-semibold leading-5 text-text sm:text-base">
              <Link
                to={productPath}
                className="line-clamp-2 transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {item.name || 'Product'}
              </Link>
            </h2>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-dim hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            onClick={() => onRemove(item.product_id)}
            disabled={actionBusy}
            aria-label={`Remove ${item.name || 'product'}`}
            aria-busy={removing}
          >
            {removing ? (
              <RiLoader4Line className="animate-spin" size={17} aria-hidden="true" />
            ) : (
              <RiDeleteBinLine size={17} aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-medium text-muted">
            {formatMoney(item.unit_price)} each
          </span>

          {unavailable && (
            <span className="rounded-full border border-danger/40 bg-danger-dim px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-danger">
              Unavailable
            </span>
          )}

          {item.price_changed && (
            <span className="rounded-full border border-warn/40 bg-warn/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-warn">
              Price updated
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <QuantityEditor
            item={item}
            disabled={unavailable || actionBusy}
            onUpdate={(quantity) => onQuantity(item.product_id, quantity)}
          />

          <strong className="text-sm font-semibold tabular-nums text-text sm:text-base">
            {formatMoney(item.line_total)}
          </strong>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true" />
    </article>
  );
}

function OrderSummary({ cart, disabled, onCheckout }) {
  return (
    <aside
      className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6"
      aria-label="Order summary"
    >
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Order summary
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-text">
          Review & checkout
        </h2>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4 text-muted">
          <dt>Subtotal</dt>
          <dd className="font-medium tabular-nums text-text">
            {formatMoney(cart.subtotal)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 text-muted">
          <dt>Taxes</dt>
          <dd className="font-medium tabular-nums text-text">
            {formatMoney(cart.tax_amount)}
          </dd>
        </div>

        <div className="flex items-start justify-between gap-4 text-muted">
          <dt>Shipping</dt>
          <dd className="max-w-[160px] text-right text-xs leading-5 text-dim">
            Calculated at checkout
          </dd>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
          <dt className="text-sm font-semibold text-text">Before shipping</dt>
          <dd className="text-lg font-bold tabular-nums text-text">
            {formatMoney(cart.total_amount)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex gap-3 rounded-xl border border-gold bg-gold-dim px-3.5 py-3 text-xs leading-5 text-gold-soft">
        <RiTruckLine className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
        <p>
          Live shipping is calculated at checkout after your delivery PIN is selected.
        </p>
      </div>

      <button
        type="button"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[0.06em] text-gold-ink shadow-sm transition-[transform,background-color,box-shadow] hover:bg-gold-soft hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
        onClick={onCheckout}
        disabled={disabled}
      >
        <RiLockLine size={17} aria-hidden="true" />
        Checkout securely
        <RiArrowRightLine size={17} aria-hidden="true" />
      </button>

      <p className="mt-3 text-center text-[11px] leading-5 text-dim">
        Secure checkout · Payment details are protected.
      </p>
    </aside>
  );
}

export default function CartPage() {
  const {
    cart,
    loading,
    error,
    updateItem,
    removeItem,
    clearCart,
    reload,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const items = cart?.items || [];

  const handleQuantity = useCallback(
    async (productId, quantity) => {
      if (!productId || updatingId || removingId || clearing) return;

      setUpdatingId(productId);
      try {
        await updateItem(productId, quantity);
      } finally {
        setUpdatingId(null);
      }
    },
    [clearing, removingId, updateItem, updatingId],
  );

  const handleRemove = useCallback(
    async (productId) => {
      if (!productId || updatingId || removingId || clearing) return;

      setRemovingId(productId);
      try {
        await removeItem(productId);
      } finally {
        setRemovingId(null);
      }
    },
    [clearing, removeItem, removingId, updatingId],
  );

  const handleClear = useCallback(
    async () => {
      if (clearing || updatingId || removingId || items.length === 0) return;

      setClearing(true);
      try {
        await clearCart();
      } finally {
        setClearing(false);
      }
    },
    [clearing, clearCart, items.length, removingId, updatingId],
  );

  const hasUnavailableItems =
    Boolean(cart?.has_unavailable_items) ||
    items.some((item) => !item.in_stock || item.is_active === false);

  const actionBusy =
    loading || Boolean(updatingId) || Boolean(removingId) || clearing;

  if (!isAuthenticated) {
    return (
      <main className={pageShell}>
        <CartHeader description="Sign in to view and manage the items saved to your bag." />
        <EmptyState
          title="Your bag is waiting"
          message="Sign in to see the items in your bag."
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              to="/login"
            >
              Sign in
            </Link>
          }
        />
      </main>
    );
  }

  if (loading && items.length === 0) {
    return (
      <main className={pageShell}>
        <CartHeader description="Loading your saved items…" />
        <Spinner label="Loading your bag…" />
      </main>
    );
  }

  if (error && items.length === 0) {
    return (
      <main className={pageShell}>
        <CartHeader description="We couldn't load your saved items." />
        <ErrorState message={error} onRetry={reload} />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={pageShell}>
        <CartHeader description="Your bag is ready when you are." />
        <EmptyState
          title="Your bag is empty"
          message="Explore the shop and add something you need."
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              to="/shop"
            >
              Continue shopping
              <RiArrowRightLine size={16} aria-hidden="true" />
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className={pageShell}>
      <div className="mb-5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-muted transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          to="/shop"
        >
          <RiArrowLeftLine size={17} aria-hidden="true" />
          Continue shopping
        </Link>
      </div>

      <CartHeader description="Review your items, adjust quantities, and continue when everything looks right." />

      {error && (
        <div
          className="mb-5 flex min-w-0 items-start gap-3 rounded-xl border border-danger/40 bg-danger-dim px-4 py-3 text-sm leading-6 text-danger"
          role="alert"
        >
          <span className="min-w-0">{error}</span>
        </div>
      )}

      {hasUnavailableItems && (
        <div
          className="mb-5 flex min-w-0 items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm leading-6 text-warn"
          role="alert"
        >
          <span className="min-w-0">
            Some items are no longer available. Remove unavailable items before checkout.
          </span>
        </div>
      )}

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        <section
          className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface"
          aria-label="Cart items"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-text">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </h2>
              <p className="mt-1 text-xs text-dim">
                Quantities and availability are checked by the store.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleClear}
              disabled={actionBusy}
              aria-busy={clearing}
            >
              {clearing ? (
                <RiLoader4Line className="animate-spin" size={15} aria-hidden="true" />
              ) : (
                <RiDeleteBinLine size={15} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {clearing ? 'Clearing…' : 'Clear bag'}
              </span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>

          <div>
            {items.map((item) => (
              <CartItem
                key={item.product_id || item.id}
                item={item}
                actionBusy={actionBusy}
                updating={updatingId === item.product_id}
                removing={removingId === item.product_id}
                onQuantity={handleQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <div className="border-t border-line bg-bg/40 px-4 py-4 sm:px-5">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold text-muted transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              to="/shop"
            >
              Keep shopping
              <RiArrowRightLine size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <div className="min-w-0 lg:sticky lg:top-24">
          <OrderSummary
            cart={cart}
            disabled={actionBusy || hasUnavailableItems}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </main>
  );
}
