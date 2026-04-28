import { Inbox } from 'lucide-react'

/**
 * Empty state placeholder.
 * Props:
 *   icon     — Lucide icon element (default: Inbox)
 *   title    — heading text
 *   description — body text
 *   action   — optional CTA { label, onClick } or React node
 */
export default function EmptyState({
  icon,
  title = 'No data found',
  description = '',
  action = null,
}) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        {icon || <Inbox size={40} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && (
        typeof action === 'object' && action.label ? (
          <button className="primary-btn compact-btn" onClick={action.onClick}>
            {action.label}
          </button>
        ) : action
      )}
    </div>
  )
}
