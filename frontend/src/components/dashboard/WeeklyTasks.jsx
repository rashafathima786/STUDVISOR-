import React from 'react'

export default function WeeklyTasks() {
  const tasks = [
    { title: 'OS Lab Report', due: 'Tomorrow, 10:00 AM', status: 'pending', total: 5, completed: 3 },
    { title: 'DB Normalization Assignment', due: 'Friday, 5:00 PM', status: 'in-progress', total: 8, completed: 5 },
    { title: 'AI Ethics Essay', due: 'Next Monday', status: 'new', total: 4, completed: 0 }
  ]

  return (
    <div className="nx-card nx-span-2">
      <div className="nx-card-head">
        <span className="nx-card-label">Weekly Tasks</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
        {tasks.map((task, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{task.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Due: {task.due}</div>
              </div>
              <div className="mini-tag violet">{task.completed}/{task.total}</div>
            </div>
            <div className="seg-progress">
              {Array.from({ length: task.total }).map((_, j) => (
                <div 
                  key={j} 
                  className={`seg-block ${j < task.completed ? 'seg-block--filled violet' : ''}`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
