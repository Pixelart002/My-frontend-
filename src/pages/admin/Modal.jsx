import { useEffect, useRef } from 'react';
import { RiCloseLine } from '@remixicon/react';

export default function AdminModal({ title, sub, onClose, children }) {
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus?.();
    };
  }, []);

  const titleId = 'admin-modal-title';
  const subId = sub ? 'admin-modal-description' : undefined;

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subId}>
        <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
          <RiCloseLine size={20} aria-hidden="true" />
        </button>
        <h2 id={titleId}>{title}</h2>
        {sub && <p id={subId} className="modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
