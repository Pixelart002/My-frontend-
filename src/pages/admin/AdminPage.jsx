import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RiDashboardLine, RiPriceTag3Line, RiFolder2Line, RiShoppingCart2Line, RiGroupLine, RiCoupon3Line, RiLogoutBoxRLine, RiShieldStarLine, RiStackLine, RiTruckLine, RiVipCrownLine, RiUserSettingsLine, RiShieldKeyholeLine, RiNotification3Line, RiSettings3Line, RiBankCardLine, RiBarChart2Line, RiFileList3Line, RiStarLine, RiMenuLine, RiCloseLine, RiBuilding4Line } from '@remixicon/react';
import { adminService } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
const DashboardPanel = lazy(() => import('./DashboardPanel'));
const ProductsPanel = lazy(() => import('./ProductsPanel'));
const CategoriesPanel = lazy(() => import('./CategoriesPanel'));
const OrdersPanel = lazy(() => import('./OrdersPanel'));
const UsersPanel = lazy(() => import('./UsersPanel'));
const CouponsPanel = lazy(() => import('./CouponsPanel'));
const OperationsPanel = lazy(() => import('./OperationsPanel'));
const InventoryManagementPanel = lazy(() => import('./InventoryManagementPanel'));
const PaymentsPanel = lazy(() => import('./PaymentsPanel'));
const AuditLogsPanel = lazy(() => import('./AuditLogsPanel'));
const BusinessProfilePanel = lazy(() => import('./BusinessProfilePanel'));
const FulfillmentPanel = lazy(() => import('./FulfillmentPanel'));

function AdminPanelFallback(){return <div className="state spinner" role="status" aria-live="polite"><span className="spin">●</span><span>Loading admin panel…</span></div>;}
import AdminMfaGate from './AdminMfaGate';
import { classifyAdminAccessError } from './adminAccess';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const NAV=[{key:'dashboard',label:'Dashboard',icon:RiDashboardLine},{key:'products',label:'Products',icon:RiPriceTag3Line},{key:'categories',label:'Categories',icon:RiFolder2Line},{key:'orders',label:'Orders',icon:RiShoppingCart2Line},{key:'coupons',label:'Coupons',icon:RiCoupon3Line},{key:'inventory',label:'Inventory',icon:RiStackLine},{key:'shipping',label:'Shipping',icon:RiTruckLine},{key:'fulfillment',label:'Fulfillment',icon:RiTruckLine},{key:'subscriptions',label:'Subscriptions',icon:RiVipCrownLine},{key:'users',label:'Users',icon:RiGroupLine},{key:'user-actions',label:'User Actions',icon:RiUserSettingsLine},{key:'reviews',label:'Reviews',icon:RiStarLine},{key:'rbac',label:'Roles & Permissions',icon:RiShieldKeyholeLine},{key:'notifications',label:'Notifications',icon:RiNotification3Line},{key:'settings',label:'Settings',icon:RiSettings3Line},{key:'business-profile',label:'Business Profile',icon:RiBuilding4Line},{key:'payments',label:'Payments',icon:RiBankCardLine},{key:'reports',label:'Reports',icon:RiBarChart2Line},{key:'audit',label:'Audit Logs',icon:RiFileList3Line}];

const ROLE_PANELS={
 super_admin:NAV.map(n=>n.key),
 admin:NAV.map(n=>n.key),
 manager:['dashboard','products','categories','orders','coupons','inventory','shipping','fulfillment','subscriptions','users','reviews','payments','reports','audit'],
 support:['orders','users','products','coupons','shipping','fulfillment','subscriptions'],
 customer:[]
};

const CAPABILITIES={
 super_admin:{productCreate:true,productUpdate:true,productDelete:true,categoryCreate:true,categoryDelete:true,orderUpdate:true,orderCancel:true,couponCreate:true,couponUpdate:true,couponDelete:true,userUpdate:true,userDelete:true,shippingWrite:true,fulfillmentWrite:true,subscriptionWrite:true,inventoryScan:true},
 admin:{productCreate:true,productUpdate:true,productDelete:true,categoryCreate:true,categoryDelete:true,orderUpdate:true,orderCancel:true,couponCreate:true,couponUpdate:true,couponDelete:true,userUpdate:true,userDelete:true,shippingWrite:true,subscriptionWrite:true,inventoryScan:true},
 manager:{productCreate:true,productUpdate:true,productDelete:false,categoryCreate:true,categoryDelete:false,orderUpdate:true,orderCancel:true,couponCreate:true,couponUpdate:true,couponDelete:false,userUpdate:false,userDelete:false,shippingWrite:true,subscriptionWrite:false,inventoryScan:true},
 support:{productCreate:false,productUpdate:false,productDelete:false,categoryCreate:false,categoryDelete:false,orderUpdate:true,orderCancel:false,couponCreate:false,couponUpdate:false,couponDelete:false,userUpdate:false,userDelete:false,shippingWrite:false,subscriptionWrite:false,inventoryScan:false},
 customer:{}
};

export default function AdminPage(){
 const {user,logout}=useAuth();const {toast}=useToast();const navigate=useNavigate();const [searchParams,setSearchParams]=useSearchParams();const requestedPanel=searchParams.get('panel');const isFulfillmentRoute=window.location.pathname==='/admin/fulfillment';const createCoupon=searchParams.get('create')==='1';const [status,setStatus]=useState('verifying');const [profile,setProfile]=useState(null);const [panel,setPanel]=useState(isFulfillmentRoute?'fulfillment':(ROLE_PANELS[user?.role]?.includes(requestedPanel)?requestedPanel:(requestedPanel&&requestedPanel!=='dashboard'?requestedPanel:'dashboard')));const [drawerOpen,setDrawerOpen]=useState(false);
 const drawerRef=useRef(null);const drawerCloseRef=useRef(null);const role=profile?.role||user?.role;const allowed=ROLE_PANELS[role]||[];const capabilities=CAPABILITIES[role]||{};const effectivePanel=allowed.includes(panel)?panel:(allowed[0]||'dashboard');
 const verifyAdmin=async()=>{const res=await adminService.verify();setProfile(res?.profile||null);setStatus('verified');return res};
 useEffect(()=>{let active=true;adminService.verify().then(res=>{if(!active)return;setProfile(res?.profile||null);setStatus('verified')}).catch(err=>{if(!active)return;const next=classifyAdminAccessError(err);if(next==='mfa-required'){setStatus('mfa-required');return}if(next==='auth-required'){setStatus('auth-required');return}setStatus('denied');console.warn('Admin gate:',err.message)});return()=>{active=false}},[]);
 useEffect(()=>{if(status==='verified'&&effectivePanel!==panel){setPanel(effectivePanel);setSearchParams({panel:effectivePanel})}},[status,effectivePanel,panel,setSearchParams]);
 useEffect(()=>{if(!drawerOpen)return undefined;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>document.body.style.overflow=previous},[drawerOpen]);
 useFocusTrap({enabled:drawerOpen,containerRef:drawerRef,initialFocusRef:drawerCloseRef,onEscape:()=>setDrawerOpen(false)});
 const selectPanel=next=>{if(!allowed.includes(next))return;if(next==='fulfillment'){navigate('/admin/fulfillment');setPanel(next);setDrawerOpen(false);return;}navigate('/admin');setPanel(next);setSearchParams({panel:next});setDrawerOpen(false)};
 if(status==='verifying')return <div className="page container"><div className="state spinner"><span className="spin">●</span><span>Verifying admin access…</span></div></div>;
 if(status==='mfa-required')return <div className="page container"><AdminMfaGate role={user?.role} onVerified={verifyAdmin}/></div>;
 if(status==='auth-required')return <div className="page container"><div className="admin-gate"><RiShieldStarLine size={40}/><h1>Session expired</h1><p>Please sign in again to continue to the admin console.</p><div className="btn-row" style={{justifyContent:'center',marginTop:24}}><Link className="btn" to="/login" state={{from:"/admin"}}>Sign in</Link><Link className="btn btn-quiet" to="/">Back to home</Link></div></div></div>;
 if(status==='denied')return <div className="page container"><div className="admin-gate"><RiShieldStarLine size={40}/><h1>Admin access required</h1><p>Your account is authenticated, but its role does not have console access.</p><div className="btn-row" style={{justifyContent:'center',marginTop:24}}><Link className="btn" to="/">Back to home</Link><Link className="btn btn-quiet" to="/account">Your profile</Link></div></div></div>;
 const active=NAV.find(n=>n.key===effectivePanel)||NAV[0];
 return <div className="admin-shell"><aside className="admin-sidebar"><AdminNavigation panel={effectivePanel} allowed={allowed} onSelect={selectPanel} profile={profile} user={user} onLogout={async()=>{await logout();toast.success('Signed out.');navigate('/')}}/></aside>{drawerOpen&&<button type="button" className="admin-drawer-backdrop" aria-label="Close admin menu" onClick={()=>setDrawerOpen(false)}/>}<aside ref={drawerRef} className={`admin-drawer ${drawerOpen?'is-open':''}`} aria-label="Admin menu" tabIndex={-1} aria-hidden={!drawerOpen}><div className="admin-drawer-head"><div><strong>Luviio</strong><span>Admin console</span></div><button ref={drawerCloseRef} type="button" className="icon-btn" aria-label="Close menu" onClick={()=>setDrawerOpen(false)}><RiCloseLine size={20}/></button></div><div className="admin-drawer-scroll"><AdminNavigation panel={effectivePanel} allowed={allowed} onSelect={selectPanel} profile={profile} user={user} onLogout={async()=>{await logout();toast.success('Signed out.');navigate('/')}}/></div></aside><main className="admin-main"><div className="admin-head"><div className="admin-head-title"><button type="button" className="admin-menu-trigger" aria-label="Open admin menu" aria-expanded={drawerOpen} onClick={()=>setDrawerOpen(true)}><RiMenuLine size={20}/></button><div><h1>{active.label}</h1><p className="admin-sub">Luviio store administration · {role}</p></div></div></div><Suspense fallback={<AdminPanelFallback />}>{effectivePanel==='dashboard'&&<DashboardPanel onNavigate={selectPanel}/>} {effectivePanel==='products'&&<ProductsPanel capabilities={capabilities}/>} {effectivePanel==='categories'&&<CategoriesPanel capabilities={capabilities}/>} {effectivePanel==='orders'&&<OrdersPanel capabilities={capabilities}/>} {effectivePanel==='coupons'&&<CouponsPanel capabilities={capabilities} autoOpenCreate={createCoupon}/>} {effectivePanel==='users'&&<UsersPanel capabilities={capabilities}/>} {effectivePanel==='inventory'&&<InventoryManagementPanel/>} {effectivePanel==='payments'&&<PaymentsPanel/>} {effectivePanel==='audit'&&<AuditLogsPanel/>} {effectivePanel==='business-profile'&&<BusinessProfilePanel/>} {effectivePanel==='fulfillment'&&<FulfillmentPanel/>} {['shipping','subscriptions','user-actions','reviews','rbac','notifications','settings','reports'].includes(effectivePanel)&&<OperationsPanel section={effectivePanel} capabilities={capabilities}/>}</Suspense></main></div>;
}

function AdminNavigation({panel,allowed,profile,user,onSelect,onLogout}){return <>{[['Overview',['dashboard']],['Catalogue',['products','categories']],['Commerce',['orders','coupons','inventory','shipping','fulfillment','subscriptions','payments']],['Customers',['users','user-actions','reviews']],['Business',['business-profile']],['Operations',['rbac','notifications','reports','audit','settings']]].map(([label,keys])=>{const visible=keys.filter(k=>allowed.includes(k));if(!visible.length)return null;return <div key={label} className="admin-nav-group"><div className="admin-sb-label">{label}</div>{visible.map(key=>{const nav=NAV.find(item=>item.key===key);return <SideBtn key={key} nav={nav} active={panel} onClick={()=>onSelect(key)}/>})}</div>})}<div className="admin-account"><div className="admin-account-name">{profile?.full_name||user?.full_name||'Staff'}</div><div className="admin-account-email">{profile?.email||user?.email}</div><div className="admin-account-role">{profile?.role||user?.role}</div><button type="button" onClick={onLogout} className="admin-signout"><RiLogoutBoxRLine size={15}/> Sign out</button></div></>}
function SideBtn({nav,active,onClick}){const Icon=nav.icon;return <button type="button" className={`admin-sb-btn ${active===nav.key?'is-active':''}`} onClick={onClick}><Icon size={18}/><span>{nav.label}</span></button>}
