import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'

export default function CampusHub() {
  return (
    <ErpLayout title="Campus Life" subtitle="Stay connected with your campus community">
      <div className="bento-grid">
        
        {/* Community - Large Bento Tile */}
        <div className="bento-tile bento-span-2 bento-row-span-2" style={{ cursor: 'default' }}>
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🗣️</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Community Wall</span>
              <span className="hub-tile-desc">Anonymous campus feed</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/campus-wall" className="bento-task-action">Open Wall</Link>
            </div>
          </div>
          <div className="bento-internal-scroll">
            <div className="bento-task-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span className="mini-tag alert">🔥 Hot</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>2h ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                "Anyone know the syllabus for OS Mid-terms? The one on portal seems outdated."
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                <span>💬 45 replies</span>
                <span>👍 12</span>
              </div>
            </div>
            <div className="bento-task-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span className="mini-tag violet">New</span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>5h ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                "Found a blue water bottle near Library 2nd floor. Handed it over to security."
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                <span>💬 2 replies</span>
                <span>👍 8</span>
              </div>
            </div>
            <div className="bento-task-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>1d ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                "Is the cafeteria open during the weekend?"
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                <span>💬 12 replies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Events - Wide Bento Tile */}
        <Link to="/events" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🎉</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Upcoming Events</span>
              <span className="hub-tile-desc">Events & RSVPs</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
            <div className="bento-task-item" style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', marginRight: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Oct</span>
                <span style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>24</span>
              </div>
              <div className="bento-task-info" style={{ flex: 1 }}>
                <span className="bento-task-title">Tech Symposium 2026</span>
                <span className="bento-task-meta">Main Auditorium • 10:00 AM</span>
              </div>
              <span className="mini-tag success" style={{ marginLeft: 'auto' }}>RSVP'd</span>
            </div>
          </div>
        </Link>

        {/* Polls */}
        <Link to="/polls" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">📊</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Active Polls</span>
              <span className="hub-tile-desc">1 Open Poll</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>"Shift Friday Lab to morning?"</p>
            <div className="seg-progress" style={{ height: '8px' }}>
              <div className="seg-block seg-block--filled blue" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled blue" style={{ height: '8px' }}></div>
              <div className="seg-block seg-block--filled blue" style={{ height: '8px' }}></div>
              <div className="seg-block" style={{ height: '8px' }}></div>
              <div className="seg-block" style={{ height: '8px' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>60% Voted Yes</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Closes tomorrow</span>
            </div>
          </div>
        </Link>

        {/* Lost & Found */}
        <Link to="/lost-found" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🔍</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Lost & Found</span>
              <span className="hub-tile-desc">3 Found Items</span>
            </div>
          </div>
          <div className="hub-tile-preview">
            <div className="mini-status-list">
              <div className="mini-status-item">
                <div className="mini-dot"></div>
                <span>AirPods Pro (Library)</span>
              </div>
              <div className="mini-status-item">
                <div className="mini-dot"></div>
                <span>Calculus Textbook</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Announcements */}
        <Link to="/announcements" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">📢</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Announcements</span>
              <span className="hub-tile-desc">Official notices</span>
            </div>
          </div>
          <div className="hub-tile-preview">
            <div className="mini-status-list">
              <div className="mini-status-item" style={{ alignItems: 'flex-start' }}>
                <div className="mini-dot warning" style={{ marginTop: '6px' }}></div>
                <span style={{ lineHeight: 1.4 }}>Fee submission deadline extended by Admin...</span>
              </div>
            </div>
          </div>
        </Link>

      </div>
    </ErpLayout>
  )
}
