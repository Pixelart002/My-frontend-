import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/payments';
import { orderService } from '../../services/orders';
import { useAuth } from '../../context/AuthContext';
import { RiLockLine, RiCheckboxCircleLine, RiRefreshLine, RiArrowRightLine, RiShieldCheckLine } from '@remixicon/react';

function ProcessingPayment() {
  return (
    <div className="payment-processing-screen" role="status" aria-live="polite">
      <div className="payment-processing-ring" aria-hidden="true" />
      <h3>Confirming card payment...</h3>
      <p>Please don’t close this page. We’re waiting for your card payment to finish confirmation.</p>
      <div className="payment-processing-steps" aria-label="Payment progress">
        <div className="payment-processing-step is-done"><span className="payment-processing-dot"><RiCheckboxCircleLine size={18} /></span><span>Card details validated</span></div>
        <div className="payment-processing-step is-active"><span className="payment-processing-dot" /><span>Confirming with bank</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Verifying card payment</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Finalizing order</span></div>
      </div>
      <span className="payment-processing-brand">LUVIIO</span>
    </div>
  );
}

function PaymentPendingState({ orderNumber, onViewOrder }) {
  return (
    <div className="payment-processing-screen payment-pending-screen" role="status" aria-live="polite">
      <div className="payment-processing-ring" aria-hidden="true" />
      <h3>Card payment status is being verified</h3>
      <p>We received the card payment result but the final status is not yet available. We won’t start another payment attempt automatically.</p>
      <p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} remains open while the payment is being verified.</p>
      <div className="payment-form-actions">
        <button className="btn payment-submit-btn" type="button" onClick={onViewOrder}>View order status <RiArrowRightLine size={17} /></button>
      </div>
      <span className="payment-processing-brand">LUVIIO</span>
    </div>
  );
}

function PaymentConfirmationPending({ orderNumber, onViewOrder }) {
  return (
    <div className="payment-processing-screen payment-pending-screen" role="status" aria-live="polite">
      <RiShieldCheckLine size={42} aria-hidden="true" />
      <h3>Card payment received</h3>
      <p>Your card payment was successful. We’re still confirming the order with Luviio, so no new payment attempt will be created.</p>
      <p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} will reflect the confirmed payment after backend reconciliation.</p>
      <div className="payment-form-actions">
        <button className="btn payment-submit-btn" type="button" onClick={onViewOrder}>View order status <RiArrowRightLine size={17} /></button>
      </div>
      <span className="payment-processing-brand">LUVIIO</span>
    </div>
  );
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function StripePaymentForm({ orderNumber, onSuccess, onBack, onRetry, onCancelOrder }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentConfirmationPending, setPaymentConfirmationPending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentElementError, setPaymentElementError] = useState('');
  const [retryAllowed, setRetryAllowed] = useState(false);

  useEffect(() => {
    setPaymentElementMounted(false);
    setPaymentReady(false);
    setPaymentElementError('');
    setRetryAllowed(false);
  }, [stripe, elements]);

  const viewOrder = () => {
    if (orderNumber) navigate(`/orders/${encodeURIComponent(orderNumber)}`);
    else navigate('/orders');
  };

  const reconcileOrder = async () => {
    if (!orderNumber) return null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const order = await orderService.myOrder(orderNumber);
        const status = String(order?.status || '').toLowerCase();
        if (status === 'paid') return order;
        if (status === 'cancelled' || status === 'failed') return order;
      } catch {
        // Never convert an unavailable status lookup into payment success.
      }
      if (attempt < 7) await wait(750);
    }
    return null;
  };

  const finishConfirmedPayment = async (paymentIntent) => {
    try {
      const confirmation = await paymentService.confirm(paymentIntent.id);
      await refreshProfile();
      onSuccess({ ...(confirmation || {}), payment_intent_id: paymentIntent.id });
      return true;
    } catch {
      const reconciled = await reconcileOrder();
      if (String(reconciled?.status || '').toLowerCase() === 'paid') {
        await refreshProfile();
        onSuccess({ status: 'paid', order_number: orderNumber, payment_intent_id: paymentIntent.id });
        return true;
      }
      return false;
    }
  };

  const handleFailedIntent = (intent, fallbackMessage = 'Card payment was not completed. Please check your card details and try again.') => {
    const intentId = intent?.id || paymentIntentId;
    const status = String(intent?.status || '').toLowerCase();
    if (intentId) paymentService.notifyFailed(intentId, fallbackMessage).catch(() => {});
    setPaymentIntentId(intentId);
    setMessage(status === 'requires_payment_method' ? fallbackMessage : 'Card payment could not be completed. Please try again.');
    setRetryAllowed(true);
    setPaymentPending(false);
    setPaymentConfirmationPending(false);
    setProcessing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementMounted || !paymentReady || paymentElementError || processing || retrying || paymentPending || paymentConfirmationPending) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      setPaymentElementMounted(false);
      setPaymentReady(false);
      setMessage('Card payment form is still loading. Please wait a moment and try again.');
      return;
    }

    setProcessing(true);
    setPaymentPending(false);
    setPaymentConfirmationPending(false);
    setMessage('');
    setRetryAllowed(false);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/order/success` },
        redirect: 'if_required',
      });

      if (error) {
        const intent = paymentIntent || error.payment_intent || error.paymentIntent;
        handleFailedIntent(intent, error.message || 'Card payment failed. Check your card details and try again.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const finished = await finishConfirmedPayment(paymentIntent);
        if (!finished) {
          setPaymentConfirmationPending(true);
          setProcessing(false);
          setRetryAllowed(false);
          setMessage('');
        }
        return;
      }

      if (paymentIntent?.status === 'processing') {
        setPaymentPending(true);
        setProcessing(false);
        setRetryAllowed(false);
        return;
      }

      if (paymentIntent?.status === 'requires_payment_method') {
        handleFailedIntent(paymentIntent, 'Card payment was not completed. Please check your card details and try again.');
        return;
      }

      if (paymentIntent?.status === 'requires_action') {
        setMessage('Additional card verification is required. Please complete the verification and try again.');
        setRetryAllowed(true);
        setProcessing(false);
        return;
      }

      setMessage('Card payment could not be completed. Please try again.');
      setRetryAllowed(true);
      setProcessing(false);
    } catch (err) {
      // A rejected Stripe.js confirmation may still carry the PaymentIntent.
      // A requires_payment_method intent is a failed attempt, never an unknown
      // or pending state, so it must be shown as failed instead of "not verified".
      const intent = err?.payment_intent || err?.paymentIntent;
      const intentStatus = String(intent?.status || '').toLowerCase();

      if (intentStatus === 'requires_payment_method') {
        handleFailedIntent(intent, err?.message || 'Card payment was not completed. Please check your card details and try again.');
        return;
      }

      if (intentStatus === 'requires_action') {
        setMessage('Additional card verification is required. Please complete the verification and try again.');
        setRetryAllowed(true);
        setProcessing(false);
        return;
      }

      if (intentStatus === 'processing') {
        setPaymentPending(true);
        setProcessing(false);
        setRetryAllowed(false);
        return;
      }

      const reconciled = await reconcileOrder();
      if (String(reconciled?.status || '').toLowerCase() === 'paid') {
        await refreshProfile();
        onSuccess({ status: 'paid', order_number: orderNumber, payment_intent_id: intent?.id || paymentIntentId || undefined });
        return;
      }
      setProcessing(false);
      setRetryAllowed(false);
      setMessage(err?.message || 'Card payment status could not be confirmed. Please check your order status before trying again.');
    }
  };

  const handleRetry = async () => {
    if (retrying || paymentPending || paymentConfirmationPending) return;

    if (retryAllowed) {
      setMessage('');
      setRetryAllowed(false);
      return;
    }

    if (!onRetry || !orderNumber) return;
    setRetrying(true);
    setMessage('Preparing a fresh card payment attempt…');
    try {
      await onRetry(orderNumber);
      setPaymentPending(false);
      setPaymentConfirmationPending(false);
      setPaymentElementMounted(false);
      setPaymentReady(false);
      setPaymentElementError('');
      setRetryAllowed(false);
      setMessage('');
    } catch (err) {
      setMessage(err?.message || 'Unable to start a new card payment attempt.');
    } finally {
      setRetrying(false);
    }
  };

  const showProcessingOverlay = processing;

  return (
    <form onSubmit={handleSubmit} className="stripe-form payment-stripe-form">
      <div className="payment-element-shell" aria-busy={showProcessingOverlay}>
        <PaymentElement
          id="payment-element"
          onReady={() => {
            setPaymentElementMounted(true);
            setPaymentElementError('');
          }}
          onChange={(event) => {
            setPaymentReady(Boolean(event.complete));
            if (event.error) {
              setMessage(event.error.message || 'Please check your card details.');
              setRetryAllowed(false);
            } else if (!processing) {
              setMessage('');
              setRetryAllowed(false);
            }
          }}
          onLoadError={(event) => {
            setPaymentElementMounted(false);
            setPaymentReady(false);
            setPaymentElementError(event?.error?.message || 'Unable to load the secure card payment form.');
            setRetryAllowed(false);
            setMessage(event?.error?.message || 'Unable to load the secure card payment form. Please try again.');
          }}
        />
        {showProcessingOverlay && <div className="payment-processing-overlay"><ProcessingPayment /></div>}
      </div>
      {paymentPending ? <PaymentPendingState orderNumber={orderNumber} onViewOrder={viewOrder} /> : paymentConfirmationPending ? <PaymentConfirmationPending orderNumber={orderNumber} onViewOrder={viewOrder} /> : null}
      {!paymentPending && !paymentConfirmationPending && message && <div className="form-error payment-form-error" role="alert">{message}</div>}
      {!paymentPending && !paymentConfirmationPending && <div className="payment-form-actions">
        <button className="btn btn-quiet payment-back-btn" type="button" onClick={onCancelOrder || onBack} disabled={retrying || processing}>{onCancelOrder ? 'Cancel order' : 'Back'}</button>
        {message && (retryAllowed || onRetry) && <button className="btn btn-quiet" type="button" onClick={handleRetry} disabled={retrying || processing}><RiRefreshLine size={15} /> {retrying ? 'Retrying…' : 'Retry card payment'}</button>}
        <button className="btn payment-submit-btn" type="submit" disabled={!stripe || !elements || !paymentElementMounted || !paymentReady || Boolean(paymentElementError) || processing || retrying}>
          <RiLockLine size={15} aria-hidden="true" /><span>Pay by card</span>
        </button>
      </div>}
      {!paymentPending && !paymentConfirmationPending && <p className="hint secure-hint">Your card payment is encrypted and processed securely. Order {orderNumber ? `#${orderNumber}` : ''} stays open until payment succeeds or you cancel it.</p>}
    </form>
  );
}
