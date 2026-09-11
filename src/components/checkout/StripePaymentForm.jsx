import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { RiLockLine, RiCheckboxCircleLine, RiRefreshLine, RiArrowRightLine, RiShieldCheckLine } from '@remixicon/react';

function ProcessingPayment() {
  return (
    <div className="payment-processing-screen" role="status" aria-live="polite">
      <div className="payment-processing-ring" aria-hidden="true" />
      <h3>Confirming payment...</h3>
      <p>Please don’t close this page. We’re waiting for the payment provider to finish confirmation.</p>
      <div className="payment-processing-steps" aria-label="Payment progress">
        <div className="payment-processing-step is-done"><span className="payment-processing-dot"><RiCheckboxCircleLine size={18} /></span><span>Payment details validated</span></div>
        <div className="payment-processing-step is-active"><span className="payment-processing-dot" /><span>Confirming with bank</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Verifying payment</span></div>
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
      <h3>Payment status is being verified</h3>
      <p>We received the payment result but the final status is not yet available. We won’t start another payment attempt automatically.</p>
      <p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} remains open while the payment provider finishes processing.</p>
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
      <h3>Payment received</h3>
      <p>Your payment was successful. We’re still confirming the order with Luviio, so no new payment attempt will be created.</p>
      <p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} will reflect the confirmed payment after backend reconciliation.</p>
      <div className="payment-form-actions">
        <button className="btn payment-submit-btn" type="button" onClick={onViewOrder}>View order status <RiArrowRightLine size={17} /></button>
      </div>
      <span className="payment-processing-brand">LUVIIO</span>
    </div>
  );
}

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementMounted || !paymentReady || paymentElementError || processing || retrying || paymentPending || paymentConfirmationPending) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      setPaymentElementMounted(false);
      setPaymentReady(false);
      setMessage('Payment form is still loading. Please wait a moment and try again.');
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
        const intentId = paymentIntent?.id || paymentIntentId;
        if (intentId) paymentService.notifyFailed(intentId, error.message || '').catch(() => {});
        setPaymentIntentId(intentId);
        setMessage(error.message || 'Payment failed. Check your payment details and try again.');
        setRetryAllowed(error.type === 'card_error' || error.type === 'validation_error');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        try {
          const confirmation = await paymentService.confirm(paymentIntent.id);
          await refreshProfile();
          onSuccess({ ...(confirmation || {}), payment_intent_id: paymentIntent.id });
        } catch (err) {
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

      setMessage('Payment requires further action. Please complete the required step and try again.');
      setRetryAllowed(true);
      setProcessing(false);
    } catch (err) {
      setPaymentPending(true);
      setProcessing(false);
      setRetryAllowed(false);
      setMessage('Payment status could not be confirmed safely. Check your order status before starting another payment attempt.');
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
    setMessage('Preparing a fresh payment attempt…');
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
      setMessage(err?.message || 'Unable to start a new payment attempt.');
    } finally {
      setRetrying(false);
    }
  };

  if (processing) return <ProcessingPayment />;
  if (paymentPending) return <PaymentPendingState orderNumber={orderNumber} onViewOrder={viewOrder} />;
  if (paymentConfirmationPending) return <PaymentConfirmationPending orderNumber={orderNumber} onViewOrder={viewOrder} />;

  return (
    <form onSubmit={handleSubmit} className="stripe-form payment-stripe-form">
      <div className="payment-element-shell">
        <PaymentElement
          id="payment-element"
          onReady={() => {
            setPaymentElementMounted(true);
            setPaymentElementError('');
          }}
          onChange={(event) => {
            setPaymentReady(Boolean(event.complete));
            if (event.error) {
              setMessage(event.error.message || 'Please check your payment details.');
              setRetryAllowed(false);
            } else {
              setMessage('');
              setRetryAllowed(false);
            }
          }}
          onLoadError={(event) => {
            setPaymentElementMounted(false);
            setPaymentReady(false);
            setPaymentElementError(event?.error?.message || 'Unable to load the secure payment form.');
            setRetryAllowed(false);
            setMessage(event?.error?.message || 'Unable to load the secure payment form. Please try again.');
          }}
        />
      </div>
      {message && <div className="form-error payment-form-error" role="alert">{message}</div>}
      <div className="payment-form-actions">
        <button className="btn btn-quiet payment-back-btn" type="button" onClick={onCancelOrder || onBack} disabled={retrying || processing || paymentPending || paymentConfirmationPending}>{onCancelOrder ? 'Cancel order' : 'Back'}</button>
        {message && (retryAllowed || onRetry) && <button className="btn btn-quiet" type="button" onClick={handleRetry} disabled={retrying || processing || paymentPending || paymentConfirmationPending}><RiRefreshLine size={15} /> {retrying ? 'Retrying…' : 'Retry payment'}</button>}
        <button className="btn payment-submit-btn" type="submit" disabled={!stripe || !elements || !paymentElementMounted || !paymentReady || Boolean(paymentElementError) || processing || retrying || paymentPending || paymentConfirmationPending}>
          <RiLockLine size={15} aria-hidden="true" /><span>Pay securely</span>
        </button>
      </div>
      <p className="hint secure-hint">Payments are encrypted and processed securely by Stripe. Order {orderNumber ? `#${orderNumber}` : ''} stays open until payment succeeds or you cancel it.</p>
    </form>
  );
}
