import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import {
  RiArrowRightLine,
  RiBankCardLine,
  RiCashLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiLockLine,
  RiRefreshLine,
  RiShieldCheckLine,
} from '@remixicon/react';

import { paymentService } from '../../services/payments';
import { orderService } from '../../services/orders';
import { useAuth } from '../../context/AuthContext';

const RETRY_PREFIX = 'luviio:payment-retrying:';
const RECONCILE_ATTEMPTS = 8;
const RECONCILE_DELAY = 750;
const ELEMENT_TIMEOUT = 12000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPaymentRetryKey = (orderNumber) =>
  `${RETRY_PREFIX}${String(orderNumber || '')}`;

const getIntentStatus = (intent) =>
  String(intent?.status || '').toLowerCase();

function ProcessingPayment() {
  return (
    <div
      className="payment-processing-screen"
      role="status"
      aria-live="polite"
    >
      <div
        className="payment-processing-ring"
        aria-hidden="true"
      />

      <h3>Confirming card payment...</h3>

      <p>
        Please don’t close this page. We’re waiting for your card
        payment to finish confirmation.
      </p>

      <div
        className="payment-processing-steps"
        aria-label="Payment progress"
      >
        <div className="payment-processing-step is-done">
          <span className="payment-processing-dot">
            <RiCheckboxCircleLine size={18} />
          </span>
          <span>Card details validated</span>
        </div>

        <div className="payment-processing-step is-active">
          <span className="payment-processing-dot" />
          <span>Confirming with bank</span>
        </div>

        <div className="payment-processing-step">
          <span className="payment-processing-dot" />
          <span>Verifying card payment</span>
        </div>

        <div className="payment-processing-step">
          <span className="payment-processing-dot" />
          <span>Finalizing order</span>
        </div>
      </div>

      <span className="payment-processing-brand">
        LUVIIO
      </span>
    </div>
  );
}

function PaymentPendingState({
  orderNumber,
  onViewOrder,
}) {
  return (
    <div
      className="payment-processing-screen payment-pending-screen"
      role="status"
      aria-live="polite"
    >
      <div
        className="payment-processing-ring"
        aria-hidden="true"
      />

      <h3>Card payment status is being verified</h3>

      <p>
        We received the card payment result, but the final
        status is not yet available.
      </p>

      <p className="hint secure-hint">
        Order {orderNumber ? `#${orderNumber}` : ''} remains open
        while the payment is being verified.
      </p>

      <div className="payment-form-actions">
        <button
          className="btn payment-submit-btn"
          type="button"
          onClick={onViewOrder}
        >
          View order status
          <RiArrowRightLine size={17} aria-hidden="true" />
        </button>
      </div>

      <span className="payment-processing-brand">
        LUVIIO
      </span>
    </div>
  );
}

function PaymentConfirmationPending({
  orderNumber,
  onViewOrder,
}) {
  return (
    <div
      className="payment-processing-screen payment-pending-screen"
      role="status"
      aria-live="polite"
    >
      <RiShieldCheckLine
        size={42}
        aria-hidden="true"
      />

      <h3>Card payment received</h3>

      <p>
        Your card payment was successful. We’re still confirming
        the order with LUVIIO.
      </p>

      <p className="hint secure-hint">
        Order {orderNumber ? `#${orderNumber}` : ''} will reflect
        the confirmed payment after backend reconciliation.
      </p>

      <div className="payment-form-actions">
        <button
          className="btn payment-submit-btn"
          type="button"
          onClick={onViewOrder}
        >
          View order status
          <RiArrowRightLine size={17} aria-hidden="true" />
        </button>
      </div>

      <span className="payment-processing-brand">
        LUVIIO
      </span>
    </div>
  );
}

function PaymentStatusPopup({
  children,
  className = '',
}) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`payment-modal-backdrop payment-status-popup-backdrop ${className}`}
      role="presentation"
    >
      {children}
    </div>,
    document.body,
  );
}

function PaymentMethodChooser({
  value,
  onSelect,
  onClose,
  busy,
}) {
  const chooserRef = useRef(null);
  const closeRef = useRef(null);

  useFocusTrap({
    enabled: true,
    containerRef: chooserRef,
    initialFocusRef: closeRef,
    onEscape: () => {
      if (!busy) {
        onClose();
      }
    },
  });

  const options = [
    {
      id: 'stripe',
      title: 'Online payment',
      description:
        'Pay securely with card or another supported Stripe method.',
      meta: 'Secure checkout',
      Icon: RiBankCardLine,
    },
    {
      id: 'cod',
      title: 'Cash on Delivery',
      description:
        'Keep this order and pay when your delivery arrives.',
      meta: 'Pay on delivery',
      Icon: RiCashLine,
    },
  ];

  return createPortal(
    <div
      className="payment-modal-backdrop payment-method-switch-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={chooserRef}
        className="payment-method-switch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-method-switch-title"
        tabIndex={-1}
      >
        <header className="payment-method-switch-header">
          <div>
            <p className="eyebrow">Payment method</p>

            <h3 id="payment-method-switch-title">
              Choose another payment method
            </h3>

            <p>
              Your order, delivery address and total stay the
              same.
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="btn btn-quiet btn-icon"
            aria-label="Close payment method chooser"
            onClick={onClose}
            disabled={busy}
          >
            <RiCloseLine
              size={20}
              aria-hidden="true"
            />
          </button>
        </header>

        <div
          className="payment-method-switch-options"
          role="radiogroup"
          aria-label="Available payment methods"
        >
          {options.map(
            ({
              id,
              title,
              description,
              meta,
              Icon,
            }) => {
              const selected = value === id;

              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`payment-method-switch-option ${
                    selected ? 'is-selected' : ''
                  }`}
                  onClick={() => onSelect(id)}
                  disabled={busy}
                >
                  <span className="payment-method-switch-icon">
                    <Icon
                      size={20}
                      aria-hidden="true"
                    />
                  </span>

                  <span className="payment-method-switch-copy">
                    <span className="payment-method-switch-title">
                      {title}

                      {selected && (
                        <span className="payment-method-switch-selected">
                          Selected
                        </span>
                      )}
                    </span>

                    <small>
                      {description}
                    </small>

                    <span className="payment-method-switch-meta">
                      {meta}
                    </span>
                  </span>

                  {selected && (
                    <RiCheckboxCircleLine
                      className="payment-method-switch-check"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            },
          )}
        </div>

        <p className="payment-method-switch-note">
          Switching payment methods does not rebuild your cart
          or ask you to enter delivery details again.
        </p>
      </div>
    </div>,
    document.body,
  );
}

export default function StripePaymentForm({
  orderNumber,
  clientSecret,
  onSuccess,
  onRetry,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentConfirmationPending, setPaymentConfirmationPending] =
    useState(false);

  const [retrying, setRetrying] = useState(() => {
    if (
      typeof window === 'undefined' ||
      !orderNumber
    ) {
      return false;
    }

    return (
      window.sessionStorage.getItem(
        getPaymentRetryKey(orderNumber),
      ) === '1'
    );
  });

  const [paymentIntentId, setPaymentIntentId] =
    useState('');

  const [paymentElementMounted, setPaymentElementMounted] =
    useState(false);

  const [paymentReady, setPaymentReady] =
    useState(false);

  const [paymentElementError, setPaymentElementError] =
    useState('');

  const [stripeLoadingTimedOut, setStripeLoadingTimedOut] =
    useState(false);

  const [elementKey, setElementKey] =
    useState(0);

  const [switchingMethod, setSwitchingMethod] =
    useState(false);

  const [methodChooserOpen, setMethodChooserOpen] =
    useState(false);

  const [retryAllowed, setRetryAllowed] =
    useState(false);

  const showTerminalState =
    paymentPending ||
    paymentConfirmationPending;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setPaymentElementMounted(false);
    setPaymentReady(false);
    setPaymentElementError('');
    setStripeLoadingTimedOut(false);
    setRetryAllowed(false);
  }, [stripe, elements]);

  useEffect(() => {
    if (
      showTerminalState ||
      paymentElementMounted ||
      retrying ||
      switchingMethod ||
      !stripe ||
      !elements
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (!mountedRef.current) return;

      setStripeLoadingTimedOut(true);
      setPaymentElementError(
        'The secure card payment form is taking too long to load.',
      );
    }, ELEMENT_TIMEOUT);

    return () => window.clearTimeout(timer);
  }, [
    showTerminalState,
    paymentElementMounted,
    retrying,
    switchingMethod,
    elementKey,
    stripe,
    elements,
  ]);

  const clearRetryMarker = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      orderNumber
    ) {
      window.sessionStorage.removeItem(
        getPaymentRetryKey(orderNumber),
      );
    }
  }, [orderNumber]);

  const markRetrying = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      orderNumber
    ) {
      window.sessionStorage.setItem(
        getPaymentRetryKey(orderNumber),
        '1',
      );
    }
  }, [orderNumber]);

  const viewOrder = useCallback(() => {
    if (orderNumber) {
      navigate(
        `/orders/${encodeURIComponent(orderNumber)}`,
      );
      return;
    }

    navigate('/orders');
  }, [navigate, orderNumber]);

  const reconcileOrder = useCallback(async () => {
    if (!orderNumber) {
      return null;
    }

    for (
      let attempt = 0;
      attempt < RECONCILE_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const order =
          await orderService.myOrder(orderNumber);

        const status = String(
          order?.status || '',
        ).toLowerCase();

        if (
          status === 'paid' ||
          status === 'cancelled' ||
          status === 'failed'
        ) {
          return order;
        }
      } catch {
        // Continue reconciliation.
      }

      if (
        attempt <
        RECONCILE_ATTEMPTS - 1
      ) {
        await wait(RECONCILE_DELAY);
      }
    }

    return null;
  }, [orderNumber]);

  const finishConfirmedPayment = useCallback(
    async (paymentIntent) => {
      try {
        const confirmation =
          await paymentService.confirm(
            paymentIntent.id,
          );

        try {
          await refreshProfile();
        } catch {
          // Profile refresh is non-critical.
        }

        onSuccess({
          ...(confirmation || {}),
          payment_intent_id: paymentIntent.id,
        });

        return true;
      } catch {
        const reconciled =
          await reconcileOrder();

        if (
          String(
            reconciled?.status || '',
          ).toLowerCase() === 'paid'
        ) {
          try {
            await refreshProfile();
          } catch {
            // Profile refresh is non-critical.
          }

          onSuccess({
            status: 'paid',
            order_number: orderNumber,
            payment_intent_id: paymentIntent.id,
          });

          return true;
        }

        return false;
      }
    },
    [
      onSuccess,
      orderNumber,
      reconcileOrder,
      refreshProfile,
    ],
  );

  const handleFailedIntent = useCallback(
    async (
      intent,
      fallbackMessage,
    ) => {
      const intentId =
        intent?.id || paymentIntentId;

      const paymentStatus =
        getIntentStatus(intent);

      setProcessing(true);
      setRetryAllowed(false);

      if (intentId) {
        try {
          await paymentService.notifyFailed(
            intentId,
            fallbackMessage,
          );
        } catch {
          // Failure reporting is best-effort.
        }
      }

      if (!mountedRef.current) {
        return;
      }

      setPaymentIntentId(intentId);
      setMessage(
        paymentStatus ===
          'requires_payment_method'
          ? fallbackMessage
          : 'Card payment could not be completed. Please try again.',
      );

      setRetryAllowed(true);
      setPaymentPending(false);
      setPaymentConfirmationPending(false);
      setProcessing(false);
    },
    [paymentIntentId],
  );

  const handleUnresolvedConfirmation =
    useCallback(
      (
        intent,
        fallbackMessage,
      ) => {
        setPaymentIntentId(
          intent?.id || paymentIntentId,
        );

        setPaymentPending(false);
        setPaymentConfirmationPending(false);
        setProcessing(false);
        setRetryAllowed(true);

        setMessage(
          fallbackMessage ||
            'Card verification could not be completed. Please try the payment again.',
        );
      },
      [paymentIntentId],
    );

  const reloadCardForm = useCallback(() => {
    if (
      processing ||
      retrying ||
      switchingMethod
    ) {
      return;
    }

    setMessage('');
    setPaymentElementError('');
    setStripeLoadingTimedOut(false);
    setPaymentElementMounted(false);
    setPaymentReady(false);
    setRetryAllowed(false);

    setElementKey(
      (current) => current + 1,
    );
  }, [
    processing,
    retrying,
    switchingMethod,
  ]);

  const openPaymentMethodChooser =
    useCallback(() => {
      if (
        !orderNumber ||
        processing ||
        retrying ||
        switchingMethod ||
        showTerminalState
      ) {
        return;
      }

      setMessage('');
      setMethodChooserOpen(true);
    }, [
      orderNumber,
      processing,
      retrying,
      switchingMethod,
      showTerminalState,
    ]);

  const switchPaymentMethod =
    useCallback(
      async (method) => {
        if (
          !orderNumber ||
          switchingMethod ||
          processing ||
          retrying ||
          showTerminalState
        ) {
          return;
        }

        setSwitchingMethod(true);
        setMessage('');

        try {
          if (method === 'stripe') {
            setMethodChooserOpen(false);

            if (!onRetry) {
              throw new Error(
                'A new card payment session is unavailable.',
              );
            }

            await onRetry(orderNumber);

            setPaymentPending(false);
            setPaymentConfirmationPending(false);
            setPaymentElementMounted(false);
            setPaymentReady(false);
            setPaymentElementError('');
            setStripeLoadingTimedOut(false);
            setRetryAllowed(false);

            setElementKey(
              (current) => current + 1,
            );

            return;
          }

          await paymentService.switchMethod(
            orderNumber,
            method,
          );

          setMethodChooserOpen(false);

          await refreshProfile().catch(
            () => {},
          );

          navigate(
            `/order/success?${new URLSearchParams(
              {
                order: orderNumber,
                payment: 'cod',
              },
            ).toString()}`,
            {
              replace: true,
            },
          );
        } catch (error) {
          setMessage(
            error?.message ||
              'Unable to switch payment method right now. Please try again.',
          );
        } finally {
          setSwitchingMethod(false);
        }
      },
      [
        navigate,
        onRetry,
        orderNumber,
        processing,
        refreshProfile,
        retrying,
        showTerminalState,
        switchingMethod,
      ],
    );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      submittingRef.current ||
      !stripe ||
      !elements ||
      !paymentElementMounted ||
      !paymentReady ||
      paymentElementError ||
      processing ||
      retrying ||
      switchingMethod ||
      showTerminalState
    ) {
      return;
    }

    const paymentElement =
      elements.getElement(PaymentElement);

    if (!paymentElement) {
      setPaymentElementMounted(false);
      setPaymentReady(false);
      setMessage(
        'Secure card form is still loading. Please wait a moment and try again.',
      );
      return;
    }

    submittingRef.current = true;
    setProcessing(true);
    setMessage('');
    setRetryAllowed(false);

    try {
      const result =
        await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/order/success`,
          },
          redirect: 'if_required',
        });

      const {
        error,
        paymentIntent,
      } = result;

      if (error) {
        const intent =
          paymentIntent ||
          error.payment_intent ||
          error.paymentIntent;

        const status =
          getIntentStatus(intent);

        if (
          status === 'requires_action'
        ) {
          handleUnresolvedConfirmation(
            intent,
            error.message ||
              'Card verification could not be completed. Please try the payment again.',
          );
          return;
        }

        await handleFailedIntent(
          intent,
          error.message ||
            'Card payment failed. Check your card details and try again.',
        );

        return;
      }

      const status =
        getIntentStatus(paymentIntent);

      if (status === 'succeeded') {
        const completed =
          await finishConfirmedPayment(
            paymentIntent,
          );

        if (completed) {
          return;
        }

        setPaymentConfirmationPending(true);
        setProcessing(false);
        return;
      }

      if (status === 'processing') {
        setPaymentPending(true);
        setProcessing(false);
        return;
      }

      if (
        status ===
        'requires_payment_method'
      ) {
        await handleFailedIntent(
          paymentIntent,
          'Card payment was not completed. Please check your card details and try again.',
        );
        return;
      }

      if (
        status === 'requires_action'
      ) {
        handleUnresolvedConfirmation(
          paymentIntent,
          'Card verification could not be completed. Please try the payment again.',
        );
        return;
      }

      setProcessing(false);
      setRetryAllowed(true);
      setMessage(
        'Card payment could not be completed. Please try again.',
      );
    } catch (error) {
      const intent =
        error?.payment_intent ||
        error?.paymentIntent;

      const status =
        getIntentStatus(intent);

      if (
        status ===
        'requires_payment_method'
      ) {
        await handleFailedIntent(
          intent,
          error?.message ||
            'Card payment was not completed. Please check your card details and try again.',
        );
        return;
      }

      if (
        status === 'requires_action'
      ) {
        handleUnresolvedConfirmation(
          intent,
          error?.message ||
            'Card verification could not be completed. Please try the payment again.',
        );
        return;
      }

      if (
        status === 'processing'
      ) {
        setPaymentPending(true);
        setProcessing(false);
        return;
      }

      const reconciled =
        await reconcileOrder();

      if (
        String(
          reconciled?.status || '',
        ).toLowerCase() === 'paid'
      ) {
        try {
          await refreshProfile();
        } catch {
          // Profile refresh is non-critical.
        }

        onSuccess({
          status: 'paid',
          order_number: orderNumber,
          payment_intent_id:
            intent?.id ||
            paymentIntentId ||
            undefined,
        });

        return;
      }

      setProcessing(false);
      setRetryAllowed(true);

      setMessage(
        error?.message ||
          'Card payment status could not be confirmed. Please check your order status before trying again.',
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const handleRetry = async () => {
    if (
      submittingRef.current ||
      retrying ||
      processing ||
      switchingMethod ||
      showTerminalState
    ) {
      return;
    }

    if (
      onRetry &&
      orderNumber
    ) {
      setRetrying(true);
      markRetrying();

      setMessage('');
      setRetryAllowed(false);

      try {
        await onRetry(orderNumber);

        setPaymentPending(false);
        setPaymentConfirmationPending(false);
        setPaymentElementMounted(false);
        setPaymentReady(false);
        setPaymentElementError('');
        setStripeLoadingTimedOut(false);
      } catch (error) {
        clearRetryMarker();

        setRetryAllowed(true);
        setMessage(
          error?.message ||
            'Unable to start a new card payment attempt.',
        );

        setRetrying(false);
      }

      return;
    }

    reloadCardForm();
  };

  const handleElementReady = () => {
    setPaymentElementMounted(true);
    setPaymentReady(false);
    setPaymentElementError('');
    setStripeLoadingTimedOut(false);

    if (retrying) {
      clearRetryMarker();
      setRetrying(false);
      setRetryAllowed(false);
      setMessage('');
    }
  };

  const handleElementChange = (
    event,
  ) => {
    setPaymentReady(
      Boolean(event.complete),
    );

    if (event.error) {
      setMessage(
        event.error.message ||
          'Please check your payment details.',
      );
      return;
    }

    if (
      !processing &&
      !retrying &&
      !retryAllowed
    ) {
      setMessage('');
    }
  };

  const handleElementError = (
    event,
  ) => {
    clearRetryMarker();

    const errorMessage =
      event?.error?.message ||
      'Unable to load the secure card payment form.';

    setPaymentElementMounted(false);
    setPaymentReady(false);
    setPaymentElementError(
      errorMessage,
    );
    setStripeLoadingTimedOut(false);
    setRetrying(false);
    setMessage(errorMessage);
  };

  const loadingState =
    !showTerminalState &&
    !paymentElementMounted &&
    !paymentElementError &&
    !stripeLoadingTimedOut;

  const showLoadRecovery =
    !showTerminalState &&
    Boolean(
      paymentElementError ||
        stripeLoadingTimedOut,
    );

  const showProcessingOverlay =
    processing;

  const showFailureActions =
    !showTerminalState &&
    !showLoadRecovery &&
    Boolean(message) &&
    retryAllowed;

  /*
   * clientSecret is intentionally not passed directly
   * into PaymentElement here.
   *
   * Stripe Elements receives the client secret through
   * the parent <Elements options={{ clientSecret }}>.
   */
  if (!clientSecret) {
    return (
      <div
        className="form-error payment-form-error"
        role="alert"
      >
        Payment session is unavailable. Please restart
        checkout and try again.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="stripe-form payment-stripe-form"
      noValidate
    >
      {!showTerminalState && (
        <>
          {loadingState && (
            <div
              className="payment-element-loading"
              role="status"
              aria-live="polite"
            >
              <span
                className="payment-element-loading-ring"
                aria-hidden="true"
              />

              <span>
                Loading secure payment...
              </span>
            </div>
          )}

          <div
            className="payment-element-shell"
            aria-busy={
              showProcessingOverlay ||
              retrying ||
              loadingState
            }
          >
            <PaymentElement
              key={elementKey}
              id="payment-element"
              onReady={handleElementReady}
              onChange={handleElementChange}
              onLoadError={handleElementError}
            />
          </div>

          {showLoadRecovery && (
            <div
              className="payment-load-recovery"
              role="alert"
            >
              <div className="payment-load-recovery-copy">
                <strong>
                  Card payment isn’t available right now.
                </strong>

                <span>
                  {paymentElementError ||
                    'The secure card form could not be loaded.'}
                </span>
              </div>

              <div className="payment-load-recovery-actions">
                <button
                  className="btn payment-secondary-action"
                  type="button"
                  onClick={handleRetry}
                  disabled={
                    switchingMethod ||
                    processing ||
                    retrying
                  }
                >
                  <RiRefreshLine
                    size={16}
                    aria-hidden="true"
                  />
                  Retry
                </button>

                <button
                  className="btn payment-submit-btn"
                  type="button"
                  onClick={
                    openPaymentMethodChooser
                  }
                  disabled={
                    switchingMethod ||
                    processing ||
                    retrying
                  }
                >
                  <RiBankCardLine
                    size={16}
                    aria-hidden="true"
                  />
                  Choose another method
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showProcessingOverlay && (
        <PaymentStatusPopup
          className="payment-processing-popup"
        >
          <ProcessingPayment />
        </PaymentStatusPopup>
      )}

      {retrying &&
        !showProcessingOverlay && (
          <PaymentStatusPopup className="payment-retry-popup">
            <div
              className="payment-retry-state"
              role="status"
              aria-live="polite"
            >
              <span
                className="payment-processing-ring"
                aria-hidden="true"
              />

              <strong>
                Retrying payment...
              </strong>

              <span>
                Preparing a new secure card session.
              </span>
            </div>
          </PaymentStatusPopup>
        )}

      {paymentPending && (
        <PaymentPendingState
          orderNumber={orderNumber}
          onViewOrder={viewOrder}
        />
      )}

      {paymentConfirmationPending && (
        <PaymentConfirmationPending
          orderNumber={orderNumber}
          onViewOrder={viewOrder}
        />
      )}

      {!showTerminalState &&
        message &&
        !showLoadRecovery && (
          <div
            className="form-error payment-form-error"
            role="alert"
          >
            {message}
          </div>
        )}

      {!showTerminalState &&
        showFailureActions && (
          <div
            className="payment-error-actions"
            role="group"
            aria-label="Payment recovery actions"
          >
            <button
              className="btn payment-submit-btn"
              type="button"
              onClick={handleRetry}
              disabled={
                processing ||
                retrying ||
                switchingMethod
              }
            >
              <RiRefreshLine
                size={16}
                aria-hidden="true"
              />
              Retry
            </button>

            <button
              className="btn btn-quiet payment-secondary-action"
              type="button"
              onClick={
                openPaymentMethodChooser
              }
              disabled={
                processing ||
                retrying ||
                switchingMethod
              }
            >
              <RiBankCardLine
                size={16}
                aria-hidden="true"
              />
              Choose another method
            </button>
          </div>
        )}

      {!showTerminalState &&
        !showFailureActions &&
        !showLoadRecovery && (
          <div className="payment-form-actions">
            <button
              className="btn payment-submit-btn payment-submit-primary"
              type="submit"
              disabled={
                !stripe ||
                !elements ||
                !paymentElementMounted ||
                !paymentReady ||
                Boolean(paymentElementError) ||
                processing ||
                retrying ||
                switchingMethod ||
                retryAllowed
              }
            >
              <RiLockLine
                size={15}
                aria-hidden="true"
              />

              <span>
                Pay by card
              </span>

              <RiArrowRightLine
                size={17}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

      {!showTerminalState && (
        <p className="hint secure-hint">
          <RiShieldCheckLine
            size={15}
            aria-hidden="true"
          />

          <span>
            Securely encrypted payment. Order{' '}
            {orderNumber
              ? `#${orderNumber}`
              : ''}{' '}
            stays open until payment succeeds or you
            cancel it.
          </span>
        </p>
      )}

      {methodChooserOpen && (
        <PaymentMethodChooser
          value="stripe"
          onSelect={switchPaymentMethod}
          onClose={() => {
            if (!switchingMethod) {
              setMethodChooserOpen(false);
            }
          }}
          busy={switchingMethod}
        />
      )}
    </form>
  );
}