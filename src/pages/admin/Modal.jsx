import {
  useEffect,
  useId,
  useRef,
} from 'react';
import { RiCloseLine } from '@remixicon/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function AdminModal({
  title,
  sub,
  onClose,
  children,
  className = '',
}) {
  const closeRef = useRef(null);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  
  const generatedId = useId();
  
  const titleId = `admin-modal-title-${generatedId}`;
  const descriptionId = sub ?
    `admin-modal-description-${generatedId}` :
    undefined;
  
  useFocusTrap({
    enabled: true,
    containerRef: modalRef,
    initialFocusRef: closeRef,
    onEscape: onClose,
  });
  
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;
    
    const previousPaddingRight =
      document.body.style.paddingRight;
    
    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    
    /*
     * Prevent layout shift when the scrollbar disappears.
     * Only compensate when a scrollbar actually exists.
     */
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      document.body.style.overflow =
        previousOverflow;
      
      document.body.style.paddingRight =
        previousPaddingRight;
    };
  }, []);
  
  const handleOverlayMouseDown = (event) => {
    if (
      event.target === overlayRef.current
    ) {
      onClose?.();
    }
  };
  
  const handleOverlayClick = (event) => {
    if (
      event.target === overlayRef.current
    ) {
      onClose?.();
    }
  };
  
  return (
    <div
      ref={overlayRef}
      className="admin-modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`admin-modal ${className}`.trim()}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          ref={closeRef}
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close dialog"
          title="Close"
        >
          <RiCloseLine
            size={20}
            aria-hidden="true"
          />
        </button>

        <h2 id={titleId}>{title}</h2>

        {sub && (
          <p
            id={descriptionId}
            className="modal-sub"
          >
            {sub}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}