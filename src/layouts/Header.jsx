import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  RiArchive2Line,
  RiArrowRightSLine,
  RiBankCardLine,
  RiBarChart2Line,
  RiBuilding4Line,
  RiCloseLine,
  RiCoupon3Line,
  RiDashboardLine,
  RiFileList3Line,
  RiFolder2Line,
  RiGridLine,
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
  RiStore2Line,
  RiTruckLine,
  RiUser3Line,
  RiUserLine,
  RiUserSettingsLine,
  RiVipCrownLine,
  RiStarLine,
} from '@remixicon/react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

import '../styles/desktop-menu.css';

const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'owner',
]);

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
  [
    'Customers',
    ['users', 'user-actions', 'reviews'],
  ],
  ['Business', ['business-profile']],
  [
    'Operations',
    [
      'rbac',
      'notifications',
      'reports',
      'audit',
      'settings',
    ],
  ],
];

const ADMIN_ITEM_MAP = new Map(
  ADMIN_NAV.map(
    ([key, label, Icon]) => [
      key,
      { label, Icon },
    ],
  ),
);

function getUserDisplayName(user) {
  return (
    user?.full_name ||
    user?.name ||
    'Welcome'
  );
}

function getUserRole(user) {
  return String(
    user?.role || '',
  ).toLowerCase();
}

function isAdminUser(user) {
  return (
    ADMIN_ROLES.has(getUserRole(user)) ||
    user?.is_admin === true
  );
}

function MenuLink({
  to,
  label,
  Icon,
  onClick,
  className = '',
}) {
  return (
    <Link
      to={to}
      className={className || undefined}
      onClick={onClick}
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
}

function AdminMenuLink({
  item,
  active,
  onClick,
}) {
  const { label, Icon } = item;

  return (
    <Link
      to={`/admin?panel=${encodeURIComponent(
        item.key,
      )}`}
      onClick={onClick}
      className={
        active
          ? 'is-active'
          : undefined
      }
      aria-current={
        active ? 'page' : undefined
      }
    >
      <Icon
        size={18}
        aria-hidden="true"
      />
      <span>{label}</span>
      <RiArrowRightSLine
        className="admin-menu-arrow"
        size={16}
        aria-hidden="true"
      />
    </Link>
  );
}

export default function Header() {
  const {
    isAuthenticated,
    user,
    logout,
  } = useAuth();

  const { itemCount } = useCart();
  const { toast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const mobileNavRef =
    useRef(null);

  const mobileCloseRef =
    useRef(null);

  const accountTriggerRef =
    useRef(null);

  const path = location.pathname;

  const isAdminPage =
    path === '/admin' ||
    path.startsWith('/admin/');

  const isAdmin =
    isAdminUser(user);

  const activeAdminPanel =
    isAdminPage
      ? new URLSearchParams(
          location.search,
        ).get('panel')
      : null;

  const cartLabel =
    itemCount > 0
      ? `Shopping bag, ${itemCount} ${
          itemCount === 1
            ? 'item'
            : 'items'
        }`
      : 'Shopping bag, empty';

  /*
   * Route changes should always close
   * transient navigation UI.
   */
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [
    location.pathname,
    location.search,
    location.hash,
  ]);

  /*
   * Prevent page scroll while the mobile
   * navigation drawer is open.
   */
  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousPaddingRight =
      document.body.style.paddingRight;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.paddingRight =
        previousPaddingRight;
    };
  }, [mobileOpen]);

  /*
   * Close account dropdown when clicking
   * outside it or pressing Escape.
   */
  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (
      event,
    ) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !target.closest?.(
          '.account-menu-wrap',
        )
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented
      ) {
        return;
      }

      event.preventDefault();
      setMenuOpen(false);

      requestAnimationFrame(() => {
        accountTriggerRef.current?.focus();
      });
    };

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    );

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [menuOpen]);

  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, []);

  useFocusTrap({
    enabled: mobileOpen,
    containerRef: mobileNavRef,
    initialFocusRef: mobileCloseRef,
    onEscape: closeAll,
  });

  const onSearch = useCallback(
    (event) => {
      event.preventDefault();

      const form =
        event.currentTarget;

      const input =
        form.elements.namedItem(
          'query',
        );

      const query =
        input?.value
          ?.trim() || '';

      navigate(
        query
          ? `/shop?q=${encodeURIComponent(
              query,
            )}`
          : '/shop',
      );

      closeAll();
    },
    [navigate, closeAll],
  );

  const onLogout = useCallback(
    async () => {
      closeAll();

      try {
        await logout();
        toast.success(
          'You have been signed out.',
        );
        navigate('/');
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to sign out.',
        );
      }
    },
    [
      closeAll,
      logout,
      navigate,
      toast,
    ],
  );

  const adminMenuItems = useMemo(
    () =>
      ADMIN_GROUPS.map(
        ([group, keys]) => ({
          group,
          items: keys
            .map((key) => {
              const item =
                ADMIN_ITEM_MAP.get(
                  key,
                );

              if (!item) {
                return null;
              }

              return {
                key,
                ...item,
              };
            })
            .filter(Boolean),
        }),
      ),
    [],
  );

  const mobileContent =
    isAdminPage && isAdmin ? (
      <>
        <div
          className="mobile-nav-section mobile-admin-nav"
          aria-label="Admin navigation"
        >
          {adminMenuItems.map(
            ({
              group,
              items,
            }) => (
              <section
                key={group}
                className="mobile-admin-group"
                aria-labelledby={`mobile-admin-${group
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                <h2
                  id={`mobile-admin-${group
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`}
                  className="mobile-admin-label"
                >
                  {group}
                </h2>

                {items.map(
                  (item) => (
                    <AdminMenuLink
                      key={item.key}
                      item={item}
                      active={
                        activeAdminPanel ===
                        item.key
                      }
                      onClick={
                        closeAll
                      }
                    />
                  ),
                )}
              </section>
            ),
          )}
        </div>

        <div className="mobile-nav-section mobile-account-actions">
          <MenuLink
            to="/"
            label="View storefront"
            Icon={RiHomeLine}
            onClick={closeAll}
          />
        </div>
      </>
    ) : (
      <>
        <form
          className="mobile-search"
          onSubmit={onSearch}
          role="search"
        >
          <RiSearchLine
            size={19}
            aria-hidden="true"
          />

          <input
            name="query"
            type="search"
            placeholder="Search for products..."
            aria-label="Search for products"
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>

        <nav
          className="mobile-nav-section mobile-primary-nav"
          aria-label="Main navigation"
        >
          <MenuLink
            to="/"
            label="Home"
            Icon={RiHomeLine}
            onClick={closeAll}
          />

          <MenuLink
            to="/shop"
            label="Shop"
            Icon={RiStore2Line}
            onClick={closeAll}
          />

          <MenuLink
            to="/shop"
            label="Categories"
            Icon={RiGridLine}
            onClick={closeAll}
          />
        </nav>

        <nav
          className="mobile-nav-section mobile-shopping-nav"
          aria-label="Shopping navigation"
        >
          <MenuLink
            to="/cart"
            label={
              itemCount
                ? `Shopping bag (${itemCount})`
                : 'Shopping bag'
            }
            Icon={RiShoppingBagLine}
            onClick={closeAll}
          />

          <MenuLink
            to="/orders"
            label="Orders"
            Icon={RiArchive2Line}
            onClick={closeAll}
          />

          <MenuLink
            to="/account"
            label="Account"
            Icon={RiUser3Line}
            onClick={closeAll}
          />
        </nav>

        <nav
          className="mobile-nav-section mobile-info-nav"
          aria-label="Information"
        >
          <MenuLink
            to="/about"
            label="About"
            Icon={RiInformationLine}
            onClick={closeAll}
          />

          <a
            href="mailto:support@luviio.in"
            onClick={closeAll}
          >
            <RiMailLine
              size={18}
              aria-hidden="true"
            />
            <span>
              Contact
            </span>
          </a>
        </nav>

        <div className="mobile-nav-section mobile-account-actions">
          {isAdmin && (
            <MenuLink
              to="/admin"
              label="Admin dashboard"
              Icon={RiShieldStarLine}
              onClick={closeAll}
            />
          )}

          {isAuthenticated && (
            <button
              type="button"
              onClick={onLogout}
            >
              <RiLogoutBoxRLine
                size={18}
                aria-hidden="true"
              />
              <span>
                Sign out
              </span>
            </button>
          )}
        </div>
      </>
    );

  return (
    <header className="header">
      <div className="header-reference-inner">
        <Link
          className="brand"
          to="/"
          onClick={closeAll}
          aria-label="Luviio home"
        >
          luviio
        </Link>

        <nav
          className="nav-links"
          aria-label="Primary navigation"
        >
          <NavLink
            end
            to="/"
          >
            Home
          </NavLink>

          <NavLink
            end
            to="/shop"
          >
            Shop
          </NavLink>

          <NavLink
            end
            to="/about"
          >
            About
          </NavLink>

          <a href="mailto:support@luviio.in">
            Contact
          </a>
        </nav>

        <div className="header-actions">
          <form
            className="search-form"
            onSubmit={onSearch}
            role="search"
          >
            <RiSearchLine
              className="search-icon"
              size={18}
              aria-hidden="true"
            />

            <input
              name="query"
              type="search"
              placeholder="Search for products..."
              aria-label="Search for products"
              autoComplete="off"
              enterKeyHint="search"
            />
          </form>

          {!isAuthenticated && (
            <Link
              className="icon-btn header-account-icon"
              to="/account"
              aria-label="Account"
            >
              <RiUserLine
                size={20}
                aria-hidden="true"
              />
            </Link>
          )}

          <Link
            className="icon-btn header-cart-icon"
            to="/cart"
            aria-label={cartLabel}
          >
            <RiShoppingBagLine
              size={21}
              aria-hidden="true"
            />

            {itemCount > 0 && (
              <span
                className="cart-count"
                aria-hidden="true"
              >
                {itemCount > 99
                  ? '99+'
                  : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated && (
            <div className="account-menu-wrap">
              <button
                ref={accountTriggerRef}
                type="button"
                className="icon-btn account-trigger"
                onClick={() =>
                  setMenuOpen(
                    (current) =>
                      !current,
                  )
                }
                aria-label="Account menu"
                aria-expanded={
                  menuOpen
                }
                aria-controls="account-menu"
              >
                <RiUserLine
                  size={20}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  id="account-menu"
                  className="account-menu"
                  role="menu"
                  aria-label="Account menu"
                >
                  <div
                    className="menu-user"
                    role="presentation"
                  >
                    <strong>
                      {getUserDisplayName(
                        user,
                      )}
                    </strong>

                    {user?.email && (
                      <span>
                        {user.email}
                      </span>
                    )}
                  </div>

                  <Link
                    to="/account"
                    onClick={closeAll}
                    role="menuitem"
                  >
                    <RiUser3Line
                      size={16}
                      aria-hidden="true"
                    />
                    <span>
                      Profile
                    </span>
                  </Link>

                  <Link
                    to="/orders"
                    onClick={closeAll}
                    role="menuitem"
                  >
                    <RiArchive2Line
                      size={16}
                      aria-hidden="true"
                    />
                    <span>
                      Orders
                    </span>
                  </Link>

                  <Link
                    to="/account/addresses"
                    onClick={closeAll}
                    role="menuitem"
                  >
                    <RiMapPin2Line
                      size={16}
                      aria-hidden="true"
                    />
                    <span>
                      Addresses
                    </span>
                  </Link>

                  <Link
                    to="/account/settings"
                    onClick={closeAll}
                    role="menuitem"
                  >
                    <RiSettings3Line
                      size={16}
                      aria-hidden="true"
                    />
                    <span>
                      Settings
                    </span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={closeAll}
                      role="menuitem"
                    >
                      <RiShieldStarLine
                        size={16}
                        aria-hidden="true"
                      />
                      <span>
                        Admin dashboard
                      </span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={onLogout}
                    role="menuitem"
                  >
                    <RiLogoutBoxRLine
                      size={16}
                      aria-hidden="true"
                    />
                    <span>
                      Sign out
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setMobileOpen(
                (current) =>
                  !current,
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
          >
            {mobileOpen ? (
              <RiCloseLine
                size={22}
                aria-hidden="true"
              />
            ) : (
              <RiMenuLine
                size={22}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>

      <div
        className={`mobile-menu-backdrop${
          mobileOpen
            ? ' is-open'
            : ''
        }`}
        aria-hidden="true"
        onClick={closeAll}
      />

      <aside
        ref={mobileNavRef}
        id="mobile-navigation"
        className={`mobile-nav${
          mobileOpen
            ? ' is-open'
            : ''
        }`}
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-nav-head">
          <Link
            className="mobile-nav-brand"
            to="/"
            onClick={closeAll}
            tabIndex={
              mobileOpen
                ? 0
                : -1
            }
          >
            luviio
          </Link>

          <button
            ref={mobileCloseRef}
            type="button"
            className="mobile-nav-close"
            onClick={closeAll}
            aria-label="Close menu"
            tabIndex={
              mobileOpen
                ? 0
                : -1
            }
          >
            <RiCloseLine
              size={20}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="mobile-nav-inner">
          {mobileContent}
        </div>
      </aside>
    </header>
  );
}