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
          className="mobile-nav-section mobile-admin-nav flex min-w-0 flex-col gap-1"
          aria-label="Admin navigation"
        >
          {adminMenuItems.map(
            ({
              group,
              items,
            }) => (
              <section
                key={group}
                className="mobile-admin-group flex min-w-0 flex-col gap-1 [&+&]:mt-2 [&+&]:border-t [&+&]:border-line [&+&]:pt-2"
                aria-labelledby={`mobile-admin-${group
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                <h2
                  id={`mobile-admin-${group
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`}
                  className="mobile-admin-label px-2.5 pb-1 pt-0 text-[10px] font-bold uppercase tracking-[.14em] leading-[1.4] text-dim"
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

        <div className="mobile-nav-section mobile-account-actions flex min-w-0 flex-col gap-1">
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
          className="mobile-search mb-3 flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border border-line bg-bg px-3 text-dim transition-colors focus-within:border-[rgb(216_173_106_/_0.5)] focus-within:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold [&_input]:min-h-10 [&_input]:min-w-0 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-text [&_input]:outline-none [&_input]:placeholder:text-dim"
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
          className="mobile-nav-section mobile-primary-nav flex min-w-0 flex-col gap-1"
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
          className="mobile-nav-section mobile-shopping-nav flex min-w-0 flex-col gap-1 border-t border-line pt-3"
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
          className="mobile-nav-section mobile-info-nav flex min-w-0 flex-col gap-1 border-t border-line pt-3"
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

        <div className="mobile-nav-section mobile-account-actions flex min-w-0 flex-col gap-1">
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
    <header className="header sticky top-0 z-[120] isolate h-[72px] min-h-[72px] border-b border-[rgb(255_255_255_/_0.07)] bg-[rgb(8_8_8_/_0.94)] text-text backdrop-blur-xl transition-[box-shadow,background-color] duration-200 max-[900px]:h-[68px] max-[900px]:min-h-[68px] max-[900px]:backdrop-blur-none">
      <div className="header-reference-inner mx-auto grid h-[72px] w-full min-w-0 grid-cols-[180px_minmax(0,1fr)_auto] items-center gap-x-8 px-[8.333vw] max-[1100px]:grid-cols-[150px_minmax(0,1fr)_auto] max-[1100px]:gap-x-[18px] max-[1100px]:px-[5vw] max-[1024px]:gap-x-5 max-[1024px]:px-[clamp(24px,5vw,52px)] max-[900px]:flex max-[900px]:h-[68px] max-[900px]:min-h-[68px] max-[900px]:gap-x-0 max-[900px]:px-5 max-[768px]:px-4 max-[640px]:px-[14px] max-[375px]:px-3">
        <Link
          className="brand min-w-0 whitespace-nowrap font-display text-[35px] font-medium leading-none tracking-[-.035em] text-gold no-underline max-[900px]:text-[30px] max-[768px]:text-[29px] max-[640px]:text-[28px] max-[375px]:text-[26px]"
          to="/"
          onClick={closeAll}
          aria-label="Luviio home"
        >
          luviio
        </Link>

        <nav
          className="nav-links flex h-full min-w-0 items-center justify-center gap-[39px] text-xs font-medium text-[rgb(245_242_236_/_0.72)] max-[1100px]:gap-[22px] max-[1024px]:gap-[clamp(16px,2.2vw,24px)] max-[900px]:hidden [&_a]:relative [&_a]:flex [&_a]:h-full [&_a]:items-center [&_a]:whitespace-nowrap [&_a]:transition-colors [&_a:hover]:text-text [&_a[aria-current=page]]:text-gold"
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

        <div className="header-actions ml-auto flex min-w-0 items-center justify-end gap-2">
          <form
            className="search-form flex h-[38px] w-[302px] min-w-[302px] items-center gap-2 rounded-full border border-[rgb(255_255_255_/_0.17)] bg-[rgb(12_12_12_/_0.72)] px-3 max-[1100px]:w-[230px] max-[1100px]:min-w-[230px] max-[1024px]:w-[clamp(190px,22vw,230px)] max-[1024px]:min-w-[190px] max-[900px]:w-[180px] max-[900px]:max-w-[180px] max-[900px]:min-w-0 max-[640px]:hidden [&_input]:h-full [&_input]:min-w-0 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:font-body [&_input]:text-[11px] [&_input]:text-text [&_input]:outline-none [&_input]:placeholder:text-[rgb(245_242_236_/_0.58)] [&_.search-icon]:shrink-0 [&_.search-icon]:text-[rgb(245_242_236_/_0.78)]"
            onSubmit={onSearch}
            role="search"
          >
            <RiSearchLine
              className="search-icon shrink-0 text-[rgb(245_242_236_/_0.78)]"
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
              className="icon-btn header-account-icon relative inline-flex h-[38px] w-[38px] min-w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-transparent text-text transition-colors duration-150 hover:bg-white/5 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[768px]:h-11 max-[768px]:w-11 max-[768px]:min-w-11"
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
            className="icon-btn header-cart-icon relative inline-flex h-[38px] w-[38px] min-w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-transparent text-text transition-colors duration-150 hover:bg-white/5 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[768px]:h-11 max-[768px]:w-11 max-[768px]:min-w-11 max-[375px]:h-[42px] max-[375px]:w-[42px] max-[375px]:min-w-[42px]"
            to="/cart"
            aria-label={cartLabel}
          >
            <RiShoppingBagLine
              size={21}
              aria-hidden="true"
            />

            {itemCount > 0 && (
              <span
                className="cart-count pointer-events-none absolute -right-0.5 -top-px inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full border border-bg bg-gold px-1 text-[9px] font-extrabold leading-none text-gold-ink max-[640px]:-right-1 max-[640px]:-top-1 max-[375px]:-right-0.5 max-[375px]:-top-0.5"
                aria-hidden="true"
              >
                {itemCount > 99
                  ? '99+'
                  : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated && (
            <div className="account-menu-wrap relative isolate">
              <button
                ref={accountTriggerRef}
                type="button"
                className="icon-btn account-trigger relative inline-flex h-[38px] w-[38px] min-w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-transparent text-text transition-colors duration-150 hover:bg-white/5 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[768px]:h-11 max-[768px]:w-11 max-[768px]:min-w-11 max-[375px]:h-[42px] max-[375px]:w-[42px] max-[375px]:min-w-[42px]"
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
                  className="account-menu absolute right-0 top-[calc(100%+10px)] z-[300] max-h-[min(70vh,520px)] w-[min(290px,calc(100vw-24px))] min-w-[230px] max-w-[min(320px,calc(100vw-24px))] overflow-x-hidden overflow-y-auto rounded-[14px] border border-line bg-surface p-2.5 text-text shadow-[0_18px_50px_rgba(0,0,0,.35)] max-[760px]:fixed max-[760px]:top-[calc(68px+8px)] max-[760px]:right-3"
                  role="menu"
                  aria-label="Account menu"
                >
                  <div
                    className="menu-user mb-1 flex min-w-0 max-w-full flex-col gap-0.5 border-b border-line px-2.5 pb-3 pt-2.5 [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-xs [&_span]:text-dim"
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
            className="menu-button relative z-[201] inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface p-0 text-text transition-colors duration-150 hover:border-[rgb(216_173_106_/_0.38)] hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[375px]:h-[42px] max-[375px]:w-[42px] max-[375px]:min-w-[42px]"
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
        className={`mobile-menu-backdrop fixed inset-0 z-[110] bg-black/60 transition-opacity duration-200 motion-reduce:transition-none ${mobileOpen ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'}`}
        aria-hidden="true"
        onClick={closeAll}
      />

      <aside
        ref={mobileNavRef}
        id="mobile-navigation"
        className={`mobile-nav fixed inset-y-0 left-0 z-[120] flex h-dvh w-[min(360px,88vw)] max-w-[360px] flex-col overflow-hidden rounded-r-[20px] border-r border-line bg-surface shadow-[20px_0_70px_rgba(0,0,0,.48)] transition-transform duration-200 ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none max-[640px]:w-[min(340px,90vw)] max-[900px]:-translate-x-full min-[901px]:bottom-0 min-[901px]:left-auto min-[901px]:right-0 min-[901px]:top-[72px] min-[901px]:h-[calc(100dvh-72px)] min-[901px]:w-[min(380px,92vw)] min-[901px]:rounded-l-[18px] min-[901px]:rounded-r-none min-[901px]:border-l min-[901px]:border-r-0 min-[901px]:shadow-[-20px_0_70px_rgba(0,0,0,.48)] min-[1100px]:w-[min(360px,42vw)] ${mobileOpen ? 'pointer-events-auto visible translate-x-0' : 'pointer-events-none invisible max-[900px]:-translate-x-full min-[901px]:translate-x-full'}`}
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-nav-head absolute left-0 right-0 top-0 z-[3] flex h-14 min-w-0 items-center justify-between border-b border-line bg-surface px-3.5 py-2 max-[900px]:h-14 min-[901px]:static min-[901px]:h-[58px] min-[901px]:shrink-0 min-[901px]:border-b min-[901px]:px-[18px]">
          <Link
            className="mobile-nav-brand min-w-0 overflow-hidden whitespace-nowrap font-display text-[22px] leading-none text-gold min-[901px]:text-[28px]"
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
            className="mobile-nav-close absolute right-3 top-3 z-[121] inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-[10px] border border-line bg-bg p-0 text-text shadow-[0_8px_24px_rgba(0,0,0,.22)] transition-colors hover:border-[rgb(216_173_106_/_0.35)] hover:bg-surface-2 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold max-[900px]:top-3 max-[900px]:right-3 min-[901px]:static min-[901px]:h-[38px] min-[901px]:w-[38px] min-[901px]:min-w-[38px] min-[901px]:min-h-[38px]"
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

        <div className="mobile-nav-inner min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-6 pt-[68px] [scrollbar-gutter:stable] max-[640px]:px-4 max-[640px]:pb-5 max-[640px]:pt-[66px] min-[901px]:px-[18px] min-[901px]:pb-6 min-[901px]:pt-[18px]">
          {mobileContent}
        </div>
      </aside>
    </header>
  );
}