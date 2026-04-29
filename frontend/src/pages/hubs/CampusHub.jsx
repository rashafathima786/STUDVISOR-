import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'
import { fetchAnonPosts, fetchEvents, fetchPolls, fetchAnnouncements, fetchLostFound } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'

export default function CampusHub() {
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [polls, setPolls] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [lostFound, setLostFound] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsData, eventsData, pollsData, announcementsData, lostFoundData] = await Promise.all([
          fetchAnonPosts(),
          fetchEvents(),
          fetchPolls(),
          fetchAnnouncements(),
          fetchLostFound()
        ])
        setPosts(Array.isArray(postsData?.posts) ? postsData.posts.slice(0, 3) : [])
        setEvents(Array.isArray(eventsData?.events) ? eventsData.events.slice(0, 1) : [])
        setPolls(Array.isArray(pollsData?.polls) ? pollsData.polls.slice(0, 1) : [])
        setAnnouncements(Array.isArray(announcementsData?.announcements) ? announcementsData.announcements.slice(0, 1) : [])
        setLostFound(Array.isArray(lostFoundData?.items) ? lostFoundData.items.slice(0, 3) : [])
      } catch (err) {
        console.error('Error fetching campus data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <ErpLayout title="Campus Life" subtitle="Stay connected with your campus community">
      <motion.div 
        className="bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Community - Large Bento Tile */}
        <motion.div variants={itemVariants} className="bento-tile bento-span-2 bento-row-span-2" style={{ cursor: 'default' }}>
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🗣️</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Campus Connect</span>
              <span className="hub-tile-desc">High-fidelity campus feed</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/campus-wall" className="bento-task-action">Open Connect</Link>
            </div>
          </div>
          <div className="bento-internal-scroll">
            <AnimatePresence mode="popLayout">
              {posts.length > 0 ? (
                posts.map((post, idx) => (
                  <motion.div 
                    key={post.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bento-task-item" 
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      {idx === 0 && <span className="mini-tag alert">🔥 Hot</span>}
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                      "{post.content}"
                    </p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                      <span>💬 {post.reply_count || 0} replies</span>
                      <span>👍 {post.reaction_count || 0}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state-mini">
                  {loading ? "Retrieving community feed..." : "No recent posts on the wall."}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Events - Wide Bento Tile */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/events" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🎉</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Upcoming Events</span>
                <span className="hub-tile-desc">Events & RSVPs</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <div key={event.id || idx} className="bento-task-item" style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', marginRight: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                        {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>
                        {new Date(event.event_date).getDate()}
                      </span>
                    </div>
                    <div className="bento-task-info" style={{ flex: 1 }}>
                      <span className="bento-task-title">{event.title}</span>
                      <span className="bento-task-meta">{event.venue} • {event.event_date}</span>
                    </div>
                    {event.is_rsvp && <span className="mini-tag success" style={{ marginLeft: 'auto' }}>RSVP'd</span>}
                  </div>
                ))
              ) : (
                <div className="empty-state-mini">
                  {loading ? "Scanning for events..." : "No upcoming events scheduled."}
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* Polls */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/polls" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">📊</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Active Polls</span>
                <span className="hub-tile-desc">{polls.length} Open Poll</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
              {polls.length > 0 ? (
                <>
                  <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>"{polls[0].question}"</p>
                  <div className="seg-progress" style={{ height: '8px' }}>
                    <div className="seg-block seg-block--filled blue" style={{ height: '8px', width: '60%' }}></div>
                    <div className="seg-block" style={{ height: '8px', width: '40%' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>60% Voted Yes</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Closes soon</span>
                  </div>
                </>
              ) : (
                <div className="empty-state-mini">
                  {loading ? "Checking for polls..." : "No active polls right now."}
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* Lost & Found */}
        <motion.div variants={itemVariants}>
          <Link to="/lost-found" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🔍</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Lost & Found</span>
                <span className="hub-tile-desc">{lostFound.length} Items</span>
              </div>
            </div>
            <div className="hub-tile-preview">
              <div className="mini-status-list">
                {lostFound.length > 0 ? (
                  lostFound.map((item, idx) => (
                    <div key={item.id || idx} className="mini-status-item">
                      <div className={`mini-dot ${item.type === 'found' ? 'success' : 'alert'}`}></div>
                      <span>{item.item_name} ({item.location})</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-mini" style={{ border: 'none', padding: 0 }}>
                    {loading ? "Searching inventory..." : "Inventory is clear."}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Announcements */}
        <motion.div variants={itemVariants}>
          <Link to="/announcements" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">📢</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Announcements</span>
                <span className="hub-tile-desc">Official notices</span>
              </div>
            </div>
            <div className="hub-tile-preview">
              <div className="mini-status-list">
                {announcements.length > 0 ? (
                  announcements.map((ann, idx) => (
                    <div key={ann.id || idx} className="mini-status-item" style={{ alignItems: 'flex-start' }}>
                      <div className="mini-dot warning" style={{ marginTop: '6px' }}></div>
                      <span style={{ lineHeight: 1.4 }}>{ann.title}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-mini" style={{ border: 'none', padding: 0 }}>
                    {loading ? "Checking notices..." : "No active notices."}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </motion.div>

      </motion.div>
    </ErpLayout>
  )
}
