import { useEffect, useRef } from 'react';
import { RiAlertLine, RiCloseLine } from '@remixicon/react';
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

  useFocusTrap({
    enabled: open,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onEscape: () => { if (!busy) onCancel?.(); },
  });

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="confirm-dialog-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className={`confirm-dialog ${danger ? 'confirm-dialog-danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
      >
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon ${danger ? 'is-danger' : ''}`} aria-hidden="true">
            {danger ? <RiAlertLine size={18} /> : <RiCloseLine size={18} />}
          </div>
          <button
            type="button"
            className="confirm-dialog-close"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close confirmation dialog"
          >
            <RiCloseLine size={16} />
          </button>
        </div>

        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>

        <div className="btn-row btn-row-end">
          <button ref={cancelRef} type="button" className="btn btn-quiet" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
