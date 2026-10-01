import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import {
  RiArrowLeftLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiMapPin2Line,
  RiShieldCheckLine,
} from '@remixicon/react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { orderService } from '../services/orders';
import { paymentService } from '../services/payments';
import { getStripePromise } from '../services/stripeConfig';
import PaymentMethodModal from '../components/checkout/PaymentMethodModal';
import StripePaymentForm from '../components/checkout/StripePaymentForm';
import {
  orderStatusLabel,
  orderStatusTone,
  canCancelOrder,
  canDownloadInvoice,
} from '../utils/order';
import { formatMoney } from '../utils/format';
import { Spinner, ErrorState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';
import ShipmentTimeline from '../components/orders/ShipmentTimeline';

const stripePromise = getStripePromise();

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;

  const result = String(value).trim();
  return result || fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatOrderDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getItemName(item) {
  const product = item?.products;

  return text(
    product?.name ||
      item?.product_name ||
      item?.name,
    'Product',
  );
}

function getItemSlug(item) {
  return text(
    item?.products?.slug ||
      item?.product_slug,
  );
}

function getItemImage(item) {
  return text(
    item?.products?.image_url ||
      item?.image_url ||
      item?.product_image_url,
  );
}

function getQuantity(item) {
  const quantity = Number(item?.quantity);

  return Number.isFinite(quantity) && quantity > 0
    ? quantity
    : 1;
}

function getStoredUnitPrice(item, quantity) {
  const unitPrice = Number(item?.unit_price);

  if (Number.isFinite(unitPrice)) {
    return unitPrice;
  }

  const subtotal = Number(item?.subtotal);

  if (Number.isFinite(subtotal)) {
    return subtotal / quantity;
  }

  return 0;
}

function getStoredLineTotal(item, quantity) {
  const subtotal = Number(item?.subtotal);

  if (Number.isFinite(subtotal)) {
    return subtotal;
  }

  const unitPrice = Number(item?.unit_price);

  if (Number.isFinite(unitPrice)) {
    return unitPrice * quantity;
  }

  return 0;
}

function hasAddressValue(address) {
  if (!address || typeof address !== 'object') {
    return false;
  }

  return Object.values(address).some(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== '',
  );
}

export default function OrderDetailPage() {
  const { id: orderNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [retryOpen, setRetryOpen] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryIntent, setRetryIntent] = useState(null);
  const [retrySessionKey, setRetrySessionKey] = useState(0);
  const [retryError, setRetryError] = useState('');

  const requestVersion = useRef(0);
  const mountedRef = useRef(false);
  const actionRef = useRef(false);
  const retryRequestRef = useRef(0);

  const load = useCallback(async () => {
    if (!orderNumber) {
      setError('Order number is missing.');
      setOrder(null);
      setShipment(null);
      return;
    }

    const version = ++requestVersion.current;

    setError('');

    try {
      const [orderResult, shipmentResult] = await Promise.all([
        orderService.myOrder(orderNumber),
        orderService
          .myShipment(orderNumber)
          .catch(() => null),
      ]);

      if (
        !mountedRef.current ||
        version !== requestVersion.current
      ) {
        return;
      }

      if (!orderResult) {
        throw new Error('Unable to load this order.');
      }

      setOrder(orderResult);
      setShipment(shipmentResult);
    } catch (err) {
      if (
        !mountedRef.current ||
        version !== requestVersion.current
      ) {
        return;
      }

      setOrder(null);
      setShipment(null);
      setError(
        err?.message ||
          'Unable to load this order. Please try again.',
      );
    }
  }, [orderNumber]);

  useEffect(() => {
    mountedRef.current = true;

    setOrder(null);
    setShipment(null);
    setError('');

    load();

    return () => {
      mountedRef.current = false;
      requestVersion.current += 1;
      retryRequestRef.current += 1;
    };
  }, [load]);

  const closeRetry = useCallback(() => {
    if (retryLoading) return;

    retryRequestRef.current += 1;

    setRetryOpen(false);
    setRetryIntent(null);
    setRetryError('');
  }, [retryLoading]);

  const openRetry = useCallback(() => {
    if (
      busy ||
      retryLoading ||
      !orderNumber
    ) {
      return;
    }

    retryRequestRef.current += 1;

    setRetryError('');
    setRetryIntent(null);
    setRetryOpen(true);
  }, [busy, retryLoading, orderNumber]);

  const prepareRetry = useCallback(async () => {
    if (
      !orderNumber ||
      retryLoading ||
      retryIntent?.client_secret ||
      actionRef.current
    ) {
      return;
    }

    const requestId = ++retryRequestRef.current;

    actionRef.current = true;
    setRetryLoading(true);
    setRetryError('');

    try {
      const result = await paymentService.retry(orderNumber);

      if (
        !mountedRef.current ||
        requestId !== retryRequestRef.current
      ) {
        return;
      }

      if (result?.status === 'paid') {
        toast.success('This order is already paid.');

        setRetryOpen(false);
        setRetryIntent(null);

        await load();
        return;
      }

      if (
        !result?.client_secret ||
        !result?.payment_intent_id
      ) {
        throw new Error(
          result?.message ||
            'Unable to prepare payment retry.',
        );
      }

      setRetrySessionKey((value) => value + 1);
      setRetryIntent(result);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== retryRequestRef.current
      ) {
        return;
      }

      setRetryError(
        err?.message ||
          'Unable to prepare payment retry. Please try again.',
      );
    } finally {
      actionRef.current = false;

      if (
        mountedRef.current &&
        requestId === retryRequestRef.current
      ) {
        setRetryLoading(false);
      }
    }
  }, [
    load,
    orderNumber,
    retryIntent?.client_secret,
    retryLoading,
    toast,
  ]);

  const onCancel = useCallback(async () => {
    if (
      !orderNumber ||
      busy ||
      actionRef.current
    ) {
      return;
    }

    actionRef.current = true;
    setBusy(true);

    try {
      await orderService.cancel(orderNumber);

      toast.success('Order cancelled.');

      setCancelOpen(false);

      await load();
    } catch (err) {
      toast.error(
        err?.message ||
          'Unable to cancel the order. Please try again.',
      );
    } finally {
      actionRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [busy, load, orderNumber, toast]);

  const onInvoice = useCallback(async () => {
    if (
      !orderNumber ||
      busy ||
      actionRef.current
    ) {
      return;
    }

    const invoiceNumber = text(order?.invoice_number);

    if (!invoiceNumber) {
      toast.error('Invoice is not available yet.');
      return;
    }

    actionRef.current = true;
    setBusy(true);

    try {
      await orderService.invoice(
        orderNumber,
        invoiceNumber,
      );
    } catch (err) {
      toast.error(
        err?.message ||
          'Unable to download the invoice.',
      );
    } finally {
      actionRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }, [
    busy,
    order?.invoice_number,
    orderNumber,
    toast,
  ]);

  if (error) {
    return (
      <div className="page container">
        <ErrorState
          message={error}
          onRetry={load}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-[50vh] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Spinner label="Loading order…" />
      </main>
    );
  }

  const items = Array.isArray(order.order_items)
    ? order.order_items
    : [];

  const status = text(order.status).toLowerCase();

  const paymentMethod = text(
    order.payment_method,
  ).toLowerCase();

  const isCodOrder =
    paymentMethod === 'cod' ||
    paymentMethod === 'cash_on_delivery' ||
    !order.stripe_payment_intent;

  const isRetryable =
    status === 'pending' &&
    !isCodOrder;

  const shippingSnapshot = {
    full_name: order.shipping_name,
    phone: order.shipping_phone,
    email: order.shipping_email,
    line1: order.shipping_line1,
    line2: order.shipping_line2,
    landmark: order.shipping_landmark,
    city: order.shipping_city,
    state: order.shipping_state,
    postal_code: order.shipping_postal_code,
    country: order.shipping_country,
    company_name: order.shipping_company_name,
    gstin: order.shipping_gstin,
  };

  const nestedShippingAddress =
    order.shipping_address &&
    typeof order.shipping_address === 'object'
      ? order.shipping_address
      : null;

  const nestedBillingAddress =
    order.billing_address &&
    typeof order.billing_address === 'object'
      ? order.billing_address
      : null;

  const retryAddress = hasAddressValue(
    shippingSnapshot,
  )
    ? shippingSnapshot
    : nestedShippingAddress ||
      nestedBillingAddress ||
      null;

  const publicOrderNumber =
    text(order.order_number) ||
    text(orderNumber);

  const publicInvoiceNumber =
    text(order.invoice_number);

  const retryElementsOptions =
    retryIntent?.client_secret
      ? {
          clientSecret:
            retryIntent.client_secret,
        }
      : undefined;

  const paymentContent =
    retryIntent?.client_secret &&
    stripePromise &&
    retryElementsOptions ? (
      <Elements
        key={retrySessionKey}
        stripe={stripePromise}
        options={retryElementsOptions}
      >
        <StripePaymentForm
          orderNumber={publicOrderNumber}
          clientSecret={
            retryIntent.client_secret
          }
          onSuccess={async () => {
            if (!mountedRef.current) return;

            setRetryOpen(false);
            setRetryIntent(null);
            setRetryError('');

            toast.success('Payment successful.');

            await load();

            if (!mountedRef.current) return;

            navigate(
              `/orders/${encodeURIComponent(
                publicOrderNumber,
              )}`,
              {
                replace: true,
              },
            );
          }}
          onBack={closeRetry}
          onRetry={prepareRetry}
        />
      </Elements>
    ) : null;

  return (
    <div className="page container order-detail-page">
      <Link
        className="back-link"
        to="/orders"
      >
        <RiArrowLeftLine
          size={15}
          aria-hidden="true"
        />
        Back to orders
      </Link>

      <section
        className="order-detail-card"
        aria-labelledby="order-detail-title"
      >
        <header className="order-detail-header">
          <div className="order-detail-title">
            <p className="eyebrow">
              Order details
            </p>

            <h1 id="order-detail-title">
              Order #{publicOrderNumber}
            </h1>

            <p className="auth-sub">
              Placed {formatOrderDate(order.created_at)}
            </p>

            {publicInvoiceNumber && (
              <p className="auth-sub">
                Invoice #{publicInvoiceNumber}
              </p>
            )}
          </div>

          <span
            className={`status-pill tone-${orderStatusTone(
              status,
            )}`}
            aria-label={`Order status: ${orderStatusLabel(
              status,
            )}`}
          >
            {orderStatusLabel(status)}
          </span>
        </header>

        <div
          className="order-detail-actions"
          aria-label="Order actions"
        >
          {isRetryable && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={openRetry}
              disabled={
                busy ||
                retryLoading
              }
            >
              Retry payment
            </button>
          )}

          {canDownloadInvoice(status) && (
            <button
              className="btn btn-quiet btn-sm"
              type="button"
              onClick={onInvoice}
              disabled={busy}
            >
              <RiFileTextLine
                size={15}
                aria-hidden="true"
              />
              Download invoice
            </button>
          )}

          {canCancelOrder(status) && (
            <button
              className="btn btn-danger btn-sm"
              type="button"
              onClick={() => setCancelOpen(true)}
              disabled={busy}
            >
              <RiCloseCircleLine
                size={15}
                aria-hidden="true"
              />
              Cancel order
            </button>
          )}
        </div>

        {retryError && (
          <div
            className="form-error"
            role="alert"
            aria-live="assertive"
          >
            {retryError}
          </div>
        )}

        <ShipmentTimeline
          shipment={shipment}
        />

        <div className="order-detail-items">
          <div className="order-section-label">
            Items
          </div>

          {items.length === 0 ? (
            <p className="auth-sub">
              No item details are available for this
              order.
            </p>
          ) : (
            items.map((item, index) => {
              const name = getItemName(item);
              const slug = getItemSlug(item);
              const imageUrl = getItemImage(item);
              const quantity = getQuantity(item);

              /*
               * These values come from the persisted order
               * snapshot. They are display-only and are not
               * used to calculate the order total.
               */
              const unitPrice =
                getStoredUnitPrice(
                  item,
                  quantity,
                );

              const lineTotal =
                getStoredLineTotal(
                  item,
                  quantity,
                );

              const productHref = slug
                ? `/product/${encodeURIComponent(
                    slug,
                  )}`
                : null;

              return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-7">
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" to="/orders">
          <RiArrowLeftLine size={17} aria-hidden="true" /> Back to orders
        </Link>
        <Link className="hidden min-h-10 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:inline-flex" to="/shop">
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-luviio-card" aria-labelledby="order-detail-title">
            <header className="border-b border-line p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Order details</p>
                  <h1 id="order-detail-title" className="break-words font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">Order #{publicOrderNumber}</h1>
                  <div className="mt-2 space-y-1 text-sm text-muted">
                    <p>Placed {formatOrderDate(order.created_at)}</p>
                    {publicInvoiceNumber && <p>Invoice #{publicInvoiceNumber}</p>}
                  </div>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold ${orderStatusTone(status) === 'success' ? 'bg-success-dim text-success' : orderStatusTone(status) === 'danger' ? 'bg-danger-dim text-danger' : 'bg-gold-dim text-gold'}`}
                  aria-label={`Order status: ${orderStatusLabel(status)}`}
                >
                  {orderStatusLabel(status)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center" aria-label="Order actions">
                {isRetryable && (
                  <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold text-gold-ink transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={openRetry} disabled={busy || retryLoading}>
                    Retry payment
                  </button>
                )}
                {canDownloadInvoice(status) && (
                  <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 text-sm font-semibold text-text transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={onInvoice} disabled={busy}>
                    <RiFileTextLine size={17} aria-hidden="true" /> Download invoice
                  </button>
                )}
                {canCancelOrder(status) && (
                  <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger-dim px-4 text-sm font-semibold text-danger transition hover:border-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => setCancelOpen(true)} disabled={busy}>
                    <RiCloseCircleLine size={17} aria-hidden="true" /> Cancel order
                  </button>
                )}
              </div>

              {retryError && <div className="mt-4 rounded-xl border border-danger/30 bg-danger-dim px-4 py-3 text-sm font-medium text-danger" role="alert" aria-live="assertive">{retryError}</div>}
            </header>

            <div className="border-b border-line p-5 sm:p-6">
              <ShipmentTimeline shipment={shipment} />
            </div>

            <section className="p-5 sm:p-6" aria-labelledby="order-items-title">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Order contents</p>
                  <h2 id="order-items-title" className="mt-1 text-lg font-bold text-text">Items</h2>
                </div>
                <span className="text-xs font-medium text-muted">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-surface-2 px-4 py-8 text-center text-sm text-muted">No item details are available for this order.</div>
              ) : (
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {items.map((item, index) => {
                    const name = getItemName(item);
                    const slug = getItemSlug(item);
                    const imageUrl = getItemImage(item);
                    const quantity = getQuantity(item);
                    const unitPrice = getStoredUnitPrice(item, quantity);
                    const lineTotal = getStoredLineTotal(item, quantity);
                    const productHref = slug ? `/product/${encodeURIComponent(slug)}` : null;

                    return (
                      <article className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 bg-surface px-3 py-3.5 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-4 sm:px-4" key={item.id || item.product_id || `${name}-${index}`}>
                        {imageUrl && productHref ? (
                          <Link to={productHref} className="flex aspect-square size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 sm:size-[72px]" aria-label={`View ${name}`}>
                            <img className="size-full object-cover" src={imageUrl} alt={name} loading="lazy" decoding="async" />
                          </Link>
                        ) : (
                          <div className="flex aspect-square size-14 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-lg font-bold text-muted sm:size-[72px]" aria-hidden="true">{name.slice(0, 1)}</div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-text sm:text-base">{name}</h3>
                          <p className="mt-1 truncate text-xs text-muted">{item.hsn_code ? `HSN ${item.hsn_code}` : 'Product'}</p>
                          <p className="mt-1 text-xs font-medium text-muted">{formatMoney(unitPrice)} × {quantity}</p>
                        </div>
                        <strong className="text-right text-sm font-bold text-text sm:text-base">{formatMoney(lineTotal)}</strong>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6" aria-labelledby="delivery-title">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-dim text-gold" aria-hidden="true"><RiMapPin2Line size={19} /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Delivery</p>
                <h2 id="delivery-title" className="mt-1 text-lg font-bold text-text">Shipping address</h2>
              </div>
            </div>
            {hasAddressValue(nestedShippingAddress) ? (
              <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-4 text-sm leading-6 text-muted">
                <p className="font-semibold text-text">{text(nestedShippingAddress.full_name, nestedShippingAddress.name)}</p>
                <p>{text(nestedShippingAddress.line1, 'Address unavailable')}</p>
                {nestedShippingAddress.line2 && <p>{nestedShippingAddress.line2}</p>}
                <p>{[nestedShippingAddress.city, nestedShippingAddress.state].filter(Boolean).join(', ')}{nestedShippingAddress.postal_code ? ` — ${nestedShippingAddress.postal_code}` : ''}</p>
                {nestedShippingAddress.phone && <p className="mt-2">{nestedShippingAddress.phone}</p>}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-line bg-surface-2 px-4 py-5 text-sm text-muted">Shipping address details are unavailable.</p>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24" aria-label="Order summary">
          <section className="rounded-3xl border border-line bg-surface p-5 shadow-luviio-card sm:p-6" aria-labelledby="order-summary-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Payment</p>
                <h2 id="order-summary-title" className="mt-1 text-lg font-bold text-text">Order summary</h2>
              </div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-success-dim text-success" title="Backend total" aria-label="Backend total verified"><RiShieldCheckLine size={18} /></span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-muted">Subtotal</dt><dd className="font-semibold text-text">{formatMoney(order.subtotal ?? order.items_subtotal ?? 0)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted">Shipping</dt><dd className="font-semibold text-text">{safeNumber(order.shipping_cost) > 0 ? formatMoney(order.shipping_cost) : 'Free'}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted">Taxes</dt><dd className="font-semibold text-text">{formatMoney(order.tax_amount ?? 0)}</dd></div>
              {safeNumber(order.discount_amount) > 0 && <div className="flex items-center justify-between gap-4"><dt className="text-muted">Discount</dt><dd className="font-semibold text-success">−{formatMoney(order.discount_amount)}</dd></div>}
              <div className="my-4 border-t border-line" />
              <div className="flex items-end justify-between gap-4"><dt className="font-bold text-text">Total</dt><dd className="font-display text-2xl font-semibold text-text">{formatMoney(order.total_amount ?? order.grand_total ?? 0)}</dd></div>
            </dl>
            <div className="mt-5 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-xs text-muted">
              <div className="flex items-center justify-between gap-3"><span>Payment method</span><span className="font-semibold uppercase text-text">{paymentMethod || (isCodOrder ? 'COD' : 'Card')}</span></div>
            </div>
          </section>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
            Your order total is the amount confirmed by Luviio's backend. No frontend recalculation is used for the final total.
          </div>
        </aside>
      </div>

      <PaymentMethodModal open={retryOpen} value="stripe" onChange={() => {}} onClose={closeRetry} onContinue={prepareRetry} loading={retryLoading} review address={retryAddress} total={formatMoney(order.total_amount ?? order.grand_total ?? 0)} onBack={closeRetry}>
        {retryLoading && !retryIntent ? <Spinner label="Preparing secure payment…" /> : paymentContent}
      </PaymentMethodModal>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order?"
        message={status === 'pending' ? 'Reserved stock will be released.' : isCodOrder ? 'No online payment refund will be initiated for this COD order.' : 'Your payment will be refunded according to the payment flow.'}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        danger
        busy={busy}
        onCancel={() => { if (!busy) setCancelOpen(false); }}
        onConfirm={onCancel}
      />
    </main>
  );
}
