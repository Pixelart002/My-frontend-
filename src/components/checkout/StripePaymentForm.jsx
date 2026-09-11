import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { RiLockLine, RiCheckboxCircleLine, RiRefreshLine, RiArrowRightLine } from '@remixicon/react';

function ProcessingPayment({ onCancelOrder }) {
  return (
    <div className="payment-processing-screen" role="status" aria-live="polite">
      <div className="payment-processing-ring" aria-hidden="true" />
      <h3>Confirming payment...</h3>
      <p>Please don’t close this page. Your order is already created and is waiting for payment confirmation.</p>
      <div className="payment-processing-steps" aria-label="Payment progress">
        <div className="payment-processing-step is-done"><span className="payment-processing-dot"><RiCheckboxCircleLine size={18} /></span><span>Payment details validated</span></div>
        <div className="payment-processing-step is-active"><span className="payment-processing-dot" /><span>Confirming with bank</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Verifying payment</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Finalizing order</span></div>
      </div>
      <button className="btn btn-quiet payment-processing-cancel" type="button" onClick={onCancelOrder}>Cancel order</button>
      <span className="payment-processing-brand">LUVIIO</span>
    </div>
  );
}

function PaymentPendingState({ orderNumber, onCancelOrder, onViewOrder }) {
  return (
    <div className="payment-processing-screen payment-pending-screen" role="status" aria-live="polite">
      <div className="payment-processing-ring" aria-hidden="true" />
      <h3>Payment is processing</h3>
      <p>Your payment provider is still processing this payment. We won’t create another payment attempt while this one is active.</p>
      <p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} is already created and will be updated when payment confirmation arrives.</p>
      <div className="payment-form-actions">
        <button className="btn btn-quiet" type="button" onClick={onCancelOrder}>Cancel order</button>
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
  const [retrying, setRetrying] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementMounted || !paymentReady || processing || retrying || paymentPending) return;
    setProcessing(true);
    setPaymentPending(false);
    setMessage('');

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
        setMessage(error.message || 'Payment failed. You can retry this order without leaving checkout.');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        try {
          const confirmation = await paymentService.confirm(paymentIntent.id);
          await refreshProfile();
          onSuccess({ ...(confirmation || {}), payment_intent_id: paymentIntent.id });
        } catch (err) {
          setMessage('Payment was successful, but confirming your order hit a snag. Please retry.');
          setProcessing(false);
        }
        return;
      }

      if (paymentIntent?.status === 'processing') {
        setPaymentPending(true);
        setProcessing(false);
        return;
      }

      setMessage('Payment requires further action. Please retry.');
      setProcessing(false);
    } catch (err) {
      setMessage(err?.message || 'We could not complete the payment. Please retry.');
      setProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!onRetry || retrying || !orderNumber || paymentPending) return;
    setRetrying(true);
    setMessage('Preparing a fresh payment attempt…');
    try {
      await onRetry(orderNumber);
      setPaymentPending(false);
      setMessage('');
    } catch (err) {
      setMessage(err?.message || 'Unable to start a new payment attempt.');
    } finally {
      setRetrying(false);
    }
  };

  if (processing) return <ProcessingPayment onCancelOrder={onCancelOrder} />;
  if (paymentPending) return <PaymentPendingState orderNumber={orderNumber} onCancelOrder={onCancelOrder} onViewOrder={() => navigate(`/orders/${encodeURIComponent(orderNumber)}`)} />;

  return (
    <form onSubmit={handleSubmit} className="stripe-form payment-stripe-form">
      <div className="payment-element-shell">
        <PaymentElement
          id="payment-element"
          onReady={() => setPaymentElementMounted(true)}
          onChange={(event) => setPaymentReady(event.complete)}
        />
      </div>
      {message && <div className="form-error payment-form-error" role="alert">{message}</div>}
      <div className="payment-form-actions">
        <button className="btn btn-quiet payment-back-btn" type="button" onClick={onCancelOrder || onBack} disabled={retrying || processing}>{onCancelOrder ? 'Cancel order' : 'Back'}</button>
        {message && <button className="btn btn-quiet" type="button" onClick={handleRetry} disabled={retrying || processing || !onRetry || paymentPending}><RiRefreshLine size={15} /> {retrying ? 'Retrying…' : 'Retry payment'}</button>}
        <button className="btn payment-submit-btn" type="submit" disabled={!stripe || !elements || !paymentElementMounted || !paymentReady || processing || retrying || paymentPending}>
          <RiLockLine size={15} aria-hidden="true" /><span>Pay securely</span>
        </button>
      </div>
      <p className="hint secure-hint">Payments are encrypted and processed securely by Stripe. Order {orderNumber ? `#${orderNumber}` : ''} stays open until payment succeeds or you cancel it.</p>
    </form>
  );
}
