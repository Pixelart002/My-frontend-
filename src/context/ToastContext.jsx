import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  RiCheckboxCircleFill,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
} from '@remixicon/react';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4200;
const MAX_VISIBLE_TOASTS = 5;

const ICONS = {
  success: RiCheckboxCircleFill,
  error: RiErrorWarningLine,
  info: RiInformationLine,
};

const TONES = new Set([
  'success',
  'error',
  'info',
]);

const normalizeTone = (tone) => {
  return TONES.has(tone) ? tone : 'info';
};

const normalizeMessage = (message) => {
  if (message == null) return '';
  
  if (typeof message === 'string') {
    return message.trim();
  }
  
  if (
    typeof message === 'number' ||
    typeof message === 'boolean'
  ) {
    return String(message);
  }
  
  return String(message);
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const timers = useRef(new Map());
  const idCounter = useRef(0);
  
  /**
   * Generate stable IDs without relying on Math.random().
   */
  const createId = useCallback(() => {
    idCounter.current += 1;
    
    return `toast-${Date.now()}-${idCounter.current}`;
  }, []);
  
  const clearTimer = useCallback((id) => {
    const timer = timers.current.get(id);
    
    if (!timer) return;
    
    window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);
  
  const dismiss = useCallback(
    (id) => {
      clearTimer(id);
      
      setToasts((current) =>
        current.filter(
          (toast) => toast.id !== id,
        ),
      );
    },
    [clearTimer],
  );
  
  const push = useCallback(
    (
      message,
      tone = 'info',
      duration = DEFAULT_DURATION,
    ) => {
      const normalizedMessage =
        normalizeMessage(message);
      
      if (!normalizedMessage) {
        return null;
      }
      
      const normalizedTone =
        normalizeTone(tone);
      
      const id = createId();
      
      setToasts((current) => [
        ...current.slice(
          -(MAX_VISIBLE_TOASTS - 1),
        ),
        {
          id,
          message: normalizedMessage,
          tone: normalizedTone,
        },
      ]);
      
      if (
        Number.isFinite(duration) &&
        duration > 0
      ) {
        const timer = window.setTimeout(() => {
          dismiss(id);
        }, duration);
        
        timers.current.set(id, timer);
      }
      
      return id;
    },
    [createId, dismiss],
  );
  
  /**
   * Clear every active timer when the provider unmounts.
   */
  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
      
      timers.current.clear();
    };
  }, []);
  
  /**
   * Supports both:
   *
   * toast.success('Added')
   * const { success } = useToast()
   * success('Added')
   */
  const toast = useMemo(() => {
    const notify = (
      message,
      tone = 'info',
      duration = DEFAULT_DURATION,
    ) => {
      return push(
        message,
        tone,
        duration,
      );
    };
    
    notify.success = (
        message,
        duration = DEFAULT_DURATION,
      ) =>
      push(
        message,
        'success',
        duration,
      );
    
    notify.error = (
        message,
        duration = DEFAULT_DURATION,
      ) =>
      push(
        message,
        'error',
        duration,
      );
    
    notify.info = (
        message,
        duration = DEFAULT_DURATION,
      ) =>
      push(
        message,
        'info',
        duration,
      );
    
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
    [
      toast,
      dismiss,
    ],
  );
  
  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="toast-stack"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const Icon =
            ICONS[item.tone] ||
            RiInformationLine;

          const isError =
            item.tone === 'error';

          return (
            <div
              key={item.id}
              className={`toast toast-${item.tone}`}
              role={
                isError
                  ? 'alert'
                  : 'status'
              }
              aria-atomic="true"
            >
              <span
                className="toast-icon"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>

              <p className="toast-message">
                {item.message}
              </p>

              <button
                type="button"
                className="toast-dismiss"
                onClick={() =>
                  dismiss(item.id)
                }
                aria-label="Dismiss notification"
              >
                <RiCloseLine
                  size={17}
                  aria-hidden="true"
                />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context =
    useContext(ToastContext);
  
  if (!context) {
    throw new Error(
      'useToast must be used inside ToastProvider.',
    );
  }
  
  return context;
}