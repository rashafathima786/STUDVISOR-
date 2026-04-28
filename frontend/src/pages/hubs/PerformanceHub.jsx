import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'

export default function PerformanceHub() {
  return (
    <ErpLayout title="Performance" subtitle="Track your academic performance">
      <div className="bento-grid">
        
        {/* Attendance - Large Bento Tile */}
        <div className="bento-tile bento-span-2 bento-row-span-2" style={{ cursor: 'default' }}>
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🎯</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Attendance Trends</span>
              <span className="hub-tile-desc">Bunk calculator & overview</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/attendance" className="bento-task-action">Details</Link>
            </div>
          </div>
          <div className="bento-internal-scroll">
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title">Operating Systems</span>
                <span className="bento-task-meta" style={{ color: '#10b981' }}>85% - Safe to skip 3 classes</span>
              </div>
              <div style={{ width: '60px', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '4px' }}>
                <div style={{ width: '85%', background: '#10b981', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title">Database Management</span>
                <span className="bento-task-meta" style={{ color: '#f59e0b' }}>76% - Borderline</span>
              </div>
              <div style={{ width: '60px', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '4px' }}>
                <div style={{ width: '76%', background: '#f59e0b', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title">Computer Networks</span>
                <span className="bento-task-meta" style={{ color: '#10b981' }}>90% - Excellent</span>
              </div>
              <div style={{ width: '60px', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '4px' }}>
                <div style={{ width: '90%', background: '#10b981', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title">Data Structures Lab</span>
                <span className="bento-task-meta" style={{ color: '#ef4444' }}>65% - Critical</span>
              </div>
              <div style={{ width: '60px', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '4px' }}>
                <div style={{ width: '65%', background: '#ef4444', height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* GPA - Wide Bento Tile */}
        <Link to="/gpa" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🏆</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">GPA Forecaster</span>
              <span className="hub-tile-desc">Current CGPA: 8.7 / 10.0</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
             <div className="seg-progress" style={{ height: '8px' }}>
              <div className="seg-block seg-block--filled violet" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled violet" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled violet" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled violet" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled violet" style={{ height: '8px' }}></div>
              <div className="seg-block" style={{ height: '8px' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Target: 9.0</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Requires 9.2 next sem</span>
            </div>
          </div>
        </Link>

        {/* Results */}
        <Link to="/results" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">📋</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Results</span>
              <span className="hub-tile-desc">Sem 3 Published</span>
            </div>
          </div>
          <div className="hub-tile-preview">
            <div className="mini-status-list">
              <div className="mini-status-item">
                <div className="mini-dot active"></div>
                <span>Top 15% in Class</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Leaderboard */}
        <Link to="/leaderboard" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🥇</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Leaderboard</span>
              <span className="hub-tile-desc">Rank #12 of 60</span>
            </div>
          </div>
          <div className="hub-tile-preview">
            <div className="mini-status-list">
              <div className="mini-status-item">
                <div className="mini-dot active"></div>
                <span>Up 3 spots from last month</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Analytics - Wide Bento Tile */}
        <Link to="/analytics" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🔬</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">AI Analytics</span>
              <span className="hub-tile-desc">1 New Insight Available</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6ee7b7', lineHeight: 1.5, fontWeight: 500 }}>
                💡 <strong>Insight:</strong> Your performance in Practical subjects is 14% higher than Theory. Focusing more on theoretical concepts in OS could boost your overall CGPA to 8.9 this semester.
              </p>
            </div>
          </div>
        </Link>

        {/* Achievements */}
        <Link to="/achievements" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">⭐</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Achievements</span>
              <span className="hub-tile-desc">369 Gold Points</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
            <div className="seg-progress" style={{ height: '8px' }}>
              <div className="seg-block seg-block--filled orange" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled orange" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled orange" style={{ height: '8px' }}></div>
              <div className="seg-block" style={{ height: '8px' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Gold Tier</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>131 points to Platinum</span>
            </div>
          </div>
        </Link>

      </div>
    </ErpLayout>
  )
}
