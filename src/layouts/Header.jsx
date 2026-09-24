import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RiArchive2Line,
  RiArrowDownSLine,
  RiBarChart2Line,
  RiBankCardLine,
  RiBuilding4Line,
  RiCloseLine,
  RiCoupon3Line,
  RiDashboardLine,
  RiFileList3Line,
  RiFolder2Line,
  RiGridLine,
  RiHeart3Line,
  RiHomeLine,
  RiInformationLine,
  RiLogoutBoxRLine,
  RiMailLine,
  RiMapPin2Line,
  RiMenuLine,
  RiNotification3Line,
  RiPriceTag3Line,
  RiSearchLine,
  RiSettings3Line,
  RiShieldKeyholeLine,
  RiShieldStarLine,
  RiShoppingBagLine,
  RiShoppingCart2Line,
  RiStackLine,
  RiStarLine,
  RiStore2Line,
  RiTruckLine,
  RiUser3Line,
  RiUserLine,
  RiUserSettingsLine,
  RiVipCrownLine,
} from '@remixicon/react';

import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ADMIN_NAV = [
  ['dashboard', 'Dashboard', RiDashboardLine],
  ['products', 'Products', RiPriceTag3Line],
  ['categories', 'Categories', RiFolder2Line],
  ['orders', 'Orders', RiShoppingCart2Line],
  ['coupons', 'Coupons', RiCoupon3Line],
  ['inventory', 'Inventory', RiStackLine],
  ['shipping', 'Shipping', RiTruckLine],
  ['fulfillment', 'Fulfillment', RiTruckLine],
  ['subscriptions', 'Subscriptions', RiVipCrownLine],
  ['users', 'Users', RiUser3Line],
  ['user-actions', 'User Actions', RiUserSettingsLine],
  ['reviews', 'Reviews', RiStarLine],
  ['rbac', 'Roles & Permissions', RiShieldKeyholeLine],
  ['notifications', 'Notifications', RiNotification3Line],
  ['settings', 'Settings', RiSettings3Line],
  ['business-profile', 'Business Profile', RiBuilding4Line],
  ['payments', 'Payments', RiBankCardLine],
  ['reports', 'Reports', RiBarChart2Line],
  ['audit', 'Audit Logs', RiFileList3Line],
];

const ADMIN_GROUPS = [
  ['Overview', ['dashboard']],
  ['Catalogue', ['products', 'categories']],
  [
    'Commerce',
    [
      'orders',
      'coupons',
      'inventory',
      'shipping',
      'fulfillment',
      'subscriptions',
      'payments',
    ],
  ],
  ['Customers', ['users', 'user-actions', 'reviews']],
  ['Business', ['business-profile']],
  [
    'Operations',
    ['rbac', 'notifications', 'reports', 'audit', 'settings'],
  ],
];

const navItemStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 40,
  padding: '0 12px',
  borderRadius: 10,
  color: '#64748b',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 650,
  letterSpacing: '-0.01em',
  transition:
    'color 160ms ease, background 160ms ease',
};

const iconButtonStyle = {
  position: 'relative',
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  padding: 0,
  border: '1px solid rgba(15,23,42,.09)',
  borderRadius: 11,
  color: '#334155',
  background: '#fff',
  cursor: 'pointer',
  transition:
    'background 160ms ease, border-color 160ms ease, transform 160ms ease',
};

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { toast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const mobileNavRef = useRef(null);
  const mobileCloseRef = useRef(null);

  const path = location.pathname;

  const isAdminPage =
    path === '/admin' ||
    path.startsWith('/admin/');

  const isAdmin =
    ['admin', 'super_admin', 'owner'].includes(
      String(user?.role || '').toLowerCase()
    ) || user?.is_admin === true;

  const currentAdminPanel =
    new URLSearchParams(location.search).get('panel') ||
    'dashboard';

  const adminItemMap = useMemo(
    () =>
      new Map(
        ADMIN_NAV.map(([key, label, Icon]) => [
          key,
          [label, Icon],
        ])
      ),
    []
  );

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();

    window.addEventListener('scroll', onScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previous = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (!event.target.closest('[data-account-menu]')) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      'pointerdown',
      onPointerDown
    );

    document.addEventListener(
      'keydown',
      onKeyDown
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        onPointerDown
      );

      document.removeEventListener(
        'keydown',
        onKeyDown
      );
    };
  }, [menuOpen]);

  useFocusTrap({
    enabled: mobileOpen,
    containerRef: mobileNavRef,
    initialFocusRef: mobileCloseRef,
    onEscape: () => {
      setMobileOpen(false);
    },
  });

  const closeAll = () => {
    setMobileOpen(false);
    setMenuOpen(false);
  };

  const onSearch = (event) => {
    event.preventDefault();

    const query =
      event.currentTarget.query.value.trim();

    navigate(
      query
        ? `/shop?q=${encodeURIComponent(query)}`
        : '/shop'
    );

    closeAll();
  };

  const onLogout = async () => {
    closeAll();

    try {
      await logout();
      toast.success(
        'You have been signed out.'
      );
      navigate('/');
    } catch (error) {
      toast.error(
        error?.message ||
          'Unable to sign out right now.'
      );
    }
  };

  const accountTarget = isAuthenticated
    ? '/account'
    : '/login';

  const accountLabel = isAuthenticated
    ? 'Account'
    : 'Sign in';

  const menuLink = (
    to,
    label,
    Icon = null
  ) => (
    <Link
      to={to}
      onClick={closeAll}
      style={styles.mobileLink}
    >
      {Icon && (
        <Icon
          size={19}
          aria-hidden="true"
        />
      )}

      <span>{label}</span>
    </Link>
  );

  const adminMenuLink = (
    key,
    label,
    Icon = null
  ) => {
    const active =
      isAdminPage &&
      currentAdminPanel === key;

    return (
      <Link
        to={`/admin?panel=${key}`}
        onClick={closeAll}
        className={active ? 'is-active' : undefined}
        aria-current={
          active ? 'page' : undefined
        }
        style={{
          ...styles.adminMobileLink,
          ...(active
            ? styles.adminMobileLinkActive
            : {}),
        }}
      >
        {Icon && (
          <Icon
            size={18}
            aria-hidden="true"
          />
        )}

        <span>{label}</span>
      </Link>
    );
  };

  const mobileContent =
    isAdminPage && isAdmin ? (
      <>
        <div style={styles.mobileAdminContainer}>
          {ADMIN_GROUPS.map(
            ([group, keys]) => (
              <div
                key={group}
                style={styles.mobileAdminGroup}
              >
                <div
                  style={
                    styles.mobileAdminLabel
                  }
                >
                  {group}
                </div>

                {keys.map((key) => {
                  const item =
                    adminItemMap.get(key);

                  if (!item) return null;

                  const [label, Icon] =
                    item;

                  return (
                    <div key={key}>
                      {adminMenuLink(
                        key,
                        label,
                        Icon
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {menuLink(
          '/',
          'View storefront',
          RiHomeLine
        )}
      </>
    ) : (
      <>
        <form
          onSubmit={onSearch}
          role="search"
          style={styles.mobileSearch}
        >
          <RiSearchLine
            size={19}
            color="#64748b"
          />

          <input
            name="query"
            placeholder="Search products..."
            aria-label="Search for products"
            autoComplete="off"
            style={styles.mobileSearchInput}
          />
        </form>

        <div style={styles.mobileSection}>
          {menuLink(
            '/',
            'Home',
            RiHomeLine
          )}

          {menuLink(
            '/shop',
            'Shop',
            RiStore2Line
          )}

          {menuLink(
            '/shop',
            'Categories',
            RiGridLine
          )}
        </div>

        <div style={styles.mobileSection}>
          {menuLink(
            '/cart',
            `Shopping bag${
              itemCount
                ? ` (${itemCount})`
                : ''
            }`,
            RiShoppingBagLine
          )}

          {menuLink(
            '/orders',
            'Orders',
            RiArchive2Line
          )}

          {menuLink(
            accountTarget,
            accountLabel,
            RiUser3Line
          )}
        </div>

        <div style={styles.mobileSection}>
          {menuLink(
            '/about',
            'About',
            RiInformationLine
          )}

          <a
            href="mailto:support@luviio.in"
            onClick={closeAll}
            style={styles.mobileLink}
          >
            <RiMailLine size={19} />
            <span>Contact</span>
          </a>
        </div>

        <div
          style={{
            ...styles.mobileSection,
            borderBottom: 0,
          }}
        >
          {!isAuthenticated &&
            menuLink(
              '/register',
              'Create account',
              RiUserLine
            )}

          {!isAuthenticated &&
            menuLink(
              '/login',
              'Sign in',
              RiUser3Line
            )}

          {isAdmin &&
            menuLink(
              '/admin',
              'Admin dashboard',
              RiShieldStarLine
            )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={onLogout}
              style={
                styles.mobileAction
              }
            >
              <RiLogoutBoxRLine
                size={19}
              />

              <span>Sign out</span>
            </button>
          )}
        </div>
      </>
    );

  return (
    <>
      <header
        style={{
          ...styles.header,
          ...(scrolled
            ? styles.headerScrolled
            : {}),
        }}
      >
        <div style={styles.headerInner}>
          {/* BRAND */}
          <Link
            to="/"
            onClick={closeAll}
            aria-label="Luviio home"
            style={styles.brand}
          >
            <span style={styles.brandMark}>
              l
            </span>

            <span>luviio</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav
            aria-label="Primary navigation"
            style={styles.desktopNav}
          >
            <NavLink
              end
              to="/"
              style={navLinkStyle}
            >
              Home
            </NavLink>

            <NavLink
              end
              to="/shop"
              style={navLinkStyle}
            >
              Shop
            </NavLink>

            <NavLink
              end
              to="/about"
              style={navLinkStyle}
            >
              About
            </NavLink>

            <a
              href="mailto:support@luviio.in"
              style={navLinkStyle}
            >
              Contact
            </a>
          </nav>

          {/* HEADER ACTIONS */}
          <div style={styles.actions}>
            <form
              onSubmit={onSearch}
              role="search"
              style={styles.desktopSearch}
            >
              <RiSearchLine
                size={17}
                color="#64748b"
              />

              <input
                name="query"
                placeholder="Search products..."
                aria-label="Search for products"
                autoComplete="off"
                style={styles.searchInput}
              />

              <kbd style={styles.searchHint}>
                /
              </kbd>
            </form>

            {/* ACCOUNT */}
            <div
              data-account-menu
              style={
                styles.accountContainer
              }
            >
              <button
                type="button"
                aria-label={
                  isAuthenticated
                    ? 'Open account menu'
                    : 'Sign in'
                }
                aria-expanded={
                  menuOpen
                }
                aria-controls="account-menu"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }

                  setMenuOpen(
                    (value) => !value
                  );
                }}
                style={{
                  ...iconButtonStyle,
                  ...(menuOpen
                    ? styles.iconButtonActive
                    : {}),
                }}
              >
                <RiUserLine size={20} />

                {isAuthenticated && (
                  <span
                    style={
                      styles.accountStatus
                    }
                  />
                )}
              </button>

              {isAuthenticated &&
                menuOpen && (
                  <div
                    id="account-menu"
                    role="menu"
                    style={
                      styles.accountMenu
                    }
                  >
                    <div
                      style={
                        styles.menuIdentity
                      }
                    >
                      <div
                        style={
                          styles.avatar
                        }
                      >
                        {(
                          user?.full_name ||
                          user?.name ||
                          'U'
                        )
                          .trim()
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div
                        style={
                          styles.identityText
                        }
                      >
                        <strong>
                          {user?.full_name ||
                            user?.name ||
                            'Welcome'}
                        </strong>

                        <span>
                          {user?.email || ''}
                        </span>
                      </div>
                    </div>

                    <div
                      style={
                        styles.menuDivider
                      }
                    />

                    <AccountMenuLink
                      to="/account"
                      icon={RiUser3Line}
                      label="Profile"
                      close={closeAll}
                    />

                    <AccountMenuLink
                      to="/orders"
                      icon={RiArchive2Line}
                      label="Orders"
                      close={closeAll}
                    />

                    <AccountMenuLink
                      to="/account/addresses"
                      icon={RiMapPin2Line}
                      label="Addresses"
                      close={closeAll}
                    />

                    <AccountMenuLink
                      to="/account/settings"
                      icon={RiSettings3Line}
                      label="Settings"
                      close={closeAll}
                    />

                    <div
                      style={
                        styles.menuDivider
                      }
                    />

                    {isAdmin && (
                      <AccountMenuLink
                        to="/admin"
                        icon={
                          RiShieldStarLine
                        }
                        label="Admin dashboard"
                        close={closeAll}
                        accent
                      />
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={
                        onLogout
                      }
                      style={
                        styles.menuLogout
                      }
                    >
                      <RiLogoutBoxRLine
                        size={17}
                      />

                      <span>
                        Sign out
                      </span>
                    </button>
                  </div>
                )}
            </div>

            {/* CART */}
            <Link
              to="/cart"
              aria-label={`Shopping bag, ${itemCount} items`}
              style={{
                ...iconButtonStyle,
                textDecoration: 'none',
              }}
            >
              <RiShoppingBagLine
                size={21}
              />

              {itemCount > 0 && (
                <span
                  style={
                    styles.cartCount
                  }
                >
                  {itemCount > 99
                    ? '99+'
                    : itemCount}
                </span>
              )}
            </Link>

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(
                  (value) => !value
                );

                setMenuOpen(false);
              }}
              aria-expanded={
                mobileOpen
              }
              aria-controls="mobile-navigation"
              aria-label={
                mobileOpen
                  ? 'Close menu'
                  : 'Open menu'
              }
              style={
                styles.mobileMenuButton
              }
            >
              {mobileOpen ? (
                <RiCloseLine
                  size={22}
                />
              ) : (
                <RiMenuLine
                  size={22}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BACKDROP */}
      <div
        aria-hidden={!mobileOpen}
        onClick={closeAll}
        style={{
          ...styles.backdrop,
          ...(mobileOpen
            ? styles.backdropOpen
            : {}),
        }}
      />

      {/* MOBILE DRAWER */}
      <aside
        ref={mobileNavRef}
        id="mobile-navigation"
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        style={{
          ...styles.mobileDrawer,
          ...(mobileOpen
            ? styles.mobileDrawerOpen
            : {}),
        }}
      >
        <div
          style={
            styles.mobileDrawerHeader
          }
        >
          <Link
            to="/"
            onClick={closeAll}
            style={
              styles.mobileBrand
            }
          >
            luviio
          </Link>

          <button
            ref={mobileCloseRef}
            type="button"
            onClick={closeAll}
            aria-label="Close menu"
            style={
              styles.mobileCloseButton
            }
          >
            <RiCloseLine
              size={21}
            />
          </button>
        </div>

        <div
          style={
            styles.mobileDrawerContent
          }
        >
          {mobileContent}
        </div>
      </aside>
    </>
  );
}

function AccountMenuLink({
  to,
  icon: Icon,
  label,
  close,
  accent = false,
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={close}
      style={{
        ...styles.menuLink,
        ...(accent
          ? styles.menuLinkAccent
          : {}),
      }}
    >
      <Icon size={17} />
      <span>{label}</span>
    </Link>
  );
}

function navLinkStyle({
  isActive,
}) {
  return {
    ...navItemStyle,
    color: isActive
      ? '#111827'
      : '#64748b',
    background: isActive
      ? '#f5f3ee'
      : 'transparent',
  };
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    background: 'rgba(255,255,255,.94)',
    borderBottom:
      '1px solid rgba(15,23,42,.07)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    transition:
      'box-shadow 200ms ease, background 200ms ease',
  },

  headerScrolled: {
    background: 'rgba(255,255,255,.88)',
    boxShadow:
      '0 8px 30px rgba(15,23,42,.07)',
  },

  headerInner: {
    width: '100%',
    maxWidth: 1440,
    minHeight: 70,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 28,
  },

  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
    color: '#111827',
    textDecoration: 'none',
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: '-0.055em',
  },

  brandMark: {
    display: 'grid',
    placeItems: 'center',
    width: 28,
    height: 28,
    borderRadius: 9,
    color: '#fff',
    background:
      'linear-gradient(135deg,#111827,#374151)',
    fontSize: 17,
    fontWeight: 850,
    letterSpacing: '-.04em',
  },

  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },

  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginLeft: 'auto',
  },

  desktopSearch: {
    width: 'min(280px, 25vw)',
    height: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px 0 13px',
    border:
      '1px solid rgba(15,23,42,.09)',
    borderRadius: 11,
    background: '#f8fafc',
  },

  searchInput: {
    minWidth: 0,
    width: '100%',
    height: '100%',
    padding: 0,
    border: 0,
    outline: 0,
    color: '#111827',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 550,
  },

  searchHint: {
    display: 'grid',
    placeItems: 'center',
    width: 20,
    height: 20,
    flexShrink: 0,
    border:
      '1px solid rgba(15,23,42,.09)',
    borderRadius: 5,
    color: '#94a3b8',
    background: '#fff',
    fontSize: 11,
    fontFamily: 'inherit',
  },

  accountContainer: {
    position: 'relative',
  },

  iconButtonActive: {
    color: '#111827',
    background: '#f5f3ee',
    borderColor:
      'rgba(184,145,67,.28)',
  },

  accountStatus: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid #fff',
  },

  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    display: 'grid',
    placeItems: 'center',
    padding: '0 4px',
    border: '2px solid #fff',
    borderRadius: 999,
    color: '#fff',
    background: '#b89143',
    fontSize: 9,
    lineHeight: 1,
    fontWeight: 850,
  },

  accountMenu: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: 270,
    padding: 8,
    border:
      '1px solid rgba(15,23,42,.09)',
    borderRadius: 16,
    background: '#fff',
    boxShadow:
      '0 20px 50px rgba(15,23,42,.14)',
  },

  menuIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    borderRadius: 12,
    color: '#fff',
    background:
      'linear-gradient(135deg,#111827,#475569)',
    fontSize: 14,
    fontWeight: 800,
  },

  identityText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },

  menuDivider: {
    height: 1,
    margin: '5px 4px',
    background:
      'rgba(15,23,42,.07)',
  },

  menuLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    minHeight: 40,
    padding: '0 10px',
    borderRadius: 9,
    color: '#475569',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 650,
  },

  menuLinkAccent: {
    color: '#8a692d',
    background: '#faf7ef',
  },

  menuLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    minHeight: 40,
    padding: '0 10px',
    border: 0,
    borderRadius: 9,
    color: '#b91c1c',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 650,
    cursor: 'pointer',
    textAlign: 'left',
  },

  mobileMenuButton: {
    ...iconButtonStyle,
    display: 'none',
  },

  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 998,
    background: 'rgba(15,23,42,.42)',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 200ms ease',
    backdropFilter: 'blur(2px)',
  },

  backdropOpen: {
    opacity: 1,
    pointerEvents: 'auto',
  },

  mobileDrawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    width: 'min(390px, 92vw)',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    boxShadow:
      '-20px 0 60px rgba(15,23,42,.16)',
    transform: 'translateX(105%)',
    transition:
      'transform 260ms cubic-bezier(.2,.8,.2,1)',
  },

  mobileDrawerOpen: {
    transform: 'translateX(0)',
  },

  mobileDrawerHeader: {
    minHeight: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 18px',
    borderBottom:
      '1px solid rgba(15,23,42,.07)',
  },

  mobileBrand: {
    color: '#111827',
    textDecoration: 'none',
    fontSize: 24,
    fontWeight: 850,
    letterSpacing: '-.055em',
  },

  mobileCloseButton: {
    width: 40,
    height: 40,
    display: 'grid',
    placeItems: 'center',
    border:
      '1px solid rgba(15,23,42,.08)',
    borderRadius: 11,
    color: '#334155',
    background: '#fff',
    cursor: 'pointer',
  },

  mobileDrawerContent: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    WebkitOverflowScrolling: 'touch',
  },

  mobileSearch: {
    height: 46,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '0 13px',
    marginBottom: 14,
    border:
      '1px solid rgba(15,23,42,.1)',
    borderRadius: 13,
    background: '#f8fafc',
  },

  mobileSearchInput: {
    width: '100%',
    minWidth: 0,
    height: '100%',
    border: 0,
    outline: 0,
    color: '#111827',
    background: 'transparent',
    fontSize: 13,
  },

  mobileSection: {
    padding: '8px 0',
    borderBottom:
      '1px solid rgba(15,23,42,.07)',
  },

  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 47,
    padding: '0 11px',
    borderRadius: 11,
    color: '#334155',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 650,
  },

  mobileAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    minHeight: 47,
    padding: '0 11px',
    border: 0,
    borderRadius: 11,
    color: '#b91c1c',
    background: 'transparent',
    fontSize: 14,
    fontWeight: 650,
    cursor: 'pointer',
    textAlign: 'left',
  },

  mobileAdminContainer: {
    paddingBottom: 8,
  },

  mobileAdminGroup: {
    padding: '9px 0',
    borderBottom:
      '1px solid rgba(15,23,42,.06)',
  },

  mobileAdminLabel: {
    padding: '4px 11px 7px',
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
  },

  adminMobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    minHeight: 43,
    padding: '0 11px',
    borderRadius: 10,
    color: '#475569',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 650,
  },

  adminMobileLinkActive: {
    color: '#8a692d',
    background: '#faf7ef',
  },
};