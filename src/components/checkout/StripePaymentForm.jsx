import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/payments';
import { orderService } from '../../services/orders';
import { useAuth } from '../../context/AuthContext';
import { RiLockLine, RiCheckboxCircleLine, RiRefreshLine, RiArrowRightLine, RiShieldCheckLine, RiBankCardLine, RiCashLine, RiCloseLine } from '@remixicon/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

function ProcessingPayment() {
  return <div className="payment-processing-screen" role="status" aria-live="polite"><div className="payment-processing-ring" aria-hidden="true" /><h3>Confirming card payment...</h3><p>Please don’t close this page. We’re waiting for your card payment to finish confirmation.</p><div className="payment-processing-steps" aria-label="Payment progress"><div className="payment-processing-step is-done"><span className="payment-processing-dot"><RiCheckboxCircleLine size={18} /></span><span>Card details validated</span></div><div className="payment-processing-step is-active"><span className="payment-processing-dot" /><span>Confirming with bank</span></div><div className="payment-processing-step"><span className="payment-processing-dot" /><span>Verifying card payment</span></div><div className="payment-processing-step"><span className="payment-processing-dot" /><span>Finalizing order</span></div></div><span className="payment-processing-brand">LUVIIO</span></div>;
}

function PaymentPendingState({ orderNumber, onViewOrder }) {
  return <div className="payment-processing-screen payment-pending-screen" role="status" aria-live="polite"><div className="payment-processing-ring" aria-hidden="true" /><h3>Card payment status is being verified</h3><p>We received the card payment result but the final status is not yet available. We won’t start another payment attempt automatically.</p><p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} remains open while the payment is being verified.</p><div className="payment-form-actions"><button className="btn payment-submit-btn" type="button" onClick={onViewOrder}>View order status <RiArrowRightLine size={17} /></button></div><span className="payment-processing-brand">LUVIIO</span></div>;
}

function PaymentConfirmationPending({ orderNumber, onViewOrder }) {
  return <div className="payment-processing-screen payment-pending-screen" role="status" aria-live="polite"><RiShieldCheckLine size={42} aria-hidden="true" /><h3>Card payment received</h3><p>Your card payment was successful. We’re still confirming the order with Luviio, so no new payment attempt will be created.</p><p className="hint secure-hint">Order {orderNumber ? `#${orderNumber}` : ''} will reflect the confirmed payment after backend reconciliation.</p><div className="payment-form-actions"><button className="btn payment-submit-btn" type="button" onClick={onViewOrder}>View order status <RiArrowRightLine size={17} /></button></div><span className="payment-processing-brand">LUVIIO</span></div>;
}

function PaymentStatusPopup({ children, className = '' }) {
  if (typeof document === 'undefined') return null;
  return createPortal(<div className={`payment-modal-backdrop payment-status-popup-backdrop ${className}`} role="presentation">{children}</div>, document.body);
}

function PaymentMethodChooser({ value, onSelect, onClose, busy }) {
  const chooserRef = useRef(null);
  const closeRef = useRef(null);
  useFocusTrap({
    enabled: true,
    containerRef: chooserRef,
    initialFocusRef: closeRef,
    onEscape: () => { if (!busy) onClose(); },
  });

  const options = [
    { id: 'stripe', title: 'Stripe', description: 'Use a card or another supported online method. You can enter a different card.', Icon: RiBankCardLine },
    { id: 'cod', title: 'Cash on Delivery', description: 'Keep this same order and pay when it arrives.', Icon: RiCashLine },
  ];
  return createPortal(
    <div className="payment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }} style={{ zIndex: 12000 }}>
      <div ref={chooserRef} role="dialog" aria-modal="true" aria-labelledby="payment-method-switch-title" tabIndex={-1} style={{ width: 'min(620px, calc(100vw - 24px))', maxHeight: 'min(760px, calc(100dvh - 24px))', overflowY: 'auto', boxSizing: 'border-box', padding: 'clamp(20px, 4vw, 32px)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', boxShadow: '0 28px 100px rgba(0,0,0,.7)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div><p className="eyebrow">Payment</p><h3 id="payment-method-switch-title" style={{ margin: 0 }}>Choose another payment method</h3><p style={{ margin: '8px 0 0', opacity: .72 }}>Your order, address, total and checkout payload stay the same.</p></div>
          <button ref={closeRef} type="button" className="btn btn-quiet btn-icon" aria-label="Close payment method chooser" onClick={onClose} disabled={busy}><RiCloseLine size={20} /></button>
        </div>
        <div role="radiogroup" aria-label="Available payment methods" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 12, marginTop: 22 }}>
          {options.map(({ id, title, description, Icon }) => {
            const selected = value === id;
            return <button key={id} type="button" role="radio" aria-checked={selected} onClick={() => onSelect(id)} disabled={busy} style={{ appearance: 'none', width: '100%', minHeight: 112, padding: 16, textAlign: 'left', borderRadius: 14, border: `1px solid ${selected ? 'var(--accent, #d8aa62)' : 'var(--line)'}`, background: selected ? 'rgba(216,170,98,.08)' : 'var(--surface-2, rgba(255,255,255,.02))', color: 'inherit', cursor: busy ? 'wait' : 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}><span style={{ width: 40, height: 40, minWidth: 40, display: 'grid', placeItems: 'center', borderRadius: 10, border: '1px solid var(--line)', background: 'rgba(255,255,255,.03)' }}><Icon size={20} /></span><span style={{ minWidth: 0, display: 'grid', gap: 5 }}><strong>{title}{selected ? ' · Selected' : ''}</strong><small style={{ lineHeight: 1.45, opacity: .68 }}>{description}</small></span></button>;
          })}
        </div>
        <p style={{ margin: '18px 0 0', fontSize: 12, lineHeight: 1.5, opacity: .58 }}>Switching does not rebuild your cart or ask you to re-enter the delivery details.</p>
      </div>
    </div>,
    document.body,
  );
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function StripePaymentForm({ orderNumber, clientSecret, onSuccess, onRetry }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentConfirmationPending, setPaymentConfirmationPending] = useState(false);
  const [retrying, setRetrying] = useState(() => typeof window !== 'undefined' && Boolean(orderNumber) && window.sessionStorage.getItem(`luviio:payment-retrying:${orderNumber}`) === '1');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentElementError, setPaymentElementError] = useState('');
  const [stripeLoadingTimedOut, setStripeLoadingTimedOut] = useState(false);
  const [elementKey, setElementKey] = useState(0);
  const [switchingMethod, setSwitchingMethod] = useState(false);
  const [methodChooserOpen, setMethodChooserOpen] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(false);

  const showTerminalState = paymentPending || paymentConfirmationPending;

  useEffect(() => {
    setPaymentElementMounted(false);
    setPaymentReady(false);
    setPaymentElementError('');
    setStripeLoadingTimedOut(false);
    setRetryAllowed(false);
  }, [stripe, elements]);

  useEffect(() => {
    if (showTerminalState || paymentElementMounted || retrying || switchingMethod) return undefined;
    const timer = setTimeout(() => {
      setStripeLoadingTimedOut(true);
      setPaymentElementError('The secure card payment form is taking too long to load.');
    }, 12000);
    return () => clearTimeout(timer);
  }, [showTerminalState, paymentElementMounted, retrying, switchingMethod, elementKey, stripe]);

  const viewOrder = () => orderNumber ? navigate(`/orders/${encodeURIComponent(orderNumber)}`) : navigate('/orders');

  const reconcileOrder = async () => {
    if (!orderNumber) return null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const order = await orderService.myOrder(orderNumber);
        const status = String(order?.status || '').toLowerCase();
        if (status === 'paid' || status === 'cancelled' || status === 'failed') return order;
      } catch {}
      if (attempt < 7) await wait(750);
    }
    return null;
  };

  const finishConfirmedPayment = async (paymentIntent) => {
    try {
      const confirmation = await paymentService.confirm(paymentIntent.id);
      try { await refreshProfile(); } catch {}
      onSuccess({ ...(confirmation || {}), payment_intent_id: paymentIntent.id });
      return true;
    } catch {
      const reconciled = await reconcileOrder();
      if (String(reconciled?.status || '').toLowerCase() === 'paid') {
        try { await refreshProfile(); } catch {}
        onSuccess({ status: 'paid', order_number: orderNumber, payment_intent_id: paymentIntent.id });
        return true;
      }
      return false;
    }
  };

  const handleFailedIntent = async (intent, fallbackMessage) => {
    const intentId = intent?.id || paymentIntentId;
    const paymentStatus = String(intent?.status || '').toLowerCase();
    setProcessing(true);
    setRetryAllowed(false);
    if (intentId) {
      try { await paymentService.notifyFailed(intentId, fallbackMessage); } catch {}
    }
    setPaymentIntentId(intentId);
    setMessage(paymentStatus === 'requires_payment_method' ? fallbackMessage : 'Card payment could not be completed. Please try again.');
    setRetryAllowed(true);
    setPaymentPending(false);
    setPaymentConfirmationPending(false);
    setProcessing(false);
  };

  const handleUnresolvedConfirmation = (intent, fallbackMessage) => {
    setPaymentIntentId(intent?.id || paymentIntentId);
    setPaymentPending(false);
    setPaymentConfirmationPending(false);
    setProcessing(false);
    setRetryAllowed(true);
    setMessage(fallbackMessage || 'Card verification could not be completed. Please try the payment again.');
  };

  const reloadCardForm = () => {
    if (processing || retrying || switchingMethod) return;
    setMessage('');
    setPaymentElementError('');
    setStripeLoadingTimedOut(false);
    setPaymentElementMounted(false);
    setPaymentReady(false);
    setRetryAllowed(false);
    setElementKey((value) => value + 1);
  };

  const openPaymentMethodChooser = () => {
    if (!orderNumber || processing || retrying || switchingMethod || showTerminalState) return;
    setMessage('');
    setMethodChooserOpen(true);
  };

  const switchPaymentMethod = async (method) => {
    if (!orderNumber || switchingMethod || processing || retrying || showTerminalState) return;
    setSwitchingMethod(true);
    setMessage('');
    try {
      if (method === 'stripe') {
        setMethodChooserOpen(false);
        if (!onRetry) throw new Error('A new card payment session is unavailable.');
        await onRetry(orderNumber);
        setPaymentPending(false);
        setPaymentConfirmationPending(false);
        setPaymentElementMounted(false);
        setPaymentReady(false);
        setPaymentElementError('');
        setStripeLoadingTimedOut(false);
        setRetryAllowed(false);
        setElementKey((value) => value + 1);
        return;
      }

      await paymentService.switchMethod(orderNumber, method);
      setMethodChooserOpen(false);
      await refreshProfile().catch(() => {});
      navigate(`/order/success?${new URLSearchParams({ order: orderNumber, payment: 'cod' }).toString()}`, { replace: true });
    } catch (err) {
      setMessage(err?.message || 'Unable to switch payment method right now. Please try again.');
    } finally {
      setSwitchingMethod(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementMounted || !paymentReady || paymentElementError || processing || retrying || switchingMethod || showTerminalState) return;
    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      setPaymentElementMounted(false);
      setPaymentReady(false);
      setMessage('Secure card form is still loading. Please wait a moment and try again.');
      return;
    }
    setProcessing(true);
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
        if (String(intent?.status || '').toLowerCase() === 'requires_action') {
          handleUnresolvedConfirmation(intent, error.message || 'Card verification could not be completed. Please try the payment again.');
          return;
        }
        await handleFailedIntent(intent, error.message || 'Card payment failed. Check your card details and try again.');
        return;
      }
      if (paymentIntent?.status === 'succeeded') {
        if (await finishConfirmedPayment(paymentIntent)) return;
        setPaymentConfirmationPending(true);
        setProcessing(false);
        return;
      }
      if (paymentIntent?.status === 'processing') {
        setPaymentPending(true);
        setProcessing(false);
        return;
      }
      if (paymentIntent?.status === 'requires_payment_method') {
        await handleFailedIntent(paymentIntent, 'Card payment was not completed. Please check your card details and try again.');
        return;
      }
      if (paymentIntent?.status === 'requires_action') {
        handleUnresolvedConfirmation(paymentIntent, 'Card verification could not be completed. Please try the payment again.');
        return;
      }
      setProcessing(false);
      setRetryAllowed(true);
      setMessage('Card payment could not be completed. Please try again.');
    } catch (err) {
      const intent = err?.payment_intent || err?.paymentIntent;
      const paymentStatus = String(intent?.status || '').toLowerCase();
      if (paymentStatus === 'requires_payment_method') { await handleFailedIntent(intent, err?.message || 'Card payment was not completed. Please check your card details and try again.'); return; }
      if (paymentStatus === 'requires_action') { handleUnresolvedConfirmation(intent, err?.message || 'Card verification could not be completed. Please try the payment again.'); return; }
      if (paymentStatus === 'processing') { setPaymentPending(true); setProcessing(false); return; }
      const reconciled = await reconcileOrder();
      if (String(reconciled?.status || '').toLowerCase() === 'paid') { try { await refreshProfile(); } catch {} onSuccess({ status: 'paid', order_number: orderNumber, payment_intent_id: intent?.id || paymentIntentId || undefined }); return; }
      setProcessing(false);
      setMessage(err?.message || 'Card payment status could not be confirmed. Please check your order status before trying again.');
    }
  };

  const handleRetry = async () => {
    if (retrying || processing || switchingMethod || showTerminalState) return;
    if (onRetry && orderNumber) {
      setRetrying(true);
      if (typeof window !== 'undefined') window.sessionStorage.setItem(`luviio:payment-retrying:${orderNumber}`, '1');
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
      } catch (err) {
        if (typeof window !== 'undefined') window.sessionStorage.removeItem(`luviio:payment-retrying:${orderNumber}`);
        setRetryAllowed(true);
        setMessage(err?.message || 'Unable to start a new card payment attempt.');
        setRetrying(false);
      }
      return;
    }
    reloadCardForm();
  };

  const loadingState = !showTerminalState && !paymentElementMounted && !paymentElementError && !stripeLoadingTimedOut;
  const showLoadRecovery = !showTerminalState && (paymentElementError || stripeLoadingTimedOut);
  const showProcessingOverlay = processing;
  const showFailureActions = !showTerminalState && !showLoadRecovery && message && retryAllowed;

  return <form onSubmit={handleSubmit} className="stripe-form payment-stripe-form">
    {!showTerminalState && <>
      {loadingState && <div className="payment-element-loading" role="status" aria-live="polite"><span className="payment-element-loading-ring" aria-hidden="true" /><span>Loading secure card payment…</span></div>}
      <div className="payment-element-shell" aria-busy={showProcessingOverlay || retrying || loadingState}>
        <PaymentElement key={elementKey} id="payment-element" onReady={() => { setPaymentElementMounted(true); setPaymentReady(false); setPaymentElementError(''); setStripeLoadingTimedOut(false); if (retrying) { if (typeof window !== 'undefined') window.sessionStorage.removeItem(`luviio:payment-retrying:${orderNumber}`); setRetrying(false); setRetryAllowed(false); setMessage(''); } }} onChange={(event) => { setPaymentReady(Boolean(event.complete)); if (event.error) setMessage(event.error.message || 'Please check your card details.'); else if (!processing && !retrying && !retryAllowed) setMessage(''); }} onLoadError={(event) => { if (typeof window !== 'undefined') window.sessionStorage.removeItem(`luviio:payment-retrying:${orderNumber}`); setPaymentElementMounted(false); setPaymentReady(false); setPaymentElementError(event?.error?.message || 'Unable to load the secure card payment form.'); setStripeLoadingTimedOut(false); setRetrying(false); setMessage(event?.error?.message || 'Unable to load the secure card payment form.'); }} />
      </div>
      {showLoadRecovery && <div className="payment-load-recovery" role="alert"><strong>Card payment isn’t available right now.</strong><span>{paymentElementError || 'The secure card form could not be loaded.'}</span><div className="payment-load-recovery-actions"><button className="btn payment-secondary-action" type="button" onClick={handleRetry} disabled={switchingMethod || processing || retrying}><RiRefreshLine size={16} />Retry</button><button className="btn payment-submit-btn" type="button" onClick={openPaymentMethodChooser} disabled={switchingMethod || processing || retrying}><RiBankCardLine size={16} />Choose another payment method</button></div></div>}
    </>}
    {showProcessingOverlay && <PaymentStatusPopup className="payment-processing-popup"><ProcessingPayment /></PaymentStatusPopup>}
    {retrying && !showProcessingOverlay && <PaymentStatusPopup className="payment-retry-popup"><div className="payment-retry-state" role="status" aria-live="polite"><span className="payment-processing-ring" aria-hidden="true" /><strong>Retrying payment…</strong><span>Preparing a new secure card session.</span></div></PaymentStatusPopup>}
    {paymentPending ? <PaymentPendingState orderNumber={orderNumber} onViewOrder={viewOrder} /> : paymentConfirmationPending ? <PaymentConfirmationPending orderNumber={orderNumber} onViewOrder={viewOrder} /> : null}
    {!showTerminalState && message && !showLoadRecovery && <div className="form-error payment-form-error" role="alert">{message}</div>}
    {!showTerminalState && showFailureActions && <div className="payment-error-actions" role="group" aria-label="Payment recovery actions"><button className="btn payment-submit-btn" type="button" onClick={handleRetry} disabled={processing || retrying || switchingMethod}><RiRefreshLine size={16} />Retry</button><button className="btn btn-quiet payment-secondary-action" type="button" onClick={openPaymentMethodChooser} disabled={processing || retrying || switchingMethod}><RiBankCardLine size={16} />Choose another payment method</button></div>}
    {!showTerminalState && !showFailureActions && !showLoadRecovery && <div className="payment-form-actions"><button className="btn payment-submit-btn" type="submit" disabled={!stripe || !elements || !paymentElementMounted || !paymentReady || Boolean(paymentElementError) || processing || retrying || switchingMethod || retryAllowed}><RiLockLine size={15} aria-hidden="true" /><span>Pay by card</span></button></div>}
    {!showTerminalState && <p className="hint secure-hint">Your card payment is encrypted and processed securely. Order {orderNumber ? `#${orderNumber}` : ''} stays open until payment succeeds or you cancel it.</p>}
    {methodChooserOpen && <PaymentMethodChooser value="stripe" onSelect={switchPaymentMethod} onClose={() => { if (!switchingMethod) setMethodChooserOpen(false); }} busy={switchingMethod} />}
  </form>;
}
