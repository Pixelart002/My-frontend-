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
        className="cart-qty-value"
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
          className="cart-qty-spinner spin"
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
      <div className="page container cart-page">
        <div className="cart-page-heading">
          <p className="eyebrow">
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
              className="btn"
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
      <div className="page container cart-page">
        <Spinner label="Loading your bag…" />
      </div>
    );
  }

  if (
    error &&
    items.length === 0
  ) {
    return (
      <div className="page container cart-page">
        <div className="cart-page-heading">
          <p className="eyebrow">
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
      <div className="page container cart-page">
        <div className="cart-page-heading">
          <p className="eyebrow">
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
              className="btn"
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
    <div className="page container cart-page">
      <Link
        className="cart-back"
        to="/shop"
      >
        <RiArrowLeftLine
          size={17}
          aria-hidden="true"
        />
        Continue shopping
      </Link>

      <div className="cart-page-heading">
        <p className="eyebrow">
          Your selection
        </p>

        <h1>Your Cart</h1>

        <p>
          Review your items before checkout.
        </p>
      </div>

      {error && (
        <div
          className="notice error cart-action-notice"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="cart-layout cart-layout-refined">
        <section
          className="cart-items"
          aria-label="Cart items"
        >
          {hasUnavailableItems && (
            <div
              className="notice warn"
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
                  className="cart-card-thumb"
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

                <div className="cart-card-main">
                  <div className="cart-card-copy">
                    <p className="product-category">
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
                      <p className="cart-unavailable">
                        Unavailable
                      </p>
                    )}

                    {item.price_changed && (
                      <p className="cart-changed">
                        Price updated since added
                      </p>
                    )}

                    <p className="cart-unit">
                      {formatMoney(
                        item.unit_price,
                      )}{' '}
                      each
                    </p>
                  </div>

                  <div className="cart-card-controls">
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

                    <strong className="cart-line-total">
                      {formatMoney(
                        item.line_total,
                      )}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="cart-remove"
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
                      className="spin"
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

          <div className="cart-utilities">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClear}
              disabled={
                actionBusy
              }
              aria-busy={clearing}
            >
              {clearing ? (
                <RiLoader4Line
                  className="spin"
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
              className="btn btn-ghost"
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
          className="summary cart-summary"
          aria-label="Order summary"
        >
          <div className="summary-heading">
            <p className="eyebrow">
              Order summary
            </p>
          </div>

          <dl className="summary-lines">
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
              <dd className="shipping-at-checkout">
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

            <div className="total">
              <dt>Before shipping</dt>
              <dd>
                {formatMoney(
                  cart.total_amount,
                )}
              </dd>
            </div>
          </dl>

          <p className="free-ship-note">
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
            className="btn btn-block cart-checkout"
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

          <p className="cart-secure-note">
            Secure checkout · Your payment details
            are protected.
          </p>
        </aside>
      </div>
    </div>
  );
}