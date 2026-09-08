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
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => {
          const Icon = ICONS[item.tone] || RiInformationLine;
          return (
            <div key={item.id} className={`toast toast-${item.tone}`}>
              <Icon size={17} />
              <span>{item.message}</span>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
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
