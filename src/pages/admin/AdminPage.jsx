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

import { setAccessToken } from '../../api/client';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
    'shipping',
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
      className="admin-panel-fallback flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-6 text-sm text-muted"
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
    <main className="page container mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] py-12 max-[760px]:px-[18px] max-[760px]:py-8 max-[480px]:px-4">
      <section
        className="admin-gate mx-auto flex w-full max-w-[520px] flex-col items-center rounded-2xl border border-line bg-surface p-8 text-center shadow-luviio-card max-[560px]:p-5"
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
}) {
  const allowed =
    ROLE_PANELS[role] || [];

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
    initializing,
    isAuthenticated,
    token,
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

  const isLegacyFulfillmentRoute =
    location.pathname === '/admin/fulfillment';

  const createCoupon =
    searchParams.get('create') === '1';

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
    }),
  );

  const [
    sidebarExpanded,
    setSidebarExpanded,
  ] = useState(false);

  const verifyRequestRef =
    useRef(0);

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

  const toggleSidebar =
    useCallback(() => {
      setSidebarExpanded((value) => !value);
    }, []);

  const closeSidebar =
    useCallback(() => {
      setSidebarExpanded(false);
    }, []);

  useEffect(() => {
    if (!sidebarExpanded || typeof window === 'undefined') {
      return undefined;
    }

    if (!window.matchMedia('(max-width: 1100px)').matches) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarExpanded]);

  const verifyAdmin =
    useCallback(async (verifiedToken = token) => {
      if (initializing) {
        return null;
      }

      if (!isAuthenticated || !verifiedToken) {
        setStatus('auth-required');
        return null;
      }

      const requestId =
        ++verifyRequestRef.current;

      setAccessToken(verifiedToken);

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
    }, [
      initializing,
      isAuthenticated,
      token,
    ]);

  useEffect(() => {
    if (initializing) {
      setStatus('verifying');
      return undefined;
    }

    let activeRequest = true;

    const verify = async () => {
      const requestId =
        ++verifyRequestRef.current;

      if (!isAuthenticated || !token) {
        if (activeRequest) {
          setStatus('auth-required');
        }
        return;
      }

      try {
        setAccessToken(token);

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
  }, [
    initializing,
    isAuthenticated,
    token,
  ]);

  useEffect(() => {
    if (
      status === 'verified' &&
      isLegacyFulfillmentRoute
    ) {
      navigate('/admin?panel=orders', {
        replace: true,
      });
    }
  }, [
    isLegacyFulfillmentRoute,
    navigate,
    status,
  ]);

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

  const selectPanel =
    useCallback(
      (next) => {
        if (
          !allowed.includes(next)
        ) {
          return;
        }

        if (window.matchMedia('(max-width: 1100px)').matches) {
          closeSidebar();
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
        closeSidebar,
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
      <main className="page container mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] py-12 max-[760px]:px-[18px] max-[760px]:py-8 max-[480px]:px-4">
        <div
          className="admin-access-loading flex min-h-48 items-center justify-center gap-3 text-sm text-muted"
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
      <main className="page container mx-auto w-full max-w-[1440px] px-[clamp(16px,8vw,120px)] py-12 max-[760px]:px-[18px] max-[760px]:py-8 max-[480px]:px-4">
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
        <div className="admin-gate-actions mt-6 flex flex-wrap justify-center gap-2.5 max-[480px]:w-full max-[480px]:flex-col">
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
        <div className="admin-gate-actions mt-6 flex flex-wrap justify-center gap-2.5 max-[480px]:w-full max-[480px]:flex-col">
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
    <div className={`admin-shell admin-console-root${sidebarExpanded ? ' is-sidebar-expanded' : ''}`}>
      <aside
        className="admin-sidebar admin-console-sidebar"
        data-sidebar-state={sidebarExpanded ? 'expanded' : 'collapsed'}
        aria-label="Admin navigation"
        aria-expanded={sidebarExpanded}
      >
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-brand-main">
              <div className="admin-rail-mark" aria-hidden="true">L</div>
              <div className="admin-sidebar-brand-copy">
                <strong>Luviio</strong>
                <span>Admin console</span>
              </div>
            </div>

            <button
              type="button"
              className="admin-sidebar-close"
              onClick={closeSidebar}
              aria-label="Close admin navigation"
            >
              <RiCloseLine
                size={18}
                aria-hidden="true"
              />
            </button>
          </div>

          <AdminNavigation
            panel={effectivePanel}
            allowed={allowed}
            profile={profile}
            user={user}
            onSelect={selectPanel}
            onLogout={handleLogout}
            compact={!sidebarExpanded}
          />
        </div>
      </aside>

      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label="Close admin navigation"
        aria-hidden={!sidebarExpanded}
        tabIndex={sidebarExpanded ? 0 : -1}
        onClick={closeSidebar}
      />

      <main className="admin-main admin-console-main w-full min-w-0 max-w-none overflow-x-clip">
        <header className="admin-head flex w-full min-w-0">
          <div className="admin-head-brand flex min-w-0 flex-1">
            <button
              type="button"
              className="admin-menu-trigger"
              aria-label={sidebarExpanded ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
              aria-expanded={sidebarExpanded}
              onClick={toggleSidebar}
            >
              <RiMenuLine size={19} aria-hidden="true" />
            </button>

            <div className="admin-head-context min-w-0">
              <nav className="admin-breadcrumb min-w-0 max-w-full" aria-label="Breadcrumb">
                <span className="admin-breadcrumb-root">Luviio Admin</span>
                <span className="admin-breadcrumb-separator" aria-hidden="true">/</span>
                <span className="admin-breadcrumb-current">{active.label}</span>
              </nav>
              <span className="admin-head-caption" aria-hidden="true">Admin console</span>
            </div>
          </div>

          <div className="admin-head-meta">
            <span className="admin-live-status" aria-label="Admin console online">
              <span className="admin-live-dot" aria-hidden="true" />
              <span>Live</span>
            </span>
            <span className="admin-role-chip">{currentRole || 'Staff'}</span>
          </div>
        </header>

        <section
          className="w-full min-w-0 max-w-none overflow-x-clip"
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
  compact = false,
}) {
  const displayName =
    profile?.full_name ||
    user?.full_name ||
    'Staff';
  const displayEmail =
    profile?.email ||
    user?.email ||
    '';
  const role =
    profile?.role ||
    user?.role ||
    'Staff';
  const initials =
    displayName.trim().charAt(0).toUpperCase() || 'S';

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Admin navigation"
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-3 pt-2 [scrollbar-width:thin]"
      >
        <div className="space-y-5">
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
                <section
                  key={label}
                  className="min-w-0"
                  aria-label={label}
                >
                  <div
                    className={
                      compact
                        ? 'sr-only'
                        : 'mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35'
                    }
                  >
                    {label}
                  </div>

                  <div className="grid gap-1">
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
                            onClick={() => onSelect(key)}
                            compact={compact}
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              );
            },
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.07] bg-black/10 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-3">
        <div
          className={
            compact
              ? 'flex justify-center'
              : 'rounded-xl bg-white/[0.035] p-2.5'
          }
        >
          <div
            className={
              compact
                ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-bold text-white'
                : 'flex min-w-0 items-center gap-2.5'
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-xs font-bold text-white ring-1 ring-white/[0.08]">
              {initials}
            </div>

            {!compact && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-white/90">
                  {displayName}
                </div>
                <div className="truncate text-[10px] font-medium text-white/40">
                  {displayEmail}
                </div>
              </div>
            )}

            {!compact && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/90 ring-2 ring-emerald-400/10"
                title="Admin session active"
                aria-label="Admin session active"
              />
            )}
          </div>
        </div>

        {!compact && (
          <div className="mt-2 flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
              {role}
            </span>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-white/55 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8ad6a]/70"
            >
              <RiLogoutBoxRLine
                size={15}
                aria-hidden="true"
              />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function SideBtn({
  nav,
  active,
  onClick,
  compact = false,
}) {
  const Icon = nav.icon;
  const isActive =
    active === nav.key;

  return (
    <button
      type="button"
      className={
        `group relative inline-flex min-h-11 w-full items-center rounded-xl text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8ad6a]/70 ${compact ? 'justify-center px-0' : 'gap-3 px-3 text-[13px] font-medium'} ${isActive ? 'bg-[#d8ad6a]/[0.10] text-[#f0cf97]' : 'text-white/55 hover:bg-white/[0.055] hover:text-white/90'}`
      }
      onClick={onClick}
      aria-label={nav.label}
      title={compact ? nav.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <span
          className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-[#d8ad6a]"
          aria-hidden="true"
        />
      )}

      <Icon
        size={18}
        strokeWidth={isActive ? 2.2 : 1.8}
        className={
          isActive
            ? 'shrink-0 text-[#f0cf97]'
            : 'shrink-0 text-current opacity-75'
        }
        aria-hidden="true"
      />

      {!compact && (
        <span className="min-w-0 flex-1 truncate">
          {nav.label}
        </span>
      )}
    </button>
  );
}