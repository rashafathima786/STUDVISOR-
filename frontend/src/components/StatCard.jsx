import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Upgraded stat card.
 * Props:
 *   title    — label (e.g. "Total Students")
 *   value    — display value
 *   subtitle — secondary text
 *   trend    — 'up' | 'down' | 'neutral' (shows indicator)
 *   trendValue — e.g. "+12%" 
 *   icon     — Lucide icon element
 *   href     — optional route to navigate on click
 *   accentColor — optional color token override
 */
export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  href,
  accentColor,
}) {
  const navigate = useNavigate()

  const trendIcons = {
    up: <TrendingUp size={14} />,
    down: <TrendingDown size={14} />,
    neutral: <Minus size={14} />,
  }

  const trendColors = {
    up: 'var(--success-text)',
    down: 'var(--danger-text)',
    neutral: 'var(--text-muted)',
  }

  return (
    <div
      className={`card stat-card ${href ? 'stat-card-clickable' : ''}`}
      onClick={href ? () => navigate(href) : undefined}
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => e.key === 'Enter' && navigate(href) : undefined}
    >
      <div className="stat-card-top">
        <span className="stat-card-label">{title}</span>
        {icon && (
          <div
            className="stat-card-icon"
            style={accentColor ? { background: accentColor + '14', color: accentColor } : undefined}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="stat-card-value" style={accentColor ? { color: accentColor } : undefined}>
        {value}
      </div>

      <div className="stat-card-bottom">
        {trend && (
          <span className="stat-card-trend" style={{ color: trendColors[trend] }}>
            {trendIcons[trend]}
            {trendValue && <span>{trendValue}</span>}
          </span>
        )}
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  )
}
