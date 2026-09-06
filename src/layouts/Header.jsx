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

  const path = location.pathname;
  const isHome = path === '/';
  const isShop = path === '/shop';
  const isProduct = path === '/product' || path.startsWith('/product/');
  const isCart = path === '/cart';
  const isCheckout = path === '/checkout';
  const isAccount = path === '/account' || path.startsWith('/account/');
  const isOrders = path === '/orders' || path.startsWith('/orders/');
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(path);
  const isPolicy = ['/privacy', '/terms', '/shipping', '/refund', '/returns', '/about'].includes(path);
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdmin = ['admin', 'super_admin', 'owner'].includes(String(user?.role || '').toLowerCase()) || user?.is_admin === true;

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

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

  const menuLink = (to, label, className = '') => (
    <Link to={to} onClick={closeAll} className={className}>{label}</Link>
  );

  const renderMobileMenu = () => {
    if (isAdminPage) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">LUVIIO</span>
            <span className="mobile-nav-title">Store console</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Admin</span>
            {menuLink('/admin', 'Dashboard', 'is-active')}
            {menuLink('/', 'View storefront')}
          </div>
        </>
      );
    }

    if (isCheckout) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">CHECKOUT</span>
            <span className="mobile-nav-title">Complete your order</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Checkout</span>
            {menuLink('/cart', 'Back to shopping bag')}
          </div>
        </>
      );
    }

    if (isCart) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">YOUR BAG</span>
            <span className="mobile-nav-title">{itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Your bag is empty'}</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Next step</span>
            {isAuthenticated && itemCount > 0 && menuLink('/checkout', 'Continue to checkout')}
            {menuLink('/shop', 'Continue shopping')}
          </div>
          {!isAuthenticated && itemCount > 0 && (
            <div className="mobile-nav-section">
              <span className="nav-section-label">Account</span>
              {menuLink('/login', 'Sign in to checkout')}
            </div>
          )}
        </>
      );
    }

    if (isAccount) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">MY ACCOUNT</span>
            <span className="mobile-nav-title">Manage your account</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Account</span>
            {menuLink('/account', 'Profile', isAccount && path === '/account' ? 'is-active' : '')}
            {menuLink('/orders', 'Order history', isOrders ? 'is-active' : '')}
            {menuLink('/account/addresses', 'Addresses', path === '/account/addresses' ? 'is-active' : '')}
            <button type="button" onClick={onLogout}><RiLogoutBoxRLine size={16} /> Sign out</button>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Shop</span>
            {menuLink('/shop', 'Continue shopping')}
            {menuLink('/cart', `Shopping bag${itemCount > 0 ? ` (${itemCount})` : ''}`)}
          </div>
        </>
      );
    }

    if (isOrders) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">YOUR ORDERS</span>
            <span className="mobile-nav-title">Track and manage orders</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Account</span>
            {menuLink('/orders', 'Order history', 'is-active')}
            {menuLink('/account', 'Profile')}
            {menuLink('/account/addresses', 'Addresses')}
            <button type="button" onClick={onLogout}><RiLogoutBoxRLine size={16} /> Sign out</button>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Shop</span>
            {menuLink('/shop', 'Continue shopping')}
          </div>
        </>
      );
    }

    if (isProduct) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">PRODUCT</span>
            <span className="mobile-nav-title">Choose your next step</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Explore</span>
            {menuLink('/shop', 'Back to shop')}
            {menuLink('/shop?new=1', 'New arrivals')}
            {menuLink('/cart', `Shopping bag${itemCount > 0 ? ` (${itemCount})` : ''}`)}
          </div>
        </>
      );
    }

    if (isShop) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">SHOP</span>
            <span className="mobile-nav-title">Find something you love</span>
          </div>
          <form className="mobile-search" onSubmit={onSearch} role="search">
            <RiSearchLine size={18} aria-hidden="true" />
            <input name="query" placeholder="Search products" aria-label="Search products" autoComplete="off" />
          </form>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Collection</span>
            {menuLink('/shop', 'Shop all', 'is-active')}
            {menuLink('/shop?new=1', 'New arrivals')}
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Your bag</span>
            {menuLink('/cart', `Shopping bag${itemCount > 0 ? ` (${itemCount})` : ''}`)}
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Account</span>
            {isAuthenticated ? menuLink('/account', 'My account') : menuLink('/login', 'Sign in')}
          </div>
        </>
      );
    }

    if (isPolicy) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">LUVIIO</span>
            <span className="mobile-nav-title">Information</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Continue</span>
            {menuLink('/shop', 'Continue shopping')}
            {menuLink('/cart', `Shopping bag${itemCount > 0 ? ` (${itemCount})` : ''}`)}
          </div>
        </>
      );
    }

    if (isAuthPage) {
      return (
        <>
          <div className="mobile-nav-head">
            <span className="mobile-nav-kicker">LUVIIO</span>
            <span className="mobile-nav-title">Welcome</span>
          </div>
          <div className="mobile-nav-section">
            <span className="nav-section-label">Continue</span>
            {menuLink('/shop', 'Shop all')}
            {menuLink('/cart', `Shopping bag${itemCount > 0 ? ` (${itemCount})` : ''}`)}
          </div>
        </>
      );
    }

    return (
      <>
        <div className="mobile-nav-head">
          <span className="mobile-nav-kicker">LUVIIO</span>
          <span className="mobile-nav-title">Thoughtful things, beautifully made</span>
        </div>
        <div className="mobile-nav-section">
          <span className="nav-section-label">Discover</span>
          {menuLink('/shop', 'Shop all')}
          {menuLink('/shop?new=1', 'New arrivals')}
          {menuLink('/cart', `Shopping bag${itemCount > 0 ? ` (${itemCount})` : ''}`)}
        </div>
        <div className="mobile-nav-section">
          <span className="nav-section-label">Account</span>
          {isAuthenticated ? menuLink('/account', 'My account') : (
            <>
              {menuLink('/login', 'Sign in')}
              {menuLink('/register', 'Create account')}
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <header className="header">
      <Link className="brand" to="/" onClick={closeAll}>LUVIIO</Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink to="/shop" className={({ isActive }) => (isActive ? 'is-active' : '')}>Shop</NavLink>
        <NavLink to="/shop?new=1" className={({ isActive }) => (isActive ? 'is-active' : '')}>New in</NavLink>
      </nav>
      <div className="header-actions">
        <form className="search-form" onSubmit={onSearch} role="search">
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
        ) : isHome ? (
          <Link className="header-login-btn btn btn-quiet" to="/login">Login</Link>
        ) : (
          <Link className="icon-btn" to="/login" aria-label="Sign in"><RiUserLine size={19} /></Link>
        )}
        <button type="button" className="menu-button" onClick={toggleMobileMenu} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
        </button>
      </div>
      <div className={`mobile-menu-backdrop${mobileOpen ? ' is-open' : ''}`} aria-hidden="true" onClick={closeAll} />
      <nav id="mobile-navigation" className={`mobile-nav${mobileOpen ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!mobileOpen}>
        {renderMobileMenu()}
      </nav>
    </header>
  );
}
