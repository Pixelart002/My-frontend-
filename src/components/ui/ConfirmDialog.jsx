import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
} from '@remixicon/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const triggerRef = useRef(null);
  
  const titleId = useId();
  const messageId = useId();
  
  useFocusTrap({
    enabled: open,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onEscape: () => {
      if (!busy) {
        onCancel?.();
      }
    },
  });
  
  useEffect(() => {
    if (!open) return undefined;
    
    const activeElement = document.activeElement;
    
    triggerRef.current =
      activeElement instanceof HTMLElement ?
      activeElement :
      null;
    
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = previousOverflow;
      
      if (
        triggerRef.current &&
        document.contains(triggerRef.current)
      ) {
        triggerRef.current.focus();
      }
    };
  }, [open]);
  
  useEffect(() => {
    if (!open) return undefined;
    
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && busy) {
        event.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, busy]);
  
  if (!open) return null;
  
  const handleConfirm = () => {
    if (busy) return;
    onConfirm?.();
  };
  
  const handleCancel = () => {
    if (busy) return;
    onCancel?.();
  };
  
  const dialog = (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog ${
          danger ? 'confirm-dialog--danger' : ''
        }`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        aria-busy={busy}
        tabIndex={-1}
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          {danger ? (
            <RiAlertLine size={21} />
          ) : (
            <RiCheckboxCircleLine size={21} />
          )}
        </div>

        <div className="confirm-dialog-content">
          <h2 id={titleId}>{title}</h2>

          {message && (
            <p id={messageId}>
              {message}
            </p>
          )}
        </div>

        <div className="confirm-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-quiet"
            onClick={handleCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={
              danger
                ? 'btn btn-danger'
                : 'btn'
            }
            onClick={handleConfirm}
            disabled={busy}
            aria-disabled={busy}
          >
            {busy && (
              <RiLoader4Line
                className="confirm-dialog-spinner"
                size={16}
                aria-hidden="true"
              />
            )}

            <span>
              {busy ? 'Working…' : confirmLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
  
  return createPortal(dialog, document.body);
}