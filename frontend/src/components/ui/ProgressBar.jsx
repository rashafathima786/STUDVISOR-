import React from 'react'

export default function ProgressBar({ value, max = 100, color = '#8b5cf6', label }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="progress-bar-wrap">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          <span style={{ color }}>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} 
        />
      </div>
    </div>
  )
}
