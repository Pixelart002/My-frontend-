import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiLockLine,
  RiLoader4Line,
  RiSubtractLine,
  RiTruckLine,
} from '@remixicon/react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';
import {
  EmptyState,
  ErrorState,
  Spinner,
} from '../components/ui/States';

function QuantityEditor({
  item,
  disabled,
  onUpdate,
}) {
  const [value, setValue] = useState(
    String(item.quantity),
  );

  useEffect(() => {
    setValue(String(item.quantity));
  }, [item.quantity]);

  const stock = Number(item.stock);
  const max =
    Number.isFinite(stock) && stock > 0
      ? stock
      : 9999;

  const commit = (requested) => {
    const parsed = Number.parseInt(
      requested,
      10,
    );

    const next = Math.min(
      max,
      Math.max(
        1,
        Number.isFinite(parsed) ? parsed : 1,
      ),
    );

    setValue(String(next));

    if (next !== Number(item.quantity)) {
      onUpdate(next);
    }
  };

  const quantity = Number(item.quantity) || 1;

  return (
    <div
      className={`qty-stepper cart-qty ${
        disabled ? 'is-updating' : ''
      }`}
      aria-label={`Quantity for ${
        item.name || 'product'
      }`}
    >
      <button
        type="button"
        onClick={() =>
          commit(quantity - 1)
        }
        disabled={
          disabled || quantity <= 1
        }
        aria-label={`Decrease quantity for ${
          item.name || 'product'
        }`}
      >
        <RiSubtractLine
          size={15}
          aria-hidden="true"
        />
      </button>

      <span
        className="cart-qty-value inline-flex min-w-12 items-center justify-center text-sm font-semibold tabular-nums text-text"
        aria-live="polite"
        aria-atomic="true"
      >
        {value || '1'}
      </span>

      <button
        type="button"
        onClick={() =>
          commit(quantity + 1)
        }
        disabled={
          disabled || quantity >= max
        }
        aria-label={`Increase quantity for ${
          item.name || 'product'
        }`}
      >
        <RiAddLine
          size={15}
          aria-hidden="true"
        />
      </button>

      {disabled && (
        <RiLoader4Line
          className="cart-qty-spinner spin animate-spin text-gold"
          size={13}
          aria-hidden="true"
        />
      )}
    </div>
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

  const [updatingId, setUpdatingId] =
    useState(null);
  const [removingId, setRemovingId] =
    useState(null);
  const [clearing, setClearing] =
    useState(false);

  const items = cart?.items || [];

  const handleQuantity = useCallback(
    async (productId, quantity) => {
      if (
        !productId ||
        updatingId ||
        removingId ||
        clearing
      ) {
        return;
      }

      setUpdatingId(productId);

      try {
        await updateItem(
          productId,
          quantity,
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [
      clearing,
      removingId,
      updateItem,
      updatingId,
    ],
  );

  const handleRemove = useCallback(
    async (productId) => {
      if (
        !productId ||
        updatingId ||
        removingId ||
        clearing
      ) {
        return;
      }

      setRemovingId(productId);

      try {
        await removeItem(productId);
      } finally {
        setRemovingId(null);
      }
    },
    [
      clearing,
      removeItem,
      removingId,
      updatingId,
    ],
  );

  const handleClear = useCallback(
    async () => {
      if (
        clearing ||
        updatingId ||
        removingId ||
        items.length === 0
      ) {
        return;
      }

      setClearing(true);

      try {
        await clearCart();
      } finally {
        setClearing(false);
      }
    },
    [
      clearing,
      clearCart,
      items.length,
      removingId,
      updatingId,
    ],
  );

  if (!isAuthenticated) {
    return (
      <div className="page container cart-page mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4">
        <div className="cart-page-heading mb-7 min-w-0">
          <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
            Your selection
          </p>

          <h1>Your Cart</h1>

          <p>
            Review your items before checkout.
          </p>
        </div>

        <EmptyState
          title="Your bag is waiting"
          message="Sign in to see the items in your bag."
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
              to="/login"
            >
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  if (
    loading &&
    items.length === 0
  ) {
    return (
      <div className="page container cart-page mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4">
        <Spinner label="Loading your bag…" />
      </div>
    );
  }

  if (
    error &&
    items.length === 0
  ) {
    return (
      <div className="page container cart-page mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4">
        <div className="cart-page-heading mb-7 min-w-0">
          <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
            Your selection
          </p>

          <h1>Your Cart</h1>

          <p>
            Review your items before checkout.
          </p>
        </div>

        <ErrorState
          message={error}
          onRetry={reload}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page container cart-page mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4">
        <div className="cart-page-heading mb-7 min-w-0">
          <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
            Your selection
          </p>

          <h1>Your Cart</h1>

          <p>
            Your bag is ready when you are.
          </p>
        </div>

        <EmptyState
          title="Your bag is empty"
          message="Find something good to add."
          action={
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-gold px-4 text-xs font-bold text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
              to="/shop"
            >
              Continue shopping
              <RiArrowRightLine
                size={16}
                aria-hidden="true"
              />
            </Link>
          }
        />
      </div>
    );
  }

  const hasUnavailableItems =
    Boolean(cart?.has_unavailable_items) ||
    items.some(
      (item) =>
        !item.in_stock ||
        item.is_active === false,
    );

  const actionBusy =
    loading ||
    Boolean(updatingId) ||
    Boolean(removingId) ||
    clearing;

  return (
    <div className="page container cart-page mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(48px,7vw,96px)] max-[760px]:px-[18px] max-[760px]:pt-10 max-[760px]:pb-16 max-[480px]:px-4">
      <Link
        className="cart-back mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-transparent px-2 text-xs font-semibold text-muted transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        to="/shop"
      >
        <RiArrowLeftLine
          size={17}
          aria-hidden="true"
        />
        Continue shopping
      </Link>

      <div className="cart-page-heading mb-7 min-w-0">
        <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
          Your selection
        </p>

        <h1>Your Cart</h1>

        <p>
          Review your items before checkout.
        </p>
      </div>

      {error && (
        <div
          className="notice error cart-action-notice mb-5 flex min-w-0 items-start gap-3 rounded-xl border border-danger bg-danger-dim px-3.5 py-3 text-sm leading-6 text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="cart-layout cart-layout-refined grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(300px,380px)] items-start gap-6 max-[900px]:grid-cols-1">
        <section
          className="cart-items min-w-0 overflow-hidden rounded-2xl border border-line bg-surface"
          aria-label="Cart items"
        >
          {hasUnavailableItems && (
            <div
              className="notice warn mb-4 rounded-xl border border-[rgb(224_169_82_/_0.5)] bg-[rgb(224_169_82_/_0.08)] px-3.5 py-3 text-sm text-warn"
              role="alert"
            >
              Some items are no longer available.
              Please remove them to check out.
            </div>
          )}

          {items.map((item) => {
            const unavailable =
              !item.in_stock ||
              item.is_active === false;

            const updating =
              updatingId ===
              item.product_id;

            const removing =
              removingId ===
              item.product_id;

            const itemBusy =
              updating || removing;

            const productPath = `/product/${
              item.slug ||
              item.product_id
            }`;

            return (
              <article
                className={[
                  'cart-card',
                  unavailable
                    ? 'is-unavailable'
                    : '',
                  itemBusy
                    ? 'is-updating'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={
                  item.product_id ||
                  item.id
                }
              >
                <Link
                  to={productPath}
                  className="cart-card-thumb flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-bg max-[560px]:h-20 max-[560px]:w-20"
                  aria-label={`View ${
                    item.name ||
                    'product'
                  }`}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={
                        item.name ||
                        'Product'
                      }
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden="true">
                      {(
                        item.name ||
                        'L'
                      ).slice(0, 1)}
                    </span>
                  )}
                </Link>

                <div className="cart-card-main min-w-0 flex-1">
                  <div className="cart-card-copy min-w-0">
                    <p className="product-category mb-1 block text-[10px] font-semibold uppercase tracking-[.12em] text-dim">
                      {item.hsn_code
                        ? `HSN ${item.hsn_code}`
                        : 'Product'}
                    </p>

                    <h2>
                      <Link to={productPath}>
                        {item.name}
                      </Link>
                    </h2>

                    {unavailable && (
                      <p className="cart-unavailable mt-2 inline-flex min-h-8 items-center rounded-full border border-danger/40 bg-danger-dim px-2.5 text-[11px] font-semibold text-danger">
                        Unavailable
                      </p>
                    )}

                    {item.price_changed && (
                      <p className="cart-changed mt-2 inline-flex min-h-8 items-center rounded-full border border-[rgb(224_169_82_/_0.5)] bg-[rgb(224_169_82_/_0.08)] px-2.5 text-[11px] font-semibold text-warn">
                        Price updated since added
                      </p>
                    )}

                    <p className="cart-unit mt-2 text-xs text-muted">
                      {formatMoney(
                        item.unit_price,
                      )}{' '}
                      each
                    </p>
                  </div>

                  <div className="cart-card-controls mt-3 flex min-w-0 flex-wrap items-center gap-3 max-[560px]:gap-2">
                    <QuantityEditor
                      item={item}
                      disabled={
                        unavailable ||
                        actionBusy
                      }
                      onUpdate={(quantity) =>
                        handleQuantity(
                          item.product_id,
                          quantity,
                        )
                      }
                    />

                    <strong className="cart-line-total ml-auto min-w-20 text-right text-sm font-semibold tabular-nums text-text">
                      {formatMoney(
                        item.line_total,
                      )}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-remove inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-transparent text-muted transition-colors hover:bg-danger-dim hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  onClick={() =>
                    handleRemove(
                      item.product_id,
                    )
                  }
                  aria-label={`Remove ${
                    item.name ||
                    'product'
                  }`}
                  disabled={
                    actionBusy
                  }
                  aria-busy={removing}
                >
                  {removing ? (
                    <RiLoader4Line
                      className="spin animate-spin"
                      size={18}
                      aria-hidden="true"
                    />
                  ) : (
                    <RiCloseLine
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </article>
            );
          })}

          <div className="cart-utilities mt-5 flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              onClick={handleClear}
              disabled={
                actionBusy
              }
              aria-busy={clearing}
            >
              {clearing ? (
                <RiLoader4Line
                  className="spin animate-spin"
                  size={15}
                  aria-hidden="true"
                />
              ) : (
                <RiDeleteBinLine
                  size={15}
                  aria-hidden="true"
                />
              )}

              {clearing
                ? 'Clearing…'
                : 'Clear bag'}
            </button>

            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-transparent bg-transparent px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              to="/shop"
            >
              Keep shopping
              <RiArrowRightLine
                size={15}
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        <aside
          className="summary cart-summary sticky top-[92px] min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-luviio-card max-[900px]:static"
          aria-label="Order summary"
        >
          <div className="summary-heading mb-4 text-base font-semibold text-text">
            <p className="eyebrow mb-3 text-[11px] font-medium uppercase tracking-[.2em] text-gold">
              Order summary
            </p>
          </div>

          <dl className="summary-lines space-y-3 text-sm text-muted">
            <div>
              <dt>Subtotal</dt>
              <dd>
                {formatMoney(
                  cart.subtotal,
                )}
              </dd>
            </div>

            <div>
              <dt>Shipping</dt>
              <dd className="shipping-at-checkout mt-3 text-xs text-dim">
                Calculated at checkout
              </dd>
            </div>

            <div>
              <dt>Taxes</dt>
              <dd>
                {formatMoney(
                  cart.tax_amount,
                )}
              </dd>
            </div>

            <div className="total mt-4 flex items-center justify-between border-t border-line pt-4 text-base font-semibold text-text">
              <dt>Before shipping</dt>
              <dd>
                {formatMoney(
                  cart.total_amount,
                )}
              </dd>
            </div>
          </dl>

          <p className="free-ship-note mt-3 rounded-xl border border-gold/30 bg-gold-dim px-3 py-2.5 text-xs leading-5 text-gold-soft">
            <RiTruckLine
              size={16}
              aria-hidden="true"
            />
            Live shipping is calculated at
            checkout after your delivery PIN is
            selected.
          </p>

          <button
            type="button"
            className="btn btn-block cart-checkout mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold uppercase tracking-[.06em] text-gold-ink transition-colors hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            onClick={() =>
              navigate('/checkout')
            }
            disabled={
              actionBusy ||
              hasUnavailableItems
            }
          >
            <RiLockLine
              size={17}
              aria-hidden="true"
            />

            Checkout securely

            <RiArrowRightLine
              size={17}
              aria-hidden="true"
            />
          </button>

          <p className="cart-secure-note mt-3 flex items-center gap-2 text-[11px] leading-5 text-dim">
            Secure checkout · Your payment details
            are protected.
          </p>
        </aside>
      </div>
    </div>
  );
}