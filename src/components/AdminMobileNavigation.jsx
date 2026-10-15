import { Link } from 'react-router-dom';
import {
  RiArrowRightSLine, RiBankCardLine, RiBarChart2Line, RiBuilding4Line,
  RiCoupon3Line, RiDashboardLine, RiFileList3Line, RiFolder2Line,
  RiHomeLine, RiNotification3Line, RiPriceTag3Line, RiSettings3Line,
  RiShieldKeyholeLine, RiShoppingCart2Line, RiStackLine, RiTruckLine,
  RiUser3Line, RiUserSettingsLine, RiVipCrownLine, RiStarLine,
} from '@remixicon/react';

const NAV = [
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
  ['reviews', 'Reviews', RiStarLine],
  ['rbac', 'Roles & Permissions', RiShieldKeyholeLine],
  ['notifications', 'Notifications', RiNotification3Line],
  ['settings', 'Settings', RiSettings3Line],
  ['business-profile', 'Business Profile', RiBuilding4Line],
  ['payments', 'Payments', RiBankCardLine],
  ['reports', 'Reports', RiBarChart2Line],
  ['audit', 'Audit Logs', RiFileList3Line],
];

const GROUPS = [
  ['Overview', ['dashboard']],
  ['Catalogue', ['products', 'categories']],
  ['Commerce', ['orders', 'coupons', 'inventory', 'shipping', 'subscriptions', 'payments']],
  ['Customers', ['users', 'user-actions', 'reviews']],
  ['Business', ['business-profile']],
  ['Operations', ['rbac', 'notifications', 'reports', 'audit', 'settings']],
];

const ITEM_MAP = new Map(NAV.map(([key, label, Icon]) => [key, { key, label, Icon }]));

export default function AdminMobileNavigation({ activeAdminPanel, onNavigate }) {
  return (
    <>
      <div className="mobile-nav-section mobile-admin-nav flex min-w-0 flex-col gap-1" aria-label="Admin navigation">
        {GROUPS.map(([group, keys]) => {
          const groupId = `mobile-admin-${group.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <section
              key={group}
              className="mobile-admin-group flex min-w-0 flex-col gap-1 [&+&]:mt-2 [&+&]:border-t [&+&]:border-line [&+&]:pt-2"
              aria-labelledby={groupId}
            >
              <h2 id={groupId} className="mobile-admin-label px-2.5 pb-1 pt-0 text-[10px] font-bold uppercase tracking-[.14em] leading-[1.4] text-dim">
                {group}
              </h2>
              {keys.map((key) => {
                const item = ITEM_MAP.get(key);
                if (!item) return null;
                const Icon = item.Icon;
                const active = activeAdminPanel === key;
                return (
                  <Link
                    key={key}
                    to={`/admin?panel=${encodeURIComponent(key)}`}
                    onClick={onNavigate}
                    className={active ? 'is-active' : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                    <RiArrowRightSLine className="admin-menu-arrow" size={16} aria-hidden="true" />
                  </Link>
                );
              })}
            </section>
          );
        })}
      </div>
      <div className="mobile-nav-section mobile-account-actions mt-2 flex min-w-0 flex-col gap-1 border-t border-line pt-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="group flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-[14px] font-medium text-text transition-colors duration-150 hover:border-line hover:bg-surface-2 active:bg-surface-2 focus-visible:border-gold focus-visible:outline-none"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gold/10 text-gold">
            <RiHomeLine size={19} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate">View storefront</span>
          <RiArrowRightSLine className="shrink-0 text-dim" size={17} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
