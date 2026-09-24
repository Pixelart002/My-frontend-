import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import {
  RiArrowLeftLine,
  RiCloseCircleLine,
  RiFileTextLine,
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
      <div className="page container">
        <Spinner label="Loading order…" />
      </div>
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
                <article
                  className="order-item"
                  key={
                    item.id ||
                    item.product_id ||
                    `${name}-${index}`
                  }
                >
                  {imageUrl && productHref ? (
                    <Link
                      to={productHref}
                      className="order-item-thumb"
                      aria-label={`View ${name}`}
                    >
                      <img
                        src={imageUrl}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  ) : (
                    <div
                      className="order-item-thumb"
                      aria-hidden="true"
                    >
                      <span>
                        {name.slice(0, 1)}
                      </span>
                    </div>
                  )}

                  <div className="order-item-info">
                    <h3>{name}</h3>

                    <p>
                      {item.hsn_code
                        ? `HSN ${item.hsn_code}`
                        : 'Product'}
                    </p>

                    <span>
                      {formatMoney(unitPrice)} ×{' '}
                      {quantity}
                    </span>
                  </div>

                  <strong className="order-item-total">
                    {formatMoney(lineTotal)}
                  </strong>
                </article>
              );
            })
          )}
        </div>

        <aside
          className="summary order-summary"
          aria-labelledby="order-summary-title"
        >
          <p
            id="order-summary-title"
            className="eyebrow"
          >
            Summary
          </p>

          <dl className="summary-lines">
            <div>
              <dt>Subtotal</dt>
              <dd>
                {formatMoney(
                  order.subtotal ??
                    order.items_subtotal ??
                    0,
                )}
              </dd>
            </div>

            <div>
              <dt>Shipping</dt>
              <dd>
                {safeNumber(
                  order.shipping_cost,
                ) > 0
                  ? formatMoney(
                      order.shipping_cost,
                    )
                  : 'Free'}
              </dd>
            </div>

            <div>
              <dt>Taxes</dt>
              <dd>
                {formatMoney(
                  order.tax_amount ?? 0,
                )}
              </dd>
            </div>

            {safeNumber(
              order.discount_amount,
            ) > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>
                  −
                  {formatMoney(
                    order.discount_amount,
                  )}
                </dd>
              </div>
            )}

            <div className="total">
              <dt>Total</dt>
              <dd>
                {formatMoney(
                  order.total_amount ??
                    order.grand_total ??
                    0,
                )}
              </dd>
            </div>
          </dl>

          {hasAddressValue(
            nestedShippingAddress,
          ) && (
            <div className="summary-address">
              <strong>Deliver to</strong>

              <p>
                {text(
                  nestedShippingAddress.line1,
                  'Address unavailable',
                )}

                {nestedShippingAddress.city
                  ? `, ${nestedShippingAddress.city}`
                  : ''}

                {nestedShippingAddress.state
                  ? `, ${nestedShippingAddress.state}`
                  : ''}

                {nestedShippingAddress.postal_code
                  ? ` — ${nestedShippingAddress.postal_code}`
                  : ''}
              </p>
            </div>
          )}
        </aside>
      </section>

      <PaymentMethodModal
        open={retryOpen}
        value="stripe"
        onChange={() => {}}
        onClose={closeRetry}
        onContinue={prepareRetry}
        loading={retryLoading}
        review
        address={retryAddress}
        total={formatMoney(
          order.total_amount ??
            order.grand_total ??
            0,
        )}
        onBack={closeRetry}
      >
        {retryLoading && !retryIntent ? (
          <Spinner label="Preparing secure payment…" />
        ) : (
          paymentContent
        )}
      </PaymentMethodModal>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order?"
        message={
          status === 'pending'
            ? 'Reserved stock will be released.'
            : isCodOrder
              ? 'No online payment refund will be initiated for this COD order.'
              : 'Your payment will be refunded according to the payment flow.'
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        danger
        busy={busy}
        onCancel={() => {
          if (!busy) {
            setCancelOpen(false);
          }
        }}
        onConfirm={onCancel}
      />
    </div>
  );
}