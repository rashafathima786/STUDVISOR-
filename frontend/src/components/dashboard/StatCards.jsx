import React from 'react'
import { BookOpen, Target, Award, Clock } from 'lucide-react'

export default function StatCards({ profile, bunkData, marks }) {
  const stats = [
    { 
      label: 'Active Courses', 
      value: marks?.length || 6, 
      trend: '+1 this sem', 
      icon: <BookOpen size={20} />, 
      color: 'violet', 
      isUp: true 
    },
    { 
      label: 'Safe Skips', 
      value: bunkData?.can_miss || 0, 
      trend: 'budget healthy', 
      icon: <Target size={20} />, 
      color: 'green', 
      isUp: true 
    },
    { 
      label: 'Merit Rank', 
      value: profile?.merit_points || 369, 
      trend: `${profile?.merit_tier || 'Gold'} tier`, 
      icon: <Award size={20} />, 
      color: 'orange', 
      isUp: true 
    },
    { 
      label: 'Pending Tasks', 
      value: 3, 
      trend: 'due this week', 
      icon: <Clock size={20} />, 
      color: 'pink', 
      isUp: false 
    }
  ]

  return (
    <div className="nx-bento" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {stats.map((s, i) => (
        <div key={i} className="stat-card">
          <div className={`stat-icon stat-icon--${s.color}`}>{s.icon}</div>
          <div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-trend stat-trend--${s.isUp ? 'up' : 'down'}`}>
              {s.trend}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
