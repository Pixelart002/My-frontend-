import { useEffect, useRef } from 'react';
import { RiCloseLine } from '@remixicon/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function AdminModal({ title, sub, onClose, children, className = '' }) {
  const closeRef = useRef(null);
  const modalRef = useRef(null);

  useFocusTrap({
    enabled: true,
    containerRef: modalRef,
    initialFocusRef: closeRef,
    onEscape: onClose,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
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
      <div ref={modalRef} className={`admin-modal ${className}`.trim()} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby={titleId} aria-describedby={subId}>
        <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Close dialog" title="Close">
          <RiCloseLine size={20} aria-hidden="true" />
        </button>
        <h2 id={titleId}>{title}</h2>
        {sub && <p id={subId} className="modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
