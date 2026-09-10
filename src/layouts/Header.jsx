import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { RiArchive2Line, RiCloseLine, RiGridLine, RiHeartLine, RiHomeLine, RiInformationLine, RiLogoutBoxRLine, RiMailLine, RiMapPin2Line, RiMenuLine, RiSearchLine, RiSettings3Line, RiShieldStarLine, RiShoppingBagLine, RiStore2Line, RiUser3Line, RiUserLine, RiCoupon3Line, RiStackLine, RiTruckLine, RiVipCrownLine, RiUserSettingsLine, RiShieldKeyholeLine, RiNotification3Line, RiBankCardLine, RiBarChart2Line, RiFileList3Line, RiPriceTag3Line, RiFolder2Line, RiShoppingCart2Line, RiDashboardLine } from '@remixicon/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ADMIN_NAV = [
  ['dashboard', 'Dashboard', RiDashboardLine],
  ['products', 'Products', RiPriceTag3Line],
  ['categories', 'Categories', RiFolder2Line],
  ['orders', 'Orders', RiShoppingCart2Line],
  ['coupons', 'Coupons', RiCoupon3Line],
  ['inventory', 'Inventory', RiStackLine],
  ['shipping', 'Shipping', RiTruckLine],
  ['subscriptions', 'Subscriptions', RiVipCrownLine],
  ['users', 'Users', RiUser3Line],
  ['user-actions', 'User Actions', RiUserSettingsLine],
  ['rbac', 'Roles & Permissions', RiShieldKeyholeLine],
  ['notifications', 'Notifications', RiNotification3Line],
  ['settings', 'Settings', RiSettings3Line],
  ['payments', 'Payments', RiBankCardLine],
  ['reports', 'Reports', RiBarChart2Line],
  ['audit', 'Audit Logs', RiFileList3Line],
];

const ADMIN_GROUPS = [
  ['Overview', ['dashboard']],
  ['Catalogue', ['products', 'categories']],
  ['Commerce', ['orders', 'coupons', 'inventory', 'shipping', 'subscriptions', 'payments']],
  ['Customers', ['users', 'user-actions']],
  ['Operations', ['rbac', 'notifications', 'reports', 'audit', 'settings']],
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const path = location.pathname;
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdmin = ['admin','super_admin','owner'].includes(String(user?.role || '').toLowerCase()) || user?.is_admin === true;

  useEffect(() => { setMobileOpen(false); setMenuOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', closeOnEscape); };
  }, [mobileOpen]);

  const closeAll = () => { setMobileOpen(false); setMenuOpen(false); };
  const onSearch = (e) => { e.preventDefault(); const q = e.currentTarget.query.value.trim(); navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop'); closeAll(); };
  const onLogout = async () => { closeAll(); await logout(); toast.success('You have been signed out.'); navigate('/'); };
  const menuLink = (to, label, Icon = null) => <Link to={to} onClick={closeAll}>{Icon && <Icon size={18} aria-hidden="true" />}<span>{label}</span></Link>;
  const adminItemMap = new Map(ADMIN_NAV.map(([key, label, Icon]) => [key, [label, Icon]]));

  const mobileContent = isAdminPage && isAdmin
    ? <>
        <div className="mobile-nav-section mobile-admin-nav">
          {ADMIN_GROUPS.map(([group, keys]) => <div key={group} className="mobile-admin-group"><div className="mobile-admin-label">{group}</div>{keys.map((key) => { const [label, Icon] = adminItemMap.get(key); return menuLink(`/admin?panel=${key}`, label, Icon); })}</div>)}
        </div>
        {menuLink('/', 'View storefront', RiHomeLine)}
      </>
    : <>
        <form className="mobile-search" onSubmit={onSearch} role="search"><RiSearchLine size={19}/><input name="query" placeholder="Search for products..." aria-label="Search for products" autoComplete="off"/></form>
        <div className="mobile-nav-section mobile-primary-nav">
          {menuLink('/', 'Home', RiHomeLine)}
          {menuLink('/shop', 'Shop', RiStore2Line)}
          {menuLink('/shop', 'Categories', RiGridLine)}
        </div>
        <div className="mobile-nav-section mobile-shopping-nav">
          {menuLink('/cart', `Shopping bag${itemCount ? ` (${itemCount})` : ''}`, RiShoppingBagLine)}
          {menuLink('/orders', 'Orders', RiArchive2Line)}
          {menuLink('/account', 'Account', RiUser3Line)}
        </div>
        <div className="mobile-nav-section mobile-info-nav">
          {menuLink('/about', 'About', RiInformationLine)}
          <a href="mailto:support@luviio.in" onClick={closeAll}><RiMailLine size={18} aria-hidden="true"/><span>Contact</span></a>
        </div>
        <div className="mobile-nav-section mobile-account-actions">
          {isAdmin && menuLink('/admin', 'Admin dashboard', RiShieldStarLine)}
          {isAuthenticated && <button type="button" onClick={onLogout}><RiLogoutBoxRLine size={18}/><span>Sign out</span></button>}
        </div>
      </>;

  return <header className="header">
    <div className="header-reference-inner">
      <Link className="brand" to="/" onClick={closeAll}>luviio</Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink end to="/">Home</NavLink>
        <NavLink end to="/shop">Shop</NavLink>
        <Link to="/shop">Categories</Link>
        <NavLink end to="/about">About</NavLink>
        <a href="mailto:support@luviio.in">Contact</a>
      </nav>
      <div className="header-actions">
        <form className="search-form" onSubmit={onSearch} role="search"><RiSearchLine className="search-icon" size={18}/><input name="query" placeholder="Search for products..." aria-label="Search for products..." autoComplete="off"/></form>
        <Link className="icon-btn header-account-icon" to="/account" aria-label="Account"><RiUserLine size={20}/></Link>
        <Link className="icon-btn header-heart-icon" to="/account" aria-label="Wishlist"><RiHeartLine size={21}/></Link>
        <Link className="icon-btn header-cart-icon" to="/cart" aria-label={`Shopping bag, ${itemCount} items`}><RiShoppingBagLine size={21}/>{itemCount > 0 && <span className="cart-count">{itemCount > 99 ? '99+' : itemCount}</span>}</Link>
        {isAuthenticated && <div className="account-menu-wrap"><button type="button" className="icon-btn account-trigger" onClick={() => setMenuOpen(v => !v)} aria-label="Account menu" aria-expanded={menuOpen}><RiUserLine size={20}/></button>{menuOpen && <div className="account-menu"><div className="menu-user"><strong>{user?.full_name || user?.name || 'Welcome'}</strong><span>{user?.email || ''}</span></div><Link to="/account" onClick={closeAll}><RiUser3Line size={16}/> Profile</Link><Link to="/orders" onClick={closeAll}><RiArchive2Line size={16}/> Orders</Link><Link to="/account/addresses" onClick={closeAll}><RiMapPin2Line size={16}/> Addresses</Link><Link to="/account/settings" onClick={closeAll}><RiSettings3Line size={16}/> Settings</Link>{isAdmin && <Link to="/admin" onClick={closeAll}><RiShieldStarLine size={16}/> Admin dashboard</Link>}<button type="button" onClick={onLogout}><RiLogoutBoxRLine size={16}/> Sign out</button></div>}</div>}
        <button type="button" className="menu-button" onClick={(e) => { e.preventDefault(); setMobileOpen(v => !v); setMenuOpen(false); }} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>{mobileOpen ? <RiCloseLine size={22}/> : <RiMenuLine size={22}/>}</button>
      </div>
    </div>
    <div className={`mobile-menu-backdrop${mobileOpen ? ' is-open' : ''}`} aria-hidden={!mobileOpen} onClick={closeAll}/>
    <aside id="mobile-navigation" className={`mobile-nav${mobileOpen ? ' is-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!mobileOpen}><div className="mobile-nav-head"><Link className="mobile-nav-brand" to="/" onClick={closeAll}>luviio</Link><button type="button" className="mobile-nav-close" onClick={closeAll} aria-label="Close menu"><RiCloseLine size={20}/></button></div><div className="mobile-nav-inner">{mobileContent}</div></aside>
  </header>;
}