import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiArrowDownSLine, RiRefreshLine } from '@remixicon/react';
import { adminService, itemsOfList } from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import { formatMoney } from '../../utils/format';
import '../../styles/admin-telemetry.css';

const PAGE_SIZE = 50;
const MAX_ALLOWED_PAYMENT_ATTEMPTS = 5;
const text = (value) => value === null || value === undefined || value === '' ? '—' : String(value);
const money = (value) => formatMoney(Number(value || 0));
const json = (value) => {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return '—';
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
};
function paymentState(value, method, orderStatus) {
  const status = String(value || 'unknown').toLowerCase();
  const pm = String(method || '').toLowerCase();
  const order = String(orderStatus || '').toLowerCase();
  if (pm === 'cod' && ['paid','processing','shipped','delivered'].includes(order)) return { key:'succeeded', label:'paid' };
  if (status === 'succeeded' || status === 'paid') return { key:'succeeded', label:status };
  if (status === 'expired') return { key:'expired', label:'expired' };
  if (['failed','canceled','cancelled'].includes(status)) return { key:'failed', label:status };
  return { key:'pending', label:status.replaceAll('_',' ') };
}
function attemptNumber(row) { const n=Number(row?.attempt_number); return Number.isInteger(n)&&n>=1?n:null; }
function maxAttempts(row) { const n=Number(row?.max_attempts); return Number.isInteger(n)&&n>0?n:MAX_ALLOWED_PAYMENT_ATTEMPTS; }
function pageData(response) { const data=response?.data&&typeof response.data==='object'?response.data:response; return {items:itemsOfList(data),hasMore:Boolean(data?.has_more),nextOffset:Number.isInteger(data?.next_offset)?data.next_offset:0}; }
function groupByOrder(rows) {
  const groups=new Map();
  rows.forEach(row=>{const key=String(row?.order_id||row?.order_number||row?.id||'unknown');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);});
  return [...groups.entries()].map(([key,events])=>({key,events:[...events].sort((a,b)=>(attemptNumber(a)??0)-(attemptNumber(b)??0)||new Date(a.created_at||0)-new Date(b.created_at||0))}));
}
function Detail({label,value,mono=false}) { return <div className="payment-detail"><span>{label}</span><strong className={mono?'payment-detail-mono':''}>{value}</strong></div>; }
function Attempt({row,index,total}) {
  const [open,setOpen]=useState(false);
  const state=paymentState(row.status,row.payment_method,row.order_status);
  const cls=state.key==='succeeded'?'pill-success':state.key==='failed'?'pill-danger':state.key==='expired'?'pill-warning':'pill-muted';
  const attempt=attemptNumber(row)??index+1;
  return <article className={`payment-attempt-card ${open?'is-open':''}`}>
    <button type="button" className="payment-attempt-toggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
      <span className="payment-attempt-number"><b>{index+1}.</b><span><strong>Attempt #{attempt}</strong><small>{text(row.payment_method).toUpperCase()} · {money(row.amount)}</small></span></span>
      <span className="payment-attempt-toggle-right"><span className={`admin-pill ${cls}`}>{state.label}</span><RiArrowDownSLine className={open?'rotated':''} size={20} aria-hidden="true" /></span>
    </button>
    {open && <div className="payment-attempt-body">
      <div className="payment-detail-grid">
        <Detail label="Amount" value={money(row.amount)} /><Detail label="Payment method" value={text(row.payment_method).toUpperCase()} />
        <Detail label="Attempt" value={`${attempt} / ${maxAttempts(row)}`} /><Detail label="Created" value={row.created_at?new Date(row.created_at).toLocaleString():'—'} />
        <Detail label="Updated" value={row.updated_at?new Date(row.updated_at).toLocaleString():'—'} /><Detail label="Error code" value={text(row.error_code)} mono />
      </div>
      <div className="payment-detail-block"><span>Stripe PaymentIntent</span><code>{text(row.stripe_payment_intent_id)}</code></div>
      {row.error_message&&<div className="payment-detail-block"><span>Error message</span><p>{text(row.error_message)}</p></div>}
      <div className="payment-detail-grid"><Detail label="Client IP" value={text(row.ip_address)} mono /><Detail label="User agent" value={text(row.user_agent)} mono /></div>
      <details className="payment-gateway-details"><summary>Gateway metadata</summary><pre>{json(row.gateway_metadata)}</pre></details>
    </div>}
  </article>;
}
function OrderCard({group}) {
  const [open,setOpen]=useState(false);
  const first=group.events[0]||{}; const latest=group.events[group.events.length-1]||first;
  const state=paymentState(latest.status,latest.payment_method,latest.order_status);
  const order=text(first.order_number||first.order_id);
  return <section className={`payment-order-card ${open?'is-open':''}`}>
    <button type="button" className="payment-order-toggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
      <span><small>ORDER INFORMATION</small><strong>{order}</strong><em>{group.events.length} attempt{group.events.length===1?'':'s'} · Limit {maxAttempts(first)} · {text(first.order_status)}</em></span>
      <span className="payment-order-right"><b>{money(first.total_amount??first.amount)}</b><i className={`admin-pill ${state.key==='succeeded'?'pill-success':state.key==='failed'?'pill-danger':'pill-muted'}`}>{state.label}</i><RiArrowDownSLine className={open?'rotated':''} size={21}/></span>
    </button>
    {open&&<div className="payment-attempt-list">{group.events.map((row,index)=><Attempt key={`${group.key}:${row.id||index}`} row={row} index={index} total={group.events.length}/>)}</div>}
  </section>;
}
export default function PaymentsPanel() {
  const {toast}=useToast(); const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [loadingMore,setLoadingMore]=useState(false); const [hasMore,setHasMore]=useState(true); const [offset,setOffset]=useState(0); const loadingMoreRef=useRef(false); const sentinelRef=useRef(null);
  const loadPage=useCallback(async(pageOffset=0,replace=false)=>{if(pageOffset>0&&loadingMoreRef.current)return;if(pageOffset>0){loadingMoreRef.current=true;setLoadingMore(true)}else setLoading(true);try{const result=pageData(await adminService.paymentsReport({limit:PAGE_SIZE,offset:pageOffset}));setRows(current=>replace||pageOffset===0?result.items:[...current,...result.items]);setHasMore(result.hasMore);setOffset(result.nextOffset)}catch(error){toast.error(error.message||'Unable to load payment report.')}finally{if(pageOffset>0){loadingMoreRef.current=false;setLoadingMore(false)}else setLoading(false)}},[toast]);
  const refresh=useCallback(()=>{setHasMore(true);setOffset(0);loadingMoreRef.current=false;return loadPage(0,true)},[loadPage]);
  useEffect(()=>{loadPage(0,true)},[loadPage]);
  useEffect(()=>{const sentinel=sentinelRef.current;if(!sentinel||!hasMore)return undefined;const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting&&!loading&&!loadingMoreRef.current)loadPage(offset)}, {rootMargin:'320px 0px'});observer.observe(sentinel);return()=>observer.disconnect()},[hasMore,loading,offset,loadPage]);
  const groups=useMemo(()=>groupByOrder(rows),[rows]);
  const summary=useMemo(()=>rows.reduce((a,row)=>{const s=paymentState(row.status,row.payment_method,row.order_status);a.events++;a.amount+=Number(row.amount||0);a[s.key]++;return a},{events:0,amount:0,succeeded:0,failed:0,pending:0}),[rows]);
  return <section className="admin-panel"><div className="admin-card admin-telemetry-card"><div className="admin-toolbar ops-toolbar"><div><h2>Payments</h2><p>Order-wise payment history. Expand an order to view its attempts, then expand an attempt for full telemetry.</p></div><button type="button" className="btn btn-quiet btn-sm" onClick={refresh} disabled={loading||loadingMore}><RiRefreshLine size={16}/>{loading?'Loading…':loadingMore?'Loading more…':'Refresh'}</button></div><div className="admin-stats"><div className="admin-stat"><div className="stat-label">Attempts</div><div className="stat-value">{loading?'…':summary.events}</div></div><div className="admin-stat"><div className="stat-label">Event value</div><div className="stat-value">{loading?'…':money(summary.amount)}</div></div><div className="admin-stat"><div className="stat-label">Succeeded</div><div className="stat-value">{loading?'…':summary.succeeded}</div></div><div className="admin-stat"><div className="stat-label">Failed</div><div className="stat-value">{loading?'…':summary.failed}</div></div></div></div><div className="payment-orders-list">{groups.length?groups.map(group=><OrderCard key={group.key} group={group}/>):<div className="admin-empty">{loading?'Loading payment activity…':'No payment records found.'}</div>}</div><div ref={sentinelRef} aria-hidden="true" style={{minHeight:1}} />{loadingMore&&<div className="admin-empty">Loading more payment records…</div>}{!hasMore&&rows.length>0&&<div className="admin-empty">All payment records loaded.</div>}</section>;
}
