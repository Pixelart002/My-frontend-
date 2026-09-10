import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RiDashboardLine, RiPriceTag3Line, RiFolder2Line, RiShoppingCart2Line, RiGroupLine, RiCoupon3Line, RiLogoutBoxRLine, RiShieldStarLine, RiStackLine, RiTruckLine, RiVipCrownLine, RiUserSettingsLine, RiShieldKeyholeLine, RiNotification3Line, RiSettings3Line, RiBankCardLine, RiBarChart2Line, RiFileList3Line } from '@remixicon/react';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardPanel from './DashboardPanel';
import ProductsPanel from './ProductsPanel';
import CategoriesPanel from './CategoriesPanel';
import OrdersPanel from './OrdersPanel';
import UsersPanel from './UsersPanel';
import CouponsPanel from './CouponsPanel';
import OperationsPanel from './OperationsPanel';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { key: 'products', label: 'Products', icon: RiPriceTag3Line },
  { key: 'categories', label: 'Categories', icon: RiFolder2Line },
  { key: 'orders', label: 'Orders', icon: RiShoppingCart2Line },
  { key: 'coupons', label: 'Coupons', icon: RiCoupon3Line },
  { key: 'inventory', label: 'Inventory', icon: RiStackLine },
  { key: 'shipping', label: 'Shipping', icon: RiTruckLine },
  { key: 'subscriptions', label: 'Subscriptions', icon: RiVipCrownLine },
  { key: 'users', label: 'Users', icon: RiGroupLine },
  { key: 'user-actions', label: 'User Actions', icon: RiUserSettingsLine },
  { key: 'rbac', label: 'Roles & Permissions', icon: RiShieldKeyholeLine },
  { key: 'notifications', label: 'Notifications', icon: RiNotification3Line },
  { key: 'settings', label: 'Settings', icon: RiSettings3Line },
  { key: 'payments', label: 'Payments', icon: RiBankCardLine },
  { key: 'reports', label: 'Reports', icon: RiBarChart2Line },
  { key: 'audit', label: 'Audit Logs', icon: RiFileList3Line },
];
const VALID_PANELS = new Set(NAV.map((item) => item.key));

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPanel = searchParams.get('panel');
  const createCoupon = searchParams.get('create') === '1';
  const initialPanel = VALID_PANELS.has(requestedPanel) ? requestedPanel : 'dashboard';
  const [status, setStatus] = useState('verifying');
  const [profile, setProfile] = useState(null);
  const [panel, setPanel] = useState(initialPanel);

  useEffect(() => { setPanel(VALID_PANELS.has(requestedPanel) ? requestedPanel : 'dashboard'); }, [requestedPanel]);
  const selectPanel = (nextPanel) => { if (!VALID_PANELS.has(nextPanel)) return; setPanel(nextPanel); setSearchParams({ panel: nextPanel }); };
  useEffect(() => {
    let active = true;
    adminService.verify().then((res) => { if (!active) return; setProfile(res?.profile || null); setStatus('verified'); }).catch((err) => { if (!active) return; setStatus('denied'); console.warn('Admin gate:', err.message); });
    return () => { active = false; };
  }, []);

  if (status === 'verifying') return <div className="page container"><div className="state spinner"><span className="spin">●</span><span>Verifying admin access…</span></div></div>;
  if (status === 'denied') return <div className="page container"><div className="admin-gate"><RiShieldStarLine size={40} /><h1>Admin access required</h1><p>Only administrators can open the store console. If you manage Luviio, make sure you're signed in with an account that has an admin role.</p><div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}><Link className="btn" to="/">Back to home</Link><Link className="btn btn-quiet" to="/account">Your profile</Link></div></div></div>;

  const active = NAV.find((n) => n.key === panel) || NAV[0];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sb-label">Overview</div><SideBtn nav={NAV[0]} active={panel} onClick={() => selectPanel('dashboard')} />
        <div className="admin-sb-label">Catalogue</div>{['products','categories'].map((key) => { const n = NAV.find(x => x.key === key); return <SideBtn key={n.key} nav={n} active={panel} onClick={() => selectPanel(n.key)} />; })}
        <div className="admin-sb-label">Commerce</div>{['orders','coupons','inventory','shipping','subscriptions','payments'].map((key) => { const n = NAV.find(x => x.key === key); return <SideBtn key={n.key} nav={n} active={panel} onClick={() => selectPanel(n.key)} />; })}
        <div className="admin-sb-label">Customers</div>{['users','user-actions'].map((key) => { const n = NAV.find(x => x.key === key); return <SideBtn key={n.key} nav={n} active={panel} onClick={() => selectPanel(n.key)} />; })}
        <div className="admin-sb-label">Operations</div>{['rbac','notifications','reports','audit','settings'].map((key) => { const n = NAV.find(x => x.key === key); return <SideBtn key={n.key} nav={n} active={panel} onClick={() => selectPanel(n.key)} />; })}
        <div className="admin-account"><div className="admin-account-name">{profile?.full_name || user?.full_name || 'Admin'}</div><div className="admin-account-email">{profile?.email || user?.email}</div><div className="admin-account-role">{profile?.role || user?.role}</div><button type="button" onClick={async () => { await logout(); toast.success('Signed out.'); navigate('/'); }} className="admin-signout"><RiLogoutBoxRLine size={15} /> Sign out</button></div>
      </aside>
      <main className="admin-main">
        <div className="admin-head"><div><h1>{active.label}</h1><p className="admin-sub">Luviio store administration</p></div></div>
        <nav className="admin-mobile-nav" aria-label="Admin sections">{NAV.map((n) => <SideBtn key={n.key} nav={n} active={panel} onClick={() => selectPanel(n.key)} />)}</nav>
        {panel === 'dashboard' && <DashboardPanel onNavigate={selectPanel} />}
        {panel === 'products' && <ProductsPanel />}
        {panel === 'categories' && <CategoriesPanel />}
        {panel === 'orders' && <OrdersPanel />}
        {panel === 'coupons' && <CouponsPanel autoOpenCreate={createCoupon} />}
        {panel === 'users' && <UsersPanel />}
        {['inventory','shipping','subscriptions','user-actions','rbac','notifications','settings','payments','reports','audit'].includes(panel) && <OperationsPanel section={panel} />}
      </main>
    </div>
  );
}
function SideBtn({ nav, active, onClick }) { const Icon = nav.icon; return <button type="button" className={`admin-sb-btn ${active === nav.key ? 'is-active' : ''}`} onClick={onClick}><Icon size={18} /> {nav.label}</button>; }
