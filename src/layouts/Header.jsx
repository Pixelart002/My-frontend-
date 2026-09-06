import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  RiArchive2Line,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiMapPin2Line,
  RiMenuLine,
  RiSearchLine,
  RiShieldStarLine,
  RiShoppingBagLine,
  RiUser3Line,
  RiUserLine,
} from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCart = location.pathname === '/cart';
  const isCheckout = location.pathname === '/checkout';
  const isAccountPage = location.pathname === '/account' || location.pathname.startsWith('/account/');
  const isOrdersPage = location.pathname === '/orders' || location.pathname.startsWith('/orders/');
  const isAdmin = ['admin', 'super_admin', 'owner'].includes(String(user?.role || '').toLowerCase()) || user?.is_admin === true;

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const closeAll = () => {
    setMobileOpen(false);
    setMenuOpen(false);
  };

  const toggleMobileMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileOpen((open) => !open);
    setMenuOpen(false);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const q = e.currentTarget.query.value.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    closeAll();
  };

  const onLogout = async () => {
    closeAll();
    await logout();
    toast.success('You have been signed out.');
    navigate('/');
  };

  return (
    <header className="header">
      <Link className="brand" to="/" onClick={closeAll}>LUVIIO</Link>

      <nav className="nav-links">
        <NavLink to="/shop" className={({ isActive }) => (isActive ? 'is-active' : '')}>Shop</NavLink>
        <NavLink to="/shop?new=1" className={({ isActive }) => (isActive ? 'is-active' : '')}>New in</NavLink>
      </nav>

      <div className="header-actions">
        <form className="search-form" onSubmit={onSearch}>
          <input name="query" placeholder="Search products" aria-label="Search products" />
          <button type="submit" aria-label="Search"><RiSearchLine size={17} /></button>
        </form>

        <Link className="icon-btn" to="/cart" aria-label={`Shopping bag, ${itemCount} items`}>
          <RiShoppingBagLine size={19} />
          {itemCount > 0 && <span className="cart-count">{itemCount > 99 ? '99+' : itemCount}</span>}
        </Link>

        {isAuthenticated ? (
          <div className="account-menu-wrap">
            <button type="button" className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu" aria-expanded={menuOpen}>
              <RiUserLine size={19} />
            </button>
            {menuOpen && (
              <div className="account-menu">
                <div className="menu-user">
                  <strong>{user?.full_name || user?.name || 'Welcome'}</strong>
                  <span>{user?.email || ''}</span>
                </div>
                <Link to="/account" onClick={closeAll}><RiUser3Line size={16} /> Profile</Link>
                <Link to="/orders" onClick={closeAll}><RiArchive2Line size={16} /> Orders</Link>
                <Link to="/account/addresses" onClick={closeAll}><RiMapPin2Line size={16} /> Addresses</Link>
                {isAdmin && <Link to="/admin" onClick={closeAll}><RiShieldStarLine size={16} /> Store console</Link>}
                <button type="button" onClick={onLogout}><RiLogoutBoxRLine size={16} /> Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <Link className="icon-btn" to="/login" aria-label="Sign in">
            <RiUserLine size={19} />
          </Link>
        )}

        <button type="button" className="menu-button" onClick={toggleMobileMenu} aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
        </button>
      </div>

      <nav className={`mobile-nav${mobileOpen ? ' is-open' : ''}`} aria-hidden={!mobileOpen}>
        <span className="nav-section-label">Browse</span>
        <Link to="/" onClick={closeAll}>Home</Link>
        <NavLink to="/shop" onClick={closeAll} className={({ isActive }) => (isActive ? 'is-active' : '')}>Shop all</NavLink>
        <NavLink to="/shop?new=1" onClick={closeAll} className={({ isActive }) => (isActive ? 'is-active' : '')}>New arrivals</NavLink>

        <span className="nav-section-label">Your bag</span>
        <Link to="/cart" onClick={closeAll}>Shopping bag{itemCount > 0 ? ` (${itemCount})` : ''}</Link>
        {isCart && isAuthenticated && <Link to="/checkout" onClick={closeAll}>Continue to checkout</Link>}
        {isCheckout && <Link to="/cart" onClick={closeAll}>Back to shopping bag</Link>}

        <span className="nav-section-label">My account</span>
        {isAuthenticated ? (
          <>
            <Link to="/account" onClick={closeAll} className={isAccountPage ? 'is-active' : ''}>Profile</Link>
            <Link to="/orders" onClick={closeAll} className={isOrdersPage ? 'is-active' : ''}>Order history</Link>
            <Link to="/account/addresses" onClick={closeAll}>Addresses</Link>
            {isAdmin && <Link to="/admin" onClick={closeAll}><RiShieldStarLine size={15} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /> Store console</Link>}
            <button type="button" onClick={onLogout}><RiLogoutBoxRLine size={15} /> Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeAll}>Sign in</Link>
            <Link to="/register" onClick={closeAll}>Create account</Link>
          </>
        )}

        <span className="nav-section-label">Help &amp; information</span>
        <Link to="/shipping" onClick={closeAll}>Shipping</Link>
        <Link to="/returns" onClick={closeAll}>Returns &amp; cancellation</Link>
        <Link to="/refund" onClick={closeAll}>Refund policy</Link>
        <Link to="/privacy" onClick={closeAll}>Privacy</Link>
        <Link to="/terms" onClick={closeAll}>Terms</Link>
        <Link to="/about" onClick={closeAll}>About Luviio</Link>
      </nav>
    </header>
  );
}
