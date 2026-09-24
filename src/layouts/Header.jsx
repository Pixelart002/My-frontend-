import { useEffect, useMemo, useRef, useState } from 'react';
import {
  RiArchive2Line,
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

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

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

const UI = {
  headerZ: 1000,
  dropdownZ: 1020,
  backdropZ: 1090,
  drawerZ: 1100,

  text: '#111827',
  muted: '#64748b',
  border: 'rgba(15,23,42,.09)',
  gold: '#b89143',
  surface: '#ffffff',
  soft: '#f8fafc',
};

const resetButton = {
  appearance: 'none',
  WebkitAppearance: 'none',
  margin: 0,
  padding: 0,
  border: 0,
  outline: 'none',
  font: 'inherit',
  lineHeight: 'normal',
  textTransform: 'none',
  textDecoration: 'none',
  boxSizing: 'border-box',
};

const resetInput = {
  appearance: 'none',
  WebkitAppearance: 'none',
  margin: 0,
  padding: 0,
  border: 0,
  outline: 'none',
  boxSizing: 'border-box',
  font: 'inherit',
};

const iconButton = {
  ...resetButton,
  position: 'relative',
  width: 42,
  height: 42,
  minWidth: 42,
  minHeight: 42,
  flex: '0 0 42px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${UI.border}`,
  borderRadius: 12,
  color: '#334155',
  background: UI.surface,
  cursor: 'pointer',
  overflow: 'visible',
  transition:
    'background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease',
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
  const [isCompact, setIsCompact] = useState(false);

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
    const syncCompact = () => {
      setIsCompact(window.innerWidth <= 980);
    };

    syncCompact();
    window.addEventListener('resize', syncCompact, { passive: true });

    return () => {
      window.removeEventListener('resize', syncCompact);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();

    window.addEventListener('scroll', onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        'scroll',
        onScroll
      );
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        !event.target.closest(
          '[data-account-menu]'
        )
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      'pointerdown',
      handlePointerDown
    );

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [menuOpen]);

  useFocusTrap({
    enabled: mobileOpen,
    containerRef: mobileNavRef,
    initialFocusRef: mobileCloseRef,
    onEscape: () => setMobileOpen(false),
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
      toast.success('You have been signed out.');
      navigate('/');
    } catch (error) {
      toast.error(
        error?.message || 'Unable to sign out right now.'
      );
    }
  };

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
      {Icon && <Icon size={19} aria-hidden="true" />}
      <span>{label}</span>
    </Link>
  );

  const adminMenuLink = (
    key,
    label,
    Icon
  ) => {
    const active =
      isAdminPage &&
      currentAdminPanel === key;

    return (
      <Link
        to={`/admin?panel=${key}`}
        onClick={closeAll}
        aria-current={
          active ? 'page' : undefined
        }
        style={{
          ...styles.adminLink,
          ...(active
            ? styles.adminLinkActive
            : {}),
        }}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
      </Link>
    );
  };

  const mobileContent =
    isAdminPage && isAdmin ? (
      <>
        <div style={styles.adminGroups}>
          {ADMIN_GROUPS.map(
            ([group, keys]) => (
              <section
                key={group}
                style={styles.adminGroup}
              >
                <div
                  style={
                    styles.adminGroupLabel
                  }
                >
                  {group}
                </div>

                {keys.map((key) => {
                  const item =
                    adminItemMap.get(key);

                  if (!item) return null;

                  const [label, Icon] = item;

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
              </section>
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
            color={UI.muted}
            aria-hidden="true"
          />

          <input
            name="query"
            placeholder="Search products..."
            aria-label="Search for products"
            autoComplete="off"
            style={styles.mobileSearchInput}
          />
        </form>

        <section style={styles.mobileSection}>
          {menuLink('/', 'Home', RiHomeLine)}
          {menuLink('/shop', 'Shop', RiStore2Line)}
          {menuLink(
            '/shop',
            'Categories',
            RiGridLine
          )}
        </section>

        <section style={styles.mobileSection}>
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
            isAuthenticated
              ? '/account'
              : '/login',
            isAuthenticated
              ? 'Account'
              : 'Sign in',
            RiUser3Line
          )}
        </section>

        <section style={styles.mobileSection}>
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
        </section>

        <section
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
              style={styles.mobileLogout}
            >
              <RiLogoutBoxRLine size={19} />
              <span>Sign out</span>
            </button>
          )}
        </section>
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
            style={{
              ...styles.desktopNav,
              display: isCompact ? 'none' : 'flex',
            }}
          >
            <NavLink
              end
              to="/"
              style={desktopNavLink}
            >
              Home
            </NavLink>

            <NavLink
              to="/shop"
              style={desktopNavLink}
            >
              Shop
            </NavLink>

            <NavLink
              to="/about"
              style={desktopNavLink}
            >
              About
            </NavLink>

            <a
              href="mailto:support@luviio.in"
              style={desktopNavLink}
            >
              Contact
            </a>
          </nav>

          {/* ACTION AREA */}
          <div style={styles.actions}>
            <form
              onSubmit={onSearch}
              role="search"
              style={{
                ...styles.desktopSearch,
                display: isCompact ? 'none' : 'flex',
              }}
            >
              <RiSearchLine
                size={17}
                color={UI.muted}
                aria-hidden="true"
              />

              <input
                name="query"
                placeholder="Search products..."
                aria-label="Search for products"
                autoComplete="off"
                style={styles.searchInput}
              />

              <kbd style={styles.searchKey}>
                /
              </kbd>
            </form>

            {/* ACCOUNT */}
            <div
              data-account-menu
              style={styles.accountWrap}
            >
              <button
                type="button"
                aria-label={
                  isAuthenticated
                    ? 'Open account menu'
                    : 'Sign in'
                }
                aria-expanded={
                  isAuthenticated
                    ? menuOpen
                    : undefined
                }
                aria-haspopup={
                  isAuthenticated
                    ? 'menu'
                    : undefined
                }
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
                  ...iconButton,
                  ...(menuOpen
                    ? styles.iconButtonActive
                    : {}),
                }}
              >
                <RiUserLine size={20} />

                {isAuthenticated && (
                  <span
                    aria-hidden="true"
                    style={styles.onlineDot}
                  />
                )}
              </button>

              {isAuthenticated &&
                menuOpen && (
                  <div
                    id="account-menu"
                    role="menu"
                    style={styles.accountMenu}
                  >
                    <div
                      style={
                        styles.identity
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
                          styles.identityCopy
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
                      style={styles.divider}
                    />

                    <AccountLink
                      to="/account"
                      label="Profile"
                      Icon={RiUser3Line}
                      onClick={closeAll}
                    />

                    <AccountLink
                      to="/orders"
                      label="Orders"
                      Icon={RiArchive2Line}
                      onClick={closeAll}
                    />

                    <AccountLink
                      to="/account/addresses"
                      label="Addresses"
                      Icon={RiMapPin2Line}
                      onClick={closeAll}
                    />

                    <AccountLink
                      to="/account/settings"
                      label="Settings"
                      Icon={RiSettings3Line}
                      onClick={closeAll}
                    />

                    {isAdmin && (
                      <>
                        <div
                          style={
                            styles.divider
                          }
                        />

                        <AccountLink
                          to="/admin"
                          label="Admin dashboard"
                          Icon={
                            RiShieldStarLine
                          }
                          onClick={closeAll}
                          accent
                        />
                      </>
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={onLogout}
                      style={styles.logout}
                    >
                      <RiLogoutBoxRLine
                        size={17}
                      />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
            </div>

            {/* CART */}
            <Link
              to="/cart"
              aria-label={`Shopping bag, ${itemCount} items`}
              style={iconButton}
            >
              <RiShoppingBagLine
                size={21}
              />

              {itemCount > 0 && (
                <span
                  style={styles.cartBadge}
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
              style={{
                ...iconButton,
                display: isCompact ? 'inline-flex' : 'none',
              }}
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
          ...styles.drawer,
          ...(mobileOpen
            ? styles.drawerOpen
            : {}),
        }}
      >
        <div style={styles.drawerHeader}>
          <Link
            to="/"
            onClick={closeAll}
            style={styles.mobileBrand}
          >
            luviio
          </Link>

          <button
            ref={mobileCloseRef}
            type="button"
            onClick={closeAll}
            aria-label="Close menu"
            style={iconButton}
          >
            <RiCloseLine size={21} />
          </button>
        </div>

        <div style={styles.drawerContent}>
          {mobileContent}
        </div>
      </aside>
    </>
  );
}

function AccountLink({
  to,
  label,
  Icon,
  onClick,
  accent = false,
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      style={{
        ...styles.accountLink,
        ...(accent
          ? styles.accountLinkAccent
          : {}),
      }}
    >
      <Icon size={17} />
      <span>{label}</span>
    </Link>
  );
}

function desktopNavLink({
  isActive,
}) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 11px',
    borderRadius: 10,
    color: isActive
      ? UI.text
      : UI.muted,
    background: isActive
      ? '#f5f3ee'
      : 'transparent',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: isActive ? 750 : 650,
    whiteSpace: 'nowrap',
    transition:
      'color 160ms ease, background-color 160ms ease',
  };
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: UI.headerZ,
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,.96)',
    borderBottom:
      '1px solid rgba(15,23,42,.07)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    transition:
      'box-shadow 180ms ease, background-color 180ms ease',
  },

  headerScrolled: {
    background: 'rgba(255,255,255,.91)',
    boxShadow:
      '0 8px 30px rgba(15,23,42,.07)',
  },

  headerInner: {
    width: '100%',
    maxWidth: 1440,
    minHeight: 70,
    margin: '0 auto',
    padding:
      '0 clamp(14px, 3vw, 32px)',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(12px, 2vw, 28px)',
  },

  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    flex: '0 0 auto',
    color: UI.text,
    textDecoration: 'none',
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: '-.055em',
  },

  brandMark: {
    width: 28,
    height: 28,
    flex: '0 0 28px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: 8,
    color: '#fff',
    background:
      'linear-gradient(135deg,#111827,#475569)',
    fontSize: 17,
    fontWeight: 850,
  },

  desktopNav: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },

  actions: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
    flex: '0 0 auto',
    marginLeft: 'auto',
  },

  desktopSearch: {
    width: 'clamp(180px, 22vw, 290px)',
    height: 42,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px 0 13px',
    boxSizing: 'border-box',
    border:
      '1px solid rgba(15,23,42,.09)',
    borderRadius: 12,
    background: '#f8fafc',
  },

  searchInput: {
    ...resetInput,
    width: '100%',
    minWidth: 0,
    height: '100%',
    color: UI.text,
    background: 'transparent',
    fontSize: 12,
    fontWeight: 550,
  },

  searchKey: {
    width: 21,
    height: 21,
    flex: '0 0 21px',
    display: 'grid',
    placeItems: 'center',
    boxSizing: 'border-box',
    border:
      '1px solid rgba(15,23,42,.09)',
    borderRadius: 5,
    color: '#94a3b8',
    background: '#fff',
    fontSize: 11,
    fontFamily: 'inherit',
  },

  accountWrap: {
    position: 'relative',
    zIndex: UI.dropdownZ,
    flex: '0 0 auto',
  },

  iconButtonActive: {
    color: UI.text,
    background: '#f5f3ee',
    borderColor:
      'rgba(184,145,67,.3)',
  },

  onlineDot: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 7,
    height: 7,
    boxSizing: 'border-box',
    border: '2px solid #fff',
    borderRadius: '50%',
    background: '#22c55e',
  },

  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    padding: '0 4px',
    boxSizing: 'border-box',
    display: 'grid',
    placeItems: 'center',
    border:
      '2px solid #fff',
    borderRadius: 999,
    color: '#fff',
    background: UI.gold,
    fontSize: 9,
    lineHeight: 1,
    fontWeight: 850,
    whiteSpace: 'nowrap',
  },

  accountMenu: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    zIndex: UI.dropdownZ,
    width: 270,
    maxWidth:
      'calc(100vw - 28px)',
    padding: 8,
    boxSizing: 'border-box',
    border:
      '1px solid rgba(15,23,42,.09)',
    borderRadius: 16,
    background: '#fff',
    boxShadow:
      '0 22px 55px rgba(15,23,42,.16)',
  },

  identity: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 9,
  },

  avatar: {
    width: 40,
    height: 40,
    flex: '0 0 40px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: 12,
    color: '#fff',
    background:
      'linear-gradient(135deg,#111827,#475569)',
    fontSize: 14,
    fontWeight: 850,
  },

  identityCopy: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },

  accountLink: {
    ...resetButton,
    width: '100%',
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 10px',
    borderRadius: 9,
    color: '#475569',
    background: 'transparent',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 650,
    textAlign: 'left',
  },

  accountLinkAccent: {
    color: '#8a692d',
    background: '#faf7ef',
  },

  logout: {
    ...resetButton,
    width: '100%',
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 10px',
    borderRadius: 9,
    color: '#b91c1c',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 650,
    textAlign: 'left',
  },

  divider: {
    height: 1,
    margin: '5px 4px',
    background:
      'rgba(15,23,42,.07)',
  },

  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: UI.backdropZ,
    boxSizing: 'border-box',
    background: 'rgba(15,23,42,.42)',
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
    transition:
      'opacity 200ms ease, visibility 200ms ease',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },

  backdropOpen: {
    opacity: 1,
    visibility: 'visible',
    pointerEvents: 'auto',
  },

  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: UI.drawerZ,
    width: 'min(390px, 92vw)',
    maxWidth: '100vw',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#fff',
    boxShadow:
      '-22px 0 60px rgba(15,23,42,.18)',
    transform: 'translate3d(105%,0,0)',
    visibility: 'hidden',
    transition:
      'transform 260ms cubic-bezier(.2,.8,.2,1), visibility 260ms ease',
  },

  drawerOpen: {
    transform: 'translate3d(0,0,0)',
    visibility: 'visible',
  },

  drawerHeader: {
    minHeight: 70,
    flex: '0 0 70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding:
      '0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))',
    boxSizing: 'border-box',
    borderBottom:
      '1px solid rgba(15,23,42,.07)',
  },

  mobileBrand: {
    color: UI.text,
    textDecoration: 'none',
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: '-.055em',
  },

  drawerContent: {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding:
      '12px 16px max(20px, env(safe-area-inset-bottom))',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch',
  },

  mobileSearch: {
    width: '100%',
    height: 46,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    margin: '0 0 10px',
    padding: '0 13px',
    boxSizing: 'border-box',
    border:
      '1px solid rgba(15,23,42,.1)',
    borderRadius: 13,
    background: '#f8fafc',
  },

  mobileSearchInput: {
    ...resetInput,
    width: '100%',
    minWidth: 0,
    height: '100%',
    color: UI.text,
    background: 'transparent',
    fontSize: 13,
  },

  mobileSection: {
    padding: '8px 0',
    boxSizing: 'border-box',
    borderBottom:
      '1px solid rgba(15,23,42,.07)',
  },

  mobileLink: {
    ...resetButton,
    width: '100%',
    minHeight: 46,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 11px',
    boxSizing: 'border-box',
    borderRadius: 11,
    color: '#334155',
    background: 'transparent',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 650,
    textAlign: 'left',
  },

  mobileLogout: {
    ...resetButton,
    width: '100%',
    minHeight: 46,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 11px',
    boxSizing: 'border-box',
    borderRadius: 11,
    color: '#b91c1c',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 650,
    textAlign: 'left',
  },

  adminGroups: {
    width: '100%',
  },

  adminGroup: {
    padding: '8px 0',
    boxSizing: 'border-box',
    borderBottom:
      '1px solid rgba(15,23,42,.06)',
  },

  adminGroupLabel: {
    minHeight: 26,
    display: 'flex',
    alignItems: 'center',
    padding: '0 11px',
    boxSizing: 'border-box',
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
  },

  adminLink: {
    width: '100%',
    minHeight: 43,
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '0 11px',
    boxSizing: 'border-box',
    borderRadius: 10,
    color: '#475569',
    background: 'transparent',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 650,
  },

  adminLinkActive: {
    color: '#8a692d',
    background: '#faf7ef',
  },
};