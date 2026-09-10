import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiCheckboxCircleFill, RiMailLine, RiShoppingBag3Line, RiCustomerService2Line, RiArrowRightLine } from '@remixicon/react';
import { useCart } from '../context/CartContext';

export default function OrderSuccessPage() {
  const location = useLocation();
  const { reload } = useCart();
  const orderNumber = String(location.state?.orderNumber || '').trim();

  useEffect(() => { reload().catch(() => {}); }, []);

  return (
    <div className="page container">
      <div className="order-result">
        <RiCheckboxCircleFill size={58} className="order-result-icon" />
        <p className="eyebrow">Payment confirmed</p>
        <h1>Thank you.</h1>
        <p>Your order{orderNumber ? ` #${orderNumber}` : ''} has been placed and is being prepared.</p>
        {orderNumber && (
          <div className="order-result-order-id">
            <span>Order ID</span>
            <strong>#{orderNumber}</strong>
          </div>
        )}
        {orderNumber && (
          <div className="order-result-actions">
            <Link className="btn" to={`/orders/${encodeURIComponent(orderNumber)}`}>View order <RiArrowRightLine size={17} /></Link>
            <Link className="btn btn-quiet" to="/orders">All orders</Link>
          </div>
        )}
        <Link className="btn btn-ghost" to="/shop">Continue shopping</Link>
        <div className="order-result-meta">
          <div><RiMailLine size={21} /><span>Email confirmation<br />sent</span></div>
          <div><RiShoppingBag3Line size={21} /><span>Track your order<br />in My Orders</span></div>
          <div><RiCustomerService2Line size={21} /><span>Need help?<br />Contact support</span></div>
        </div>
      </div>
    </div>
  );
}
