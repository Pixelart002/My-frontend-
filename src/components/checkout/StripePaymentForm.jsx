import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';
import { RiLockLine, RiCheckboxCircleLine, RiRefreshLine } from '@remixicon/react';

function ProcessingPayment() {
  return (
    <div className="payment-processing-screen" role="status" aria-live="polite">
      <div className="payment-processing-ring" aria-hidden="true" />
      <h3>Processing payment...</h3>
      <p>Please don’t close this page. This may take a few seconds.</p>
      <div className="payment-processing-steps" aria-label="Payment progress">
        <div className="payment-processing-step is-done"><span className="payment-processing-dot"><RiCheckboxCircleLine size={18} /></span><span>Validating payment details</span></div>
        <div className="payment-processing-step is-active"><span className="payment-processing-dot" /><span>Processing with bank</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Confirming payment</span></div>
        <div className="payment-processing-step"><span className="payment-processing-dot" /><span>Creating your order</span></div>
      </div>
      <span className="payment-processing-brand">LUVIIO</span>
    </div>
  );
}

export default function StripePaymentForm({ orderNumber, onSuccess, onBack, onRetry, onCancelOrder }) {
  const stripe = useStripe();
  const elements = useElements();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing || retrying) return;
    setProcessing(true);
    setMessage('');

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

    if (paymentIntent && paymentIntent.status === 'succeeded') {
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

    setMessage('Payment requires further action. Please retry.');
    setProcessing(false);
  };

  const handleRetry = async () => {
    if (!onRetry || retrying || !orderNumber) return;
    setRetrying(true);
    setMessage('Preparing a fresh payment attempt…');
    try {
      await onRetry(orderNumber);
    } catch (err) {
      setMessage(err?.message || 'Unable to start a new payment attempt.');
    } finally {
      setRetrying(false);
    }
  };

  if (processing) return <ProcessingPayment />;

  return (
    <form onSubmit={handleSubmit} className="stripe-form payment-stripe-form">
      <div className="payment-element-shell"><PaymentElement id="payment-element" /></div>
      {message && <div className="form-error payment-form-error" role="alert">{message}</div>}
      <div className="payment-form-actions">
        <button className="btn btn-quiet payment-back-btn" type="button" onClick={onCancelOrder || onBack} disabled={retrying || processing}>{onCancelOrder ? 'Cancel order' : 'Back'}</button>
        {message && <button className="btn btn-quiet" type="button" onClick={handleRetry} disabled={retrying || processing || !onRetry}><RiRefreshLine size={15} /> {retrying ? 'Retrying…' : 'Retry payment'}</button>}
        <button className="btn payment-submit-btn" type="submit" disabled={!stripe || !elements || processing || retrying}>
          <RiLockLine size={15} aria-hidden="true" /><span>Pay securely</span>
        </button>
      </div>
      <p className="hint secure-hint">Payments are encrypted and processed securely by Stripe. Order {orderNumber ? `#${orderNumber}` : ''} stays open until payment succeeds or you cancel it.</p>
    </form>
  );
}
