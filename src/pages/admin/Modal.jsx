import { RiCloseLine } from '@remixicon/react';

/**
 * Shared modal shell for the admin console. Dismiss on overlay click or close.
 */
export default function AdminModal({ title, sub, onClose, children }) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">
          <RiCloseLine size={20} />
        </button>
        <h2>{title}</h2>
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
