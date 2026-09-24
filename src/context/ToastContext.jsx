import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  RiErrorWarningLine,
  RiCheckboxCircleFill,
  RiInformationLine,
  RiCloseLine,
} from '@remixicon/react';

const ToastContext = createContext(null);

const ICONS = {
  success: RiCheckboxCircleFill,
  error: RiErrorWarningLine,
  info: RiInformationLine,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, tone = 'info', duration = 4200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  // Support both common call styles used throughout the app:
  // const toast = useToast(); toast.success('...')
  // const { success } = useToast(); success('...')
  const toast = useMemo(() => {
    const notify = (message, tone = 'info', duration = 4200) => push(message, tone, duration);
    notify.success = (message, duration) => push(message, 'success', duration);
    notify.error = (message, duration) => push(message, 'error', duration);
    notify.info = (message, duration) => push(message, 'info', duration);
    notify.dismiss = dismiss;
    return notify;
  }, [push, dismiss]);

  const value = useMemo(
    () => ({
      toast,
      success: toast.success,
      error: toast.error,
      info: toast.info,
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-label="Notifications" style={{position:'fixed',zIndex:9999,top:'max(16px, env(safe-area-inset-top))',right:'max(16px, env(safe-area-inset-right))',width:'min(390px, calc(100vw - 32px))',display:'grid',gap:10,pointerEvents:'none'}}>
        {toasts.map((item) => {
          const Icon = ICONS[item.tone] || RiInformationLine;
          return (
            <div key={item.id} className={`toast toast-${item.tone}`} role={item.tone === 'error' ? 'alert' : 'status'} aria-live={item.tone === 'error' ? 'assertive' : 'polite'} style={{pointerEvents:'auto',display:'grid',gridTemplateColumns:'24px minmax(0,1fr) 32px',alignItems:'center',gap:10,minHeight:56,padding:'10px 10px 10px 14px',border:'1px solid rgba(216,173,106,.24)',borderRadius:16,color:'#f5efe8',background:'rgba(16,16,15,.96)',boxShadow:'0 18px 55px rgba(0,0,0,.38)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)'}}>
              <span style={{width:24,height:24,display:'grid',placeItems:'center',color:item.tone==='error'?'#f08a8a':item.tone==='success'?'#9bd49b':'#d8ad6a'}}><Icon size={18}/></span>
              <span style={{minWidth:0,color:'#f5efe8',fontSize:13,lineHeight:1.45,overflowWrap:'anywhere'}}>{item.message}</span>
              <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" style={{width:32,height:32,display:'grid',placeItems:'center',border:0,borderRadius:10,color:'rgba(245,239,232,.72)',background:'rgba(255,255,255,.06)',cursor:'pointer'}}>
                <RiCloseLine size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
