import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  RiArrowDownSLine,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeAll = () => {
    setMobileOpen(false);
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
      <Link className="brand" to="/">LUVIIO</Link>

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
            <button
              className="icon-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <RiUserLine size={19} />
            </button>
            {menuOpen && (
              <div className="account-menu" onMouseLeave={() => setMenuOpen(false)}>
                <div className="menu-user">
                  <strong>{user?.full_name || user?.name || 'Welcome'}</strong>
                  <span>{user?.email || ''}</span>
                </div>
                <Link to="/account" onClick={closeAll}><RiUser3Line size={16} /> Profile</Link>
                <Link to="/orders" onClick={closeAll}><RiArchive2Line size={16} /> Orders</Link>
                <Link to="/account/addresses" onClick={closeAll}><RiMapPin2Line size={16} /> Addresses</Link>
                <Link to="/admin" onClick={closeAll}><RiShieldStarLine size={16} /> Store console</Link>
                <button onClick={onLogout}><RiLogoutBoxRLine size={16} /> Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <Link className="icon-btn" to="/login" aria-label="Sign in">
            <RiUserLine size={19} />
          </Link>
        )}

        <button
          className="menu-button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
        </button>
      </div>

      <div className={`mobile-nav ${mobileOpen ? 'is-open' : ''}`}>
        <span className="nav-section-label">Shop</span>
        <Link to="/shop" onClick={closeAll}>Shop all</Link>
        <Link to="/shop?new=1" onClick={closeAll}>New in</Link>
        <Link to="/cart" onClick={closeAll}>Shopping bag</Link>

        <span className="nav-section-label">Account</span>
        {isAuthenticated ? (
          <>
            <Link to="/account" onClick={closeAll}>Profile</Link>
            <Link to="/orders" onClick={closeAll}>Orders</Link>
            <Link to="/account/addresses" onClick={closeAll}>Addresses</Link>
            <Link to="/admin" onClick={closeAll}><RiShieldStarLine size={15} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /> Store console</Link>
            <button onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeAll}>Sign in</Link>
            <Link to="/register" onClick={closeAll}>Create account</Link>
          </>
        )}

        <span className="nav-section-label">Support</span>
        <Link to="/shipping" onClick={closeAll}>Shipping</Link>
        <Link to="/returns" onClick={closeAll}>Returns &amp; exchanges</Link>
        <Link to="/refund" onClick={closeAll}>Refund policy</Link>
        <Link to="/about" onClick={closeAll}>About Luviio</Link>
      </div>
    </header>
  );
}
