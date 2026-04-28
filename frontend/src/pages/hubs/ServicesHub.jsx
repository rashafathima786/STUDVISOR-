import { useState } from 'react'
import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'

export default function ServicesHub() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <ErpLayout title="Campus Services" subtitle="Your administrative, financial, and career hub">
      
      {/* Premium Tab Navigation */}
      <div style={{
        display: 'flex', gap: '12px', marginBottom: '32px',
        background: 'rgba(255,255,255,0.02)', padding: '8px',
        borderRadius: '24px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)'
      }}>
        {['overview', 'placements', 'financials', 'helpdesk'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px', borderRadius: '16px', border: 'none',
              background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              textTransform: 'capitalize', cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bento-grid">
          
          {/* Quick Actions - Span 4 */}
          <div className="bento-tile bento-span-4" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: '24px 36px', minHeight: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Next Payment Due</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>$0.00</span>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Leave Balance</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>12 Days</span>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Tickets</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>1 Open</span>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }} />
            <button className="bento-task-action primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>+ Quick Request</button>
          </div>

          {/* Placements - Large Bento Tile */}
          <div className="bento-tile bento-span-2 bento-row-span-2">
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🚀</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Career & Placements</span>
                <span className="hub-tile-desc">Track your job applications</span>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Link to="/placement" className="bento-task-action">Open Portal</Link>
              </div>
            </div>
            <div className="bento-internal-scroll">
              <div className="bento-task-item" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.02))', borderColor: 'rgba(59,130,246,0.2)' }}>
                <div className="bento-task-info">
                  <span className="bento-task-title" style={{ color: '#60a5fa' }}>Google Off-Campus</span>
                  <span className="bento-task-meta">Application under review</span>
                </div>
                <span className="mini-tag blue" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>In Progress</span>
              </div>
              <div className="bento-task-item">
                <div className="bento-task-info">
                  <span className="bento-task-title">Tech Mahindra</span>
                  <span className="bento-task-meta" style={{ color: '#a78bfa' }}>Aptitude Round - Oct 28</span>
                </div>
                <button className="bento-task-action">Prepare</button>
              </div>
              <div className="bento-task-item">
                <div className="bento-task-info">
                  <span className="bento-task-title">Infosys</span>
                  <span className="bento-task-meta" style={{ color: '#fb923c' }}>Pending Review</span>
                </div>
                <button className="bento-task-action">Details</button>
              </div>
              <div className="bento-task-item">
                <div className="bento-task-info">
                  <span className="bento-task-title">TCS Digital</span>
                  <span className="bento-task-meta" style={{ color: '#34d399' }}>Interview Scheduled</span>
                </div>
                <button className="bento-task-action primary">Join Link</button>
              </div>
            </div>
          </div>

          {/* Leave Portal - Wide Bento Tile */}
          <Link to="/leave" className="bento-tile bento-span-2">
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🏝️</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Leave & OD Portal</span>
                <span className="hub-tile-desc">Manage absences & on-duty requests</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                 <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Casual Leave</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>4 / 10</div>
                    <div className="seg-progress" style={{ marginTop: '12px' }}><div className="seg-block"><div style={{width: '40%', height: '100%', background: '#3b82f6'}} /></div></div>
                 </div>
                 <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Medical Leave</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>8 / 15</div>
                    <div className="seg-progress" style={{ marginTop: '12px' }}><div className="seg-block"><div style={{width: '53%', height: '100%', background: '#f59e0b'}} /></div></div>
                 </div>
              </div>
              <div className="bento-task-item" style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="bento-task-info">
                  <span className="bento-task-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Family Event <span className="mini-tag success">Approved</span>
                  </span>
                  <span className="bento-task-meta">Oct 10 - Oct 12</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Fees */}
          <Link to="/fees" className="bento-tile">
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">💳</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Financials</span>
                <span className="hub-tile-desc">Fees & Receipts</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ marginTop: '16px' }}>
              <div style={{ padding: '24px', background: 'radial-gradient(circle at top right, rgba(16,185,129,0.1), transparent)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🎉</span>
                <h3 style={{ margin: '12px 0 4px', fontSize: '1.2rem', color: '#fff' }}>All Paid Up!</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No pending dues for Sem 3.</p>
              </div>
            </div>
          </Link>

          {/* Library */}
          <Link to="/library" className="bento-tile">
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">📚</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Library</span>
                <span className="hub-tile-desc">Books & resources</span>
              </div>
            </div>
            <div className="hub-tile-preview">
              <div className="hub-preview-row">
                <span>Issued Books</span>
                <span className="mini-tag alert" style={{ animation: 'pulse 2s infinite' }}>1 Overdue</span>
              </div>
              <div className="mini-status-list" style={{ marginTop: '16px' }}>
                <div className="mini-status-item" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="mini-dot danger"></div>
                  <div>
                    <div style={{ color: '#fca5a5', fontWeight: 700 }}>Intro to Algorithms</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Due: Oct 15 • Fine: $2.00</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

        </div>
      )}

      {/* Placeholder states for other tabs to show depth */}
      {activeTab !== 'overview' && (
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            🛠️
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-primary)' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', textAlign: 'center' }}>
            This highly advanced section is dynamically loaded. Navigate back to overview to see the glassmorphism bento grid in action.
          </p>
          <button className="bento-task-action primary" onClick={() => setActiveTab('overview')}>Back to Overview</button>
        </div>
      )}

    </ErpLayout>
  )
}
