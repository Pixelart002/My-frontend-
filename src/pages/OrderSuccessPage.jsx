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
    <main className="min-h-[calc(100vh-5rem)] px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-surface shadow-luviio-card" aria-labelledby="order-success-title">
        <div className="border-b border-line bg-success-dim px-5 py-7 text-center sm:px-8 sm:py-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success-dim text-success shadow-lg shadow-black/10">
            <RiCheckboxCircleFill size={42} aria-hidden="true" />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-success">{isCod ? "Order confirmed" : "Payment confirmed"}</p>
          <h1 id="order-success-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.025em] text-text sm:text-4xl">
            {isCod ? "Your order is placed." : "Payment successful."}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
            {isCod
              ? `Your COD order${orderNumber ? ` #${orderNumber}` : ""} has been confirmed. You’ll pay when it arrives.`
              : `Your order${orderNumber ? ` #${orderNumber}` : ""} has been placed and is being prepared.`}
          </p>
        </div>
        <div className="space-y-6 p-5 sm:p-8">
          {orderNumber ? (
            <div className="rounded-2xl border border-line bg-bg p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.13em] text-dim">Order number</p>
                  <p className="mt-1 break-all text-lg font-semibold tracking-tight text-text">#{orderNumber}</p>
                </div>
                {hasServerTotal && (
                  <div className="border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.13em] text-dim">Order total</p>
                    <p className="mt-1 text-lg font-semibold text-gold-soft">{formatMoney(serverTotal)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-bg p-4 text-sm leading-6 text-muted">
              Your order has been submitted. Open My Orders to view the latest order status.
            </div>
          )}
          {orderError && (
            <div className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-dim px-4 py-3.5 text-sm leading-6 text-danger" role="status" aria-live="polite">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />
              <span>{orderError}</span>
            </div>
          )}
          {orderNumber && (
            <div className="grid gap-3 sm:grid-cols-2" aria-label="Order actions">
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-gold-ink shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-surface" to={`/orders/${encodeURIComponent(orderNumber)}`}>
                View order <RiArrowRightLine size={17} aria-hidden="true" />
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-bg px-5 py-3 text-sm font-semibold text-text transition hover:border-gold/40 hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-surface" to="/orders">
                All orders
              </Link>
            </div>
          )}
          <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line bg-transparent px-5 py-3 text-sm font-semibold text-muted transition hover:border-gold/40 hover:text-text focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-surface" to="/shop">
            Continue shopping
          </Link>
          <div className="grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
            {[
              [RiMailLine, "Confirmation", "Available in your account."],
              [RiShoppingBag3Line, "Track order", "Follow progress in My Orders."],
              [RiCustomerService2Line, "Need help?", "Contact Luviio support."],
            ].map(([Icon, title, description]) => (
              <div key={title} className="rounded-2xl border border-line bg-bg p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-dim text-gold-soft">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <p className="mt-3 text-xs font-semibold text-text">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[.18em] text-dim">LUVIIO · Secure checkout</p>
        </div>
      </section>
    </main>
  );
}