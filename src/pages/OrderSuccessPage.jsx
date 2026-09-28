import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RiCheckboxCircleFill, RiMailLine, RiShoppingBag3Line, RiCustomerService2Line, RiArrowRightLine } from '@remixicon/react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orders';
import { formatMoney } from '../utils/format';

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [orderError, setOrderError] = useState('');
  const stateOrderNumber = String(location.state?.orderNumber || '').trim();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryOrderNumber = String(query.get('order') || '').trim();
  const queryPaymentMethod = String(query.get('payment') || '').toLowerCase();
  const orderNumber = stateOrderNumber || queryOrderNumber;
  const paymentMethod = String(order?.payment_method || location.state?.paymentMethod || queryPaymentMethod).toLowerCase();
  const isCod = paymentMethod === 'cod' || paymentMethod === 'cash_on_delivery' || (!paymentMethod && order && !order.stripe_payment_intent);

  useEffect(() => {
    if (!orderNumber) return;
    clearCart().catch(() => {});
    let active = true;
    setOrder(null);
    setOrderError('');
    orderService.myOrder(orderNumber)
      .then((result) => { if (active) setOrder(result); })
      .catch((err) => { if (active) setOrderError(err?.message || 'Order details are temporarily unavailable.'); });
    return () => { active = false; };
  }, [orderNumber, clearCart]);

  useEffect(() => {
    if (!stateOrderNumber || queryOrderNumber) return;
    const params = new URLSearchParams({ order: stateOrderNumber });
    if (location.state?.paymentMethod) params.set('payment', String(location.state.paymentMethod));
    navigate(`/order/success?${params.toString()}`, { replace: true });
  }, [stateOrderNumber, queryOrderNumber, location.state?.paymentMethod, navigate]);

  const serverTotal = order?.total_amount ?? order?.grand_total;
  const hasServerTotal = serverTotal !== undefined && serverTotal !== null && Number.isFinite(Number(serverTotal));

  return (
    <div className="page container">
      <div className="order-result">
        <RiCheckboxCircleFill size={58} className="order-result-icon" />
        <p className="eyebrow">{isCod ? 'Order confirmed' : 'Payment confirmed'}</p>
        <h1>{isCod ? 'Your order is placed.' : 'Thank you.'}</h1>
        <p>{isCod ? `Your COD order${orderNumber ? ` #${orderNumber}` : ''} has been confirmed. You’ll pay when it arrives.` : `Your order${orderNumber ? ` #${orderNumber}` : ''} has been placed and is being prepared.`}</p>
        {orderNumber && (
          <div className="order-result-order-id">
            <span>Order number</span>
            <strong>#{orderNumber}</strong>
            {hasServerTotal && <><span>Order total</span><strong>{formatMoney(serverTotal)}</strong></>}
          </div>
        )}
        {orderError && <p className="form-error" role="status">{orderError}</p>}
        {orderNumber && <div className="order-result-actions"><Link className="btn" to={`/orders/${encodeURIComponent(orderNumber)}`}>View order <RiArrowRightLine size={17} /></Link><Link className="btn btn-quiet" to="/orders">All orders</Link></div>}
        <Link className="btn btn-ghost" to="/shop">Continue shopping</Link>
        <div className="order-result-meta">
          <div><RiMailLine size={21} /><span>Order confirmation<br />available in your account</span></div>
          <div><RiShoppingBag3Line size={21} /><span>Track your order<br />in My Orders</span></div>
          <div><RiCustomerService2Line size={21} /><span>Need help?<br />Contact support</span></div>
        </div>
      </div>
    </div>
  );
}
