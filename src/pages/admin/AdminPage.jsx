import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine,
  RiPriceTag3Line,
  RiFolder2Line,
  RiShoppingCart2Line,
  RiGroupLine,
  RiLogoutBoxRLine,
  RiShieldStarLine,
} from '@remixicon/react';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardPanel from './DashboardPanel';
import ProductsPanel from './ProductsPanel';
import CategoriesPanel from './CategoriesPanel';
import OrdersPanel from './OrdersPanel';
import UsersPanel from './UsersPanel';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { key: 'products', label: 'Products', icon: RiPriceTag3Line },
  { key: 'categories', label: 'Categories', icon: RiFolder2Line },
  { key: 'orders', label: 'Orders', icon: RiShoppingCart2Line },
  { key: 'users', label: 'Users', icon: RiGroupLine },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | verified | denied
  const [profile, setProfile] = useState(null);
  const [panel, setPanel] = useState('dashboard');

  useEffect(() => {
    let active = true;
    adminService
      .verify()
      .then((res) => {
        if (!active) return;
        setProfile(res?.profile || null);
        setStatus('verified');
      })
      .catch((err) => {
        if (!active) return;
        // Non-200 (e.g. 403 permission denied) => not an admin.
        setStatus('denied');
        console.warn('Admin gate:', err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (status === 'verifying') {
    return (
      <div className="page container">
        <div className="state spinner"><span className="spin">●</span><span>Verifying admin access…</span></div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="page container">
        <div className="admin-gate">
          <RiShieldStarLine size={40} />
          <h1>Admin access required</h1>
          <p>
            Only administrators can open the store console. If you manage Luviio, make sure
            you're signed in with an account that has an admin role.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link className="btn" to="/">Back to home</Link>
            <Link className="btn btn-quiet" to="/account">Your profile</Link>
          </div>
        </div>
      </div>
    );
  }

  const active = NAV.find((n) => n.key === panel);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sb-label">Overview</div>
        {NAV.slice(0, 1).map((n) => (
          <SideBtn key={n.key} nav={n} active={panel} onClick={() => setPanel(n.key)} />
        ))}

        <div className="admin-sb-label">Catalogue</div>
        {NAV.slice(1, 3).map((n) => (
          <SideBtn key={n.key} nav={n} active={panel} onClick={() => setPanel(n.key)} />
        ))}

        <div className="admin-sb-label">Commerce</div>
        {NAV.slice(3).map((n) => (
          <SideBtn key={n.key} nav={n} active={panel} onClick={() => setPanel(n.key)} />
        ))}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--dim)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{profile?.full_name || user?.full_name || 'Admin'}</div>
          <div style={{ overflowWrap: 'anywhere' }}>{profile?.email || user?.email}</div>
          <div style={{ marginTop: 4, textTransform: 'capitalize' }}>{profile?.role || user?.role}</div>
          <button
            onClick={async () => { await logout(); toast.success('Signed out.'); navigate('/'); }}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', color: 'var(--muted)', padding: 0, fontSize: 13 }}
          >
            <RiLogoutBoxRLine size={15} /> Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-head">
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Store console</p>
            <h1>{active.label}</h1>
          </div>
        </div>
        {panel === 'dashboard' && <DashboardPanel onNavigate={setPanel} />}
        {panel === 'products' && <ProductsPanel />}
        {panel === 'categories' && <CategoriesPanel />}
        {panel === 'orders' && <OrdersPanel />}
        {panel === 'users' && <UsersPanel />}
      </main>
    </div>
  );
}

function SideBtn({ nav, active, onClick }) {
  const Icon = nav.icon;
  return (
    <button className={`admin-sb-btn ${active === nav.key ? 'is-active' : ''}`} onClick={onClick}>
      <Icon size={18} /> {nav.label}
    </button>
  );
}
