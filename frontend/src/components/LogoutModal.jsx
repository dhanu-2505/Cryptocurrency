import { LogOut, X } from 'lucide-react'
import './LogoutModal.css'

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logout-modal-header">
          <div className="logout-modal-title">
            <div className="logout-title-icon">
              <LogOut size={18} />
            </div>
            <h3>Logout</h3>
          </div>
          <button className="logout-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="logout-modal-body">
          <p>Are you sure you want to logout?</p>
        </div>

        <div className="logout-modal-actions">
          <button type="button" className="btn btn-secondary logout-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn logout-confirm-btn"
            onClick={onConfirm}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
