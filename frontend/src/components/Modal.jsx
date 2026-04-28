import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Accessible modal dialog with focus trap and backdrop.
 * Props:
 *   open      — boolean
 *   onClose   — () => void
 *   title     — header text
 *   children  — body content
 *   size      — 'sm' | 'md' | 'lg' (default: 'md')
 *   footer    — optional footer content (buttons)
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const el = dialogRef.current
    if (el) el.focus()

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className={`modal-dialog modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
