import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  RiBankCardLine,
  RiBarChart2Line,
  RiBuilding4Line,
  RiCloseLine,
  RiCoupon3Line,
  RiDashboardLine,
  RiFileList3Line,
  RiFolder2Line,
  RiGroupLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiNotification3Line,
  RiPriceTag3Line,
  RiShoppingCart2Line,
  RiShieldKeyholeLine,
  RiShieldStarLine,
  RiSettings3Line,
  RiStackLine,
  RiStarLine,
  RiTruckLine,
  RiUserSettingsLine,
  RiVipCrownLine,
} from '@remixicon/react';

import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

import AdminMfaGate from './AdminMfaGate';
import { classifyAdminAccessError } from './adminAccess';

const DashboardPanel = lazy(
  () => import('./DashboardPanel'),
);

const ProductsPanel = lazy(
  () => import('./ProductsPanel'),
);

const CategoriesPanel = lazy(
  () => import('./CategoriesPanel'),
);

const OrdersPanel = lazy(
  () => import('./OrdersPanel'),
);

const UsersPanel = lazy(
  () => import('./UsersPanel'),
);

const CouponsPanel = lazy(
  () => import('./CouponsPanel'),
);

const OperationsPanel = lazy(
  () => import('./OperationsPanel'),
);

const InventoryManagementPanel = lazy(
  () => import('./InventoryManagementPanel'),
);

const PaymentsPanel = lazy(
  () => import('./PaymentsPanel'),
);

const AuditLogsPanel = lazy(
  () => import('./AuditLogsPanel'),
);

const BusinessProfilePanel = lazy(
  () => import('./BusinessProfilePanel'),
);

const FulfillmentPanel = lazy(
  () => import('./FulfillmentPanel'),
);

const StripeConfigPanel = lazy(
  () => import('./StripeConfigPanel'),
);

const NAV = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: RiDashboardLine,
  },
  {
    key: 'products',
    label: 'Products',
    icon: RiPriceTag3Line,
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: RiFolder2Line,
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: RiShoppingCart2Line,
  },
  {
    key: 'coupons',
    label: 'Coupons',
    icon: RiCoupon3Line,
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: RiStackLine,
  },
  {
    key: 'shipping',
    label: 'Shipping',
    icon: RiTruckLine,
  },
  {
    key: 'fulfillment',
    label: 'Fulfillment',
    icon: RiTruckLine,
  },
  {
    key: 'subscriptions',
    label: 'Subscriptions',
    icon: RiVipCrownLine,
  },
  {
    key: 'users',
    label: 'Users',
    icon: RiGroupLine,
  },
  {
    key: 'user-actions',
    label: 'User Actions',
    icon: RiUserSettingsLine,
  },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: RiStarLine,
  },
  {
    key: 'rbac',
    label: 'Roles & Permissions',
    icon: RiShieldKeyholeLine,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: RiNotification3Line,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: RiSettings3Line,
  },
  {
    key: 'business-profile',
    label: 'Business Profile',
    icon: RiBuilding4Line,
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: RiBankCardLine,
  },
  {
    key: 'stripe',
    label: 'Stripe Configuration',
    icon: RiBankCardLine,
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: RiBarChart2Line,
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    icon: RiFileList3Line,
  },
];

const NAV_BY_KEY = new Map(
  NAV.map((item) => [item.key, item]),
);

const ROLE_PANELS = {
  super_admin: NAV.map((item) => item.key),

  admin: NAV.map((item) => item.key),

  manager: [
    'dashboard',
    'products',
    'categories',
    'orders',
    'coupons',
    'inventory',
    'shipping',
    'fulfillment',
    'subscriptions',
    'users',
    'reviews',
    'payments',
    'reports',
    'audit',
  ],

  support: [
    'orders',
    'users',
    'products',
    'coupons',
    'shipping',
    'fulfillment',
    'subscriptions',
  ],

  customer: [],
};

const CAPABILITIES = {
  super_admin: {
    productCreate: true,
    productUpdate: true,
    productDelete: true,
    categoryCreate: true,
    categoryDelete: true,
    orderUpdate: true,
    orderCancel: true,
    couponCreate: true,
    couponUpdate: true,
    couponDelete: true,
    userUpdate: true,
    userDelete: true,
    shippingWrite: true,
    fulfillmentWrite: true,
    subscriptionWrite: true,
    inventoryScan: true,
  },

  admin: {
    productCreate: true,
    productUpdate: true,
    productDelete: true,
    categoryCreate: true,
    categoryDelete: true,
    orderUpdate: true,
    orderCancel: true,
    couponCreate: true,
    couponUpdate: true,
    couponDelete: true,
    userUpdate: true,
    userDelete: true,
    shippingWrite: true,
    subscriptionWrite: true,
    inventoryScan: true,
  },

  manager: {
    productCreate: true,
    productUpdate: true,
    productDelete: false,
    categoryCreate: true,
    categoryDelete: false,
    orderUpdate: true,
    orderCancel: true,
    couponCreate: true,
    couponUpdate: true,
    couponDelete: false,
    userUpdate: false,
    userDelete: false,
    shippingWrite: true,
    subscriptionWrite: false,
    inventoryScan: true,
  },

  support: {
    productCreate: false,
    productUpdate: false,
    productDelete: false,
    categoryCreate: false,
    categoryDelete: false,
    orderUpdate: true,
    orderCancel: false,
    couponCreate: false,
    couponUpdate: false,
    couponDelete: false,
    userUpdate: false,
    userDelete: false,
    shippingWrite: false,
    subscriptionWrite: false,
    inventoryScan: false,
  },

  customer: {},
};

const NAV_GROUPS = [
  ['Overview', ['dashboard']],

  [
    'Catalogue',
    ['products', 'categories'],
  ],

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
      'stripe',
    ],
  ],

  [
    'Customers',
    ['users', 'user-actions', 'reviews'],
  ],

  [
    'Business',
    ['business-profile'],
  ],

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

function AdminPanelFallback() {
  return (
    <div
      className="admin-panel-fallback"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="spin"
        aria-hidden="true"
      />
      <span>
        Loading admin panel…
      </span>
    </div>
  );
}

function AdminGate({
  title,
  message,
  children,
}) {
  return (
    <main className="page container">
      <section
        className="admin-gate"
        aria-labelledby="admin-gate-title"
      >
        <RiShieldStarLine
          size={40}
          aria-hidden="true"
        />

        <h1 id="admin-gate-title">
          {title}
        </h1>

        <p>{message}</p>

        {children}
      </section>
    </main>
  );
}

function getInitialPanel({
  role,
  requestedPanel,
  isFulfillmentRoute,
}) {
  const allowed =
    ROLE_PANELS[role] || [];

  if (
    isFulfillmentRoute &&
    allowed.includes('fulfillment')
  ) {
    return 'fulfillment';
  }

  if (
    requestedPanel &&
    allowed.includes(requestedPanel)
  ) {
    return requestedPanel;
  }

  return allowed.includes('dashboard')
    ? 'dashboard'
    : allowed[0] || 'dashboard';
}

export default function AdminPage() {
  const {
    user,
    logout,
  } = useAuth();

  const { toast } =
    useToast();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedPanel =
    searchParams.get('panel');

  const createCoupon =
    searchParams.get('create') === '1';

  const isFulfillmentRoute =
    location.pathname ===
    '/admin/fulfillment';

  const role =
    user?.role || '';

  const [
    status,
    setStatus,
  ] = useState('verifying');

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    panel,
    setPanel,
  ] = useState(() =>
    getInitialPanel({
      role,
      requestedPanel,
      isFulfillmentRoute,
    }),
  );

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const verifyRequestRef =
    useRef(0);

  const drawerRef =
    useRef(null);

  const drawerCloseRef =
    useRef(null);

  const currentRole =
    profile?.role || role;

  const allowed =
    ROLE_PANELS[currentRole] || [];

  const capabilities =
    CAPABILITIES[currentRole] || {};

  const effectivePanel =
    allowed.includes(panel)
      ? panel
      : allowed[0] || 'dashboard';

  const active =
    NAV_BY_KEY.get(
      effectivePanel,
    ) || NAV[0];

  const closeDrawer =
    useCallback(() => {
      setDrawerOpen(false);
    }, []);

  const verifyAdmin =
    useCallback(async () => {
      const requestId =
        ++verifyRequestRef.current;

      const response =
        await adminService.verify();

      if (
        requestId !==
        verifyRequestRef.current
      ) {
        return response;
      }

      setProfile(
        response?.profile || null,
      );

      setStatus('verified');

      return response;
    }, []);

  useEffect(() => {
    let activeRequest = true;

    const verify = async () => {
      const requestId =
        ++verifyRequestRef.current;

      try {
        const response =
          await adminService.verify();

        if (
          !activeRequest ||
          requestId !==
            verifyRequestRef.current
        ) {
          return;
        }

        setProfile(
          response?.profile || null,
        );

        setStatus('verified');
      } catch (error) {
        if (
          !activeRequest ||
          requestId !==
            verifyRequestRef.current
        ) {
          return;
        }

        const next =
          classifyAdminAccessError(
            error,
          );

        if (
          next === 'mfa-required'
        ) {
          setStatus(
            'mfa-required',
          );
          return;
        }

        if (
          next === 'auth-required'
        ) {
          setStatus(
            'auth-required',
          );
          return;
        }

        setStatus('denied');

        console.warn(
          'Admin access verification failed:',
          error,
        );
      }
    };

    verify();

    return () => {
      activeRequest = false;
      verifyRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (
      status !== 'verified'
    ) {
      return;
    }

    if (
      effectivePanel === panel
    ) {
      return;
    }

    setPanel(
      effectivePanel,
    );

    const nextParams =
      new URLSearchParams(
        searchParams,
      );

    nextParams.set(
      'panel',
      effectivePanel,
    );

    setSearchParams(
      nextParams,
      { replace: true },
    );
  }, [
    effectivePanel,
    panel,
    searchParams,
    setSearchParams,
    status,
  ]);

  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }

    const handleRouteKey =
      (event) => {
        if (
          event.key === 'Escape'
        ) {
          closeDrawer();
        }
      };

    window.addEventListener(
      'keydown',
      handleRouteKey,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleRouteKey,
      );
    };
  }, [closeDrawer, drawerOpen]);

  useFocusTrap({
    enabled: drawerOpen,
    containerRef: drawerRef,
    initialFocusRef:
      drawerCloseRef,
    onEscape: closeDrawer,
  });

  const selectPanel =
    useCallback(
      (next) => {
        if (
          !allowed.includes(next)
        ) {
          return;
        }

        closeDrawer();

        if (
          next === 'fulfillment'
        ) {
          navigate(
            '/admin/fulfillment',
          );
          setPanel(next);
          return;
        }

        navigate('/admin');

        setPanel(next);

        const nextParams =
          new URLSearchParams();

        nextParams.set(
          'panel',
          next,
        );

        setSearchParams(
          nextParams,
          { replace: true },
        );
      },
      [
        allowed,
        closeDrawer,
        navigate,
        setSearchParams,
      ],
    );

  const handleLogout =
    useCallback(async () => {
      try {
        await logout();
        toast.success(
          'Signed out.',
        );
        navigate('/', {
          replace: true,
        });
      } catch (error) {
        toast.error(
          error?.message ||
            'Unable to sign out.',
        );
      }
    }, [
      logout,
      navigate,
      toast,
    ]);

  if (
    status === 'verifying'
  ) {
    return (
      <main className="page container">
        <div
          className="admin-access-loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span
            className="spin"
            aria-hidden="true"
          />
          <span>
            Verifying admin access…
          </span>
        </div>
      </main>
    );
  }

  if (
    status === 'mfa-required'
  ) {
    return (
      <main className="page container">
        <AdminMfaGate
          role={currentRole}
          onVerified={
            verifyAdmin
          }
        />
      </main>
    );
  }

  if (
    status === 'auth-required'
  ) {
    return (
      <AdminGate
        title="Session expired"
        message="Please sign in again to continue to the admin console."
      >
        <div className="admin-gate-actions">
          <Link
            className="btn"
            to="/login"
            state={{
              from:
                location.pathname +
                location.search,
            }}
          >
            Sign in
          </Link>

          <Link
            className="btn btn-quiet"
            to="/"
          >
            Back to home
          </Link>
        </div>
      </AdminGate>
    );
  }

  if (
    status === 'denied'
  ) {
    return (
      <AdminGate
        title="Admin access required"
        message="Your account is authenticated, but its role does not have console access."
      >
        <div className="admin-gate-actions">
          <Link
            className="btn"
            to="/"
          >
            Back to home
          </Link>

          <Link
            className="btn btn-quiet"
            to="/account"
          >
            Your profile
          </Link>
        </div>
      </AdminGate>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <AdminNavigation
          panel={effectivePanel}
          allowed={allowed}
          profile={profile}
          user={user}
          onSelect={selectPanel}
          onLogout={
            handleLogout
          }
        />
      </aside>

      {drawerOpen && (
        <button
          type="button"
          className="admin-drawer-backdrop"
          aria-label="Close admin menu"
          onClick={closeDrawer}
        />
      )}

      <aside
        ref={drawerRef}
        className={`admin-drawer ${
          drawerOpen
            ? 'is-open'
            : ''
        }`}
        aria-label="Admin menu"
        aria-hidden={
          !drawerOpen
        }
        inert={
          !drawerOpen
            ? true
            : undefined
        }
        tabIndex={-1}
      >
        <div className="admin-drawer-head">
          <div className="admin-drawer-brand">
            <strong>
              Luviio
            </strong>
            <span>
              Admin console
            </span>
          </div>

          <button
            ref={
              drawerCloseRef
            }
            type="button"
            className="icon-btn"
            aria-label="Close menu"
            onClick={
              closeDrawer
            }
          >
            <RiCloseLine
              size={20}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="admin-drawer-scroll">
          <AdminNavigation
            panel={effectivePanel}
            allowed={allowed}
            profile={profile}
            user={user}
            onSelect={
              selectPanel
            }
            onLogout={
              handleLogout
            }
          />
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-head">
          <div className="admin-head-title">
            <button
              type="button"
              className="admin-menu-trigger"
              aria-label="Open admin menu"
              aria-expanded={
                drawerOpen
              }
              onClick={() =>
                setDrawerOpen(true)
              }
            >
              <RiMenuLine
                size={20}
                aria-hidden="true"
              />
            </button>

            <div>
              <p className="admin-head-eyebrow">
                Luviio Admin
              </p>

              <h1>
                {active.label}
              </h1>

              <p className="admin-sub">
                Store administration
                {' · '}
                {currentRole ||
                  'Staff'}
              </p>
            </div>
          </div>
        </header>

        <section
          className="admin-content"
          aria-label={`${active.label} panel`}
        >
          <Suspense
            fallback={
              <AdminPanelFallback />
            }
          >
            {effectivePanel ===
              'dashboard' && (
              <DashboardPanel
                onNavigate={
                  selectPanel
                }
              />
            )}

            {effectivePanel ===
              'products' && (
              <ProductsPanel
                capabilities={
                  capabilities
                }
              />
            )}

            {effectivePanel ===
              'categories' && (
              <CategoriesPanel
                capabilities={
                  capabilities
                }
              />
            )}

            {effectivePanel ===
              'orders' && (
              <OrdersPanel
                capabilities={
                  capabilities
                }
              />
            )}

            {effectivePanel ===
              'coupons' && (
              <CouponsPanel
                capabilities={
                  capabilities
                }
                autoOpenCreate={
                  createCoupon
                }
              />
            )}

            {effectivePanel ===
              'users' && (
              <UsersPanel
                capabilities={
                  capabilities
                }
              />
            )}

            {effectivePanel ===
              'inventory' && (
              <InventoryManagementPanel />
            )}

            {effectivePanel ===
              'payments' && (
              <PaymentsPanel />
            )}

            {effectivePanel ===
              'audit' && (
              <AuditLogsPanel />
            )}

            {effectivePanel ===
              'business-profile' && (
              <BusinessProfilePanel />
            )}

            {effectivePanel ===
              'fulfillment' && (
              <FulfillmentPanel />
            )}

            {[
              'shipping',
              'subscriptions',
              'user-actions',
              'reviews',
              'rbac',
              'notifications',
              'settings',
              'reports',
            ].includes(
              effectivePanel,
            ) && (
              <OperationsPanel
                section={
                  effectivePanel
                }
                capabilities={
                  capabilities
                }
              />
            )}

            {effectivePanel ===
              'stripe' && (
              <StripeConfigPanel />
            )}
          </Suspense>
        </section>
      </main>
    </div>
  );
}

function AdminNavigation({
  panel,
  allowed,
  profile,
  user,
  onSelect,
  onLogout,
}) {
  return (
    <nav
      className="admin-navigation"
      aria-label="Admin navigation"
    >
      <div className="admin-nav-groups">
        {NAV_GROUPS.map(
          ([label, keys]) => {
            const visible =
              keys.filter((key) =>
                allowed.includes(key),
              );

            if (!visible.length) {
              return null;
            }

            return (
              <div
                key={label}
                className="admin-nav-group"
              >
                <div className="admin-sb-label">
                  {label}
                </div>

                <div className="admin-nav-items">
                  {visible.map(
                    (key) => {
                      const nav =
                        NAV_BY_KEY.get(
                          key,
                        );

                      if (!nav) {
                        return null;
                      }

                      return (
                        <SideBtn
                          key={key}
                          nav={nav}
                          active={panel}
                          onClick={() =>
                            onSelect(
                              key,
                            )
                          }
                        />
                      );
                    },
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="admin-account">
        <div className="admin-account-name">
          {profile?.full_name ||
            user?.full_name ||
            'Staff'}
        </div>

        <div className="admin-account-email">
          {profile?.email ||
            user?.email ||
            ''}
        </div>

        <div className="admin-account-role">
          {profile?.role ||
            user?.role ||
            'Staff'}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="admin-signout"
        >
          <RiLogoutBoxRLine
            size={15}
            aria-hidden="true"
          />
          <span>
            Sign out
          </span>
        </button>
      </div>
    </nav>
  );
}

function SideBtn({
  nav,
  active,
  onClick,
}) {
  const Icon = nav.icon;
  const isActive =
    active === nav.key;

  return (
    <button
      type="button"
      className={`admin-sb-btn ${
        isActive
          ? 'is-active'
          : ''
      }`}
      onClick={onClick}
      aria-current={
        isActive
          ? 'page'
          : undefined
      }
    >
      <Icon
        size={18}
        aria-hidden="true"
      />

      <span>
        {nav.label}
      </span>
    </button>
  );
}