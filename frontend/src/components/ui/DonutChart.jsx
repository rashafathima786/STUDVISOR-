import React from 'react'

export default function DonutChart({ value, size = 120, stroke = 10, color = '#8b5cf6', label }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const bg = color === '#22c55e' ? 'rgba(34,197,94,0.08)' : color === '#ef4444' ? 'rgba(239,68,68,0.08)' : 'rgba(139,92,246,0.08)'
  
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="donut-center">
        <span className="donut-value" style={{ color }}>{value}%</span>
        {label && <span className="donut-label">{label}</span>}
      </div>
    </div>
  )
}
