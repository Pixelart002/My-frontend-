import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiCashLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiLoader4Line,
  RiMapPinLine,
  RiShieldCheckLine,
} from '@remixicon/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function PaymentMethodModal({
  open,
  value,
  onChange,
  onClose,
  onContinue,
  loading,
  review = false,
  address,
  total,
  children,
  onBack,
  activeOrder = false,
  onCancelOrder,
  cancellingOrder = false,
}) {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const closeRef = useRef(null);

  const isCodSuccess = Boolean(activeOrder) && value === 'cod';
  const hasPaymentContent = Boolean(children) && !isCodSuccess;
  const locked =
    !isCodSuccess && (Boolean(activeOrder) || hasPaymentContent);

  const title = isCodSuccess
    ? 'Order placed successfully'
    : hasPaymentContent
      ? 'Complete payment'
      : review
        ? 'Review your order'
        : 'Choose payment method';

  const goToOrderSuccess = () => {
    const orderNumber = String(
      activeOrder?.orderNumber || ''
    ).trim();

    if (!orderNumber) {
      navigate('/orders', { replace: true });
      return;
    }

    navigate('/order/success', {
      replace: true,
      state: {
        orderNumber,
        paymentMethod: 'cod',
      },
    });
  };

  const handleClose = () => {
    if (isCodSuccess) {
      goToOrderSuccess();
      return;
    }

    if (locked) {
      onCancelOrder?.();
      return;
    }

    onClose?.();
  };

  useFocusTrap({
    enabled: open,
    containerRef: modalRef,
    initialFocusRef: closeRef,
    onEscape: () => {
      if (!loading && !cancellingOrder) {
        handleClose();
      }
    },
  });

  if (!open) {
    return null;
  }

  const closeDisabled = loading || cancellingOrder;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-end justify-center
        bg-black/50 p-0
        backdrop-blur-[2px]
        sm:items-center sm:p-4
      "
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !closeDisabled &&
          (isCodSuccess || !locked)
        ) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="
          flex w-full max-h-[92vh]
          flex-col overflow-hidden
          rounded-t-2xl
          border border-gray-200
          bg-white
          shadow-[0_24px_80px_rgba(0,0,0,0.22)]
          outline-none
          sm:max-w-xl
          sm:rounded-2xl
        "
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Secure checkout
            </p>

            <h2
              id="payment-modal-title"
              className="m-0 mt-1 text-xl font-semibold tracking-tight text-gray-900"
            >
              {title}
            </h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            aria-label={
              isCodSuccess
                ? 'View order confirmation'
                : locked
                  ? 'Cancel order'
                  : 'Close payment dialog'
            }
            disabled={closeDisabled}
            onClick={handleClose}
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg
              text-gray-400
              transition-colors
              hover:bg-gray-100 hover:text-gray-700
              focus:outline-none
              focus:ring-2 focus:ring-gray-300
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RiCloseLine size={20} aria-hidden="true" />
          </button>
        </header>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {isCodSuccess ? (
            <div className="flex flex-col items-center px-2 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <RiCheckboxCircleFill
                  size={42}
                  aria-hidden="true"
                />
              </div>

              <strong className="mt-5 text-base font-semibold text-gray-900">
                Your COD order is confirmed.
              </strong>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Order{' '}
                <b className="font-semibold text-gray-800">
                  #{activeOrder.orderNumber}
                </b>{' '}
                has been placed successfully. You’ll pay when the order arrives.
              </p>
            </div>
          ) : hasPaymentContent ? (
            <div className="min-w-0">{children}</div>
          ) : !review ? (
            <div
              className="space-y-3"
              role="radiogroup"
              aria-label="Payment method"
            >
              {/* Stripe */}
              <label
                className={`
                  flex cursor-pointer items-start gap-3
                  rounded-xl border p-4
                  transition-all duration-200
                  ${
                    value === 'stripe'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="stripe"
                  checked={value === 'stripe'}
                  onChange={() => onChange('stripe')}
                  className="sr-only"
                />

                <span
                  className={`
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                    ${
                      value === 'stripe'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  <RiBankCardLine
                    size={20}
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-semibold text-gray-900">
                      Online payment
                    </strong>

                    {value === 'stripe' && (
                      <RiCheckboxCircleFill
                        size={17}
                        className="shrink-0 text-gray-900"
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    Pay securely with card, UPI and other Stripe-supported methods.
                  </span>

                  <span className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                      Secure checkout
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                      Stripe
                    </span>
                  </span>
                </span>
              </label>

              {/* COD */}
              <label
                className={`
                  flex cursor-pointer items-start gap-3
                  rounded-xl border p-4
                  transition-all duration-200
                  ${
                    value === 'cod'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={value === 'cod'}
                  onChange={() => onChange('cod')}
                  className="sr-only"
                />

                <span
                  className={`
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                    ${
                      value === 'cod'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  <RiCashLine
                    size={20}
                    aria-hidden="true"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-semibold text-gray-900">
                      Cash on Delivery
                    </strong>

                    {value === 'cod' && (
                      <RiCheckboxCircleFill
                        size={17}
                        className="shrink-0 text-gray-900"
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    Pay when your order arrives.
                  </span>

                  <span className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                      Pay on delivery
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                      Order confirmation required
                    </span>
                  </span>
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Delivery */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <RiMapPinLine size={18} aria-hidden="true" />
                  Deliver to
                </div>

                {address && (
                  <div className="mt-3 text-sm leading-6 text-gray-600">
                    <strong className="font-semibold text-gray-900">
                      {address.full_name || 'Delivery address'}
                    </strong>

                    <p className="m-0">{address.line1}</p>

                    {address.line2 && (
                      <p className="m-0">{address.line2}</p>
                    )}

                    <p className="m-0">
                      {address.city}
                      {address.state ? `, ${address.state}` : ''} —{' '}
                      {address.postal_code}, {address.country}
                    </p>

                    {address.email && (
                      <p className="m-0">{address.email}</p>
                    )}

                    {address.phone && (
                      <p className="m-0">{address.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Payment method
                  </span>
                  <strong className="text-sm text-gray-900">
                    {value === 'cod' ? 'Cash on Delivery' : 'Stripe'}
                  </strong>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
                  <span className="text-sm text-gray-500">Total</span>
                  <strong className="text-lg font-semibold text-gray-900">
                    {total}
                  </strong>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-500">
                <RiShieldCheckLine
                  size={17}
                  className="mt-0.5 shrink-0 text-gray-500"
                  aria-hidden="true"
                />
                <span>
                  Your address and order total are reviewed before payment.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isCodSuccess && (
          <footer className="shrink-0 border-t border-gray-100 p-4 sm:px-6">
            <button
              type="button"
              onClick={goToOrderSuccess}
              disabled={loading}
              className="
                inline-flex min-h-11 w-full
                items-center justify-center gap-2
                rounded-lg
                bg-gray-900
                px-5
                text-sm font-medium text-white
                transition-colors
                hover:bg-gray-800
                focus:outline-none
                focus:ring-2 focus:ring-gray-900
                focus:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              View order confirmation
              <RiArrowRightLine size={17} aria-hidden="true" />
            </button>
          </footer>
        )}

        {!isCodSuccess && !review && !locked && (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                min-h-11 rounded-lg px-4
                text-sm font-medium text-gray-700
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2 focus:ring-gray-300
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onContinue}
              disabled={!value || loading}
              className="
                inline-flex min-h-11
                items-center justify-center gap-2
                rounded-lg
                bg-gray-900
                px-5
                text-sm font-medium text-white
                hover:bg-gray-800
                focus:outline-none
                focus:ring-2 focus:ring-gray-900
                focus:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? (
                <>
                  <RiLoader4Line
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Preparing...
                </>
              ) : (
                <>
                  Continue
                  <RiArrowRightLine size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </footer>
        )}

        {!isCodSuccess &&
          review &&
          !hasPaymentContent &&
          !activeOrder && (
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="
                  min-h-11 rounded-lg px-4
                  text-sm font-medium text-gray-700
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2 focus:ring-gray-300
                  disabled:opacity-50
                "
              >
                Back
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={loading}
                className="
                  inline-flex min-h-11
                  items-center justify-center gap-2
                  rounded-lg
                  bg-gray-900
                  px-5
                  text-sm font-medium text-white
                  hover:bg-gray-800
                  focus:outline-none
                  focus:ring-2 focus:ring-gray-900
                  focus:ring-offset-2
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loading ? (
                  <>
                    <RiLoader4Line
                      size={17}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Preparing...
                  </>
                ) : value === 'cod' ? (
                  <>
                    Place COD Order
                    <RiArrowRightLine
                      size={17}
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <RiArrowRightLine
                      size={17}
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </footer>
          )}
      </div>
    </div>
  );
}