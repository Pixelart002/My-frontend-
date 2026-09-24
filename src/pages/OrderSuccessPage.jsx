import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiCustomerService2Line,
  RiMailLine,
  RiShoppingBag3Line,
} from '@remixicon/react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orders';
import { formatMoney } from '../utils/format';

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizePaymentMethod(value) {
  return normalizeText(value).toLowerCase();
}

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState('');

  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);
  const cartClearedRef = useRef(false);

  const stateOrderNumber = normalizeText(
    location.state?.orderNumber,
  );

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const queryOrderNumber = normalizeText(
    query.get('order'),
  );

  const queryPaymentMethod = normalizePaymentMethod(
    query.get('payment'),
  );

  const orderNumber =
    stateOrderNumber || queryOrderNumber;

  const paymentMethod = normalizePaymentMethod(
    order?.payment_method ||
      location.state?.paymentMethod ||
      queryPaymentMethod,
  );

  const isCod =
    paymentMethod === 'cod' ||
    paymentMethod === 'cash_on_delivery' ||
    (!paymentMethod &&
      Boolean(order) &&
      !order.stripe_payment_intent);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!orderNumber) {
      setOrder(null);
      setOrderError('');
      return undefined;
    }

    const version = ++requestVersionRef.current;

    setOrder(null);
    setOrderError('');

    if (!cartClearedRef.current) {
      cartClearedRef.current = true;

      clearCart().catch(() => {
        // Cart cleanup is best-effort.
        // The persisted order remains the backend source of truth.
      });
    }

    let active = true;

    orderService
      .myOrder(orderNumber)
      .then((result) => {
        if (
          !active ||
          !mountedRef.current ||
          version !== requestVersionRef.current
        ) {
          return;
        }

        setOrder(result || null);
      })
      .catch((err) => {
        if (
          !active ||
          !mountedRef.current ||
          version !== requestVersionRef.current
        ) {
          return;
        }

        setOrderError(
          err?.message ||
            'Order details are temporarily unavailable.',
        );
      });

    return () => {
      active = false;
    };
  }, [clearCart, orderNumber]);

  useEffect(() => {
    if (
      !stateOrderNumber ||
      queryOrderNumber
    ) {
      return;
    }

    const params = new URLSearchParams();

    params.set('order', stateOrderNumber);

    const statePaymentMethod = normalizeText(
      location.state?.paymentMethod,
    );

    if (statePaymentMethod) {
      params.set(
        'payment',
        statePaymentMethod,
      );
    }

    navigate(
      `/order/success?${params.toString()}`,
      {
        replace: true,
      },
    );
  }, [
    navigate,
    queryOrderNumber,
    stateOrderNumber,
    location.state?.paymentMethod,
  ]);

  const serverTotal =
    order?.total_amount ??
    order?.grand_total;

  const hasServerTotal =
    serverTotal !== undefined &&
    serverTotal !== null &&
    Number.isFinite(Number(serverTotal));

  const displayOrderNumber =
    orderNumber || 'your order';

  return (
    <div className="page container">
      <section
        className="order-result"
        aria-labelledby="order-success-title"
      >
        <RiCheckboxCircleFill
          size={58}
          className="order-result-icon"
          aria-hidden="true"
        />

        <p className="eyebrow">
          {isCod
            ? 'Order confirmed'
            : 'Payment confirmed'}
        </p>

        <h1 id="order-success-title">
          {isCod
            ? 'Your order is placed.'
            : 'Thank you.'}
        </h1>

        <p>
          {isCod
            ? `Your COD order${
                orderNumber
                  ? ` #${orderNumber}`
                  : ''
              } has been confirmed. You’ll pay when it arrives.`
            : `Your order${
                orderNumber
                  ? ` #${orderNumber}`
                  : ''
              } has been placed and is being prepared.`}
        </p>

        {orderNumber && (
          <div
            className="order-result-order-id"
            aria-label={`Order ${orderNumber}`}
          >
            <span>Order number</span>

            <strong>
              #{orderNumber}
            </strong>

            {hasServerTotal && (
              <>
                <span>Order total</span>

                <strong>
                  {formatMoney(serverTotal)}
                </strong>
              </>
            )}
          </div>
        )}

        {orderError && (
          <p
            className="form-error"
            role="status"
            aria-live="polite"
          >
            {orderError}
          </p>
        )}

        {orderNumber && (
          <div
            className="order-result-actions"
            aria-label="Order actions"
          >
            <Link
              className="btn"
              to={`/orders/${encodeURIComponent(
                orderNumber,
              )}`}
            >
              View order
              <RiArrowRightLine
                size={17}
                aria-hidden="true"
              />
            </Link>

            <Link
              className="btn btn-quiet"
              to="/orders"
            >
              All orders
            </Link>
          </div>
        )}

        <Link
          className="btn btn-ghost"
          to="/shop"
        >
          Continue shopping
        </Link>

        <div
          className="order-result-meta"
          aria-label="Order information"
        >
          <div>
            <RiMailLine
              size={21}
              aria-hidden="true"
            />

            <span>
              Order confirmation
              <br />
              available in your account
            </span>
          </div>

          <div>
            <RiShoppingBag3Line
              size={21}
              aria-hidden="true"
            />

            <span>
              Track your order
              <br />
              in My Orders
            </span>
          </div>

          <div>
            <RiCustomerService2Line
              size={21}
              aria-hidden="true"
            />

            <span>
              Need help?
              <br />
              Contact support
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}