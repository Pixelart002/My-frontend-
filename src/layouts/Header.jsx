import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  UserRound,
  X,
} from 'lucide-react';
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
          <button type="submit" aria-label="Search"><Search size={17} /></button>
        </form>

        <Link className="icon-btn" to="/cart" aria-label={`Shopping bag, ${itemCount} items`}>
          <ShoppingBag size={19} />
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
              <User size={19} />
            </button>
            {menuOpen && (
              <div className="account-menu" onMouseLeave={() => setMenuOpen(false)}>
                <div className="menu-user">
                  <strong>{user?.full_name || user?.name || 'Welcome'}</strong>
                  <span>{user?.email || ''}</span>
                </div>
                <Link to="/account" onClick={closeAll}><UserRound size={16} /> Profile</Link>
                <Link to="/orders" onClick={closeAll}><Package size={16} /> Orders</Link>
                <Link to="/account/addresses" onClick={closeAll}><ChevronDown size={16} /> Addresses</Link>
                <button onClick={onLogout}><LogOut size={16} /> Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <Link className="icon-btn" to="/login" aria-label="Sign in">
            <User size={19} />
          </Link>
        )}

        <button
          className="menu-button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`mobile-nav ${mobileOpen ? 'is-open' : ''}`}>
        <Link to="/shop" onClick={closeAll}>Shop all</Link>
        <Link to="/shop?new=1" onClick={closeAll}>New in</Link>
        <span className="nav-section-label">Account</span>
        {isAuthenticated ? (
          <>
            <Link to="/account" onClick={closeAll}>Profile</Link>
            <Link to="/orders" onClick={closeAll}>Orders</Link>
            <Link to="/account/addresses" onClick={closeAll}>Addresses</Link>
            <button onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeAll}>Sign in</Link>
            <Link to="/register" onClick={closeAll}>Create account</Link>
          </>
        )}
      </div>
    </header>
  );
}
