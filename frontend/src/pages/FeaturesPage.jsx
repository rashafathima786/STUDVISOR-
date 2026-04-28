import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import {
  fetchComplaints, createComplaint, upvoteComplaint,
  fetchPolls, votePoll,
  fetchEvents, rsvpEvent,
  fetchAnnouncements,
  fetchFaculty,
  fetchAssignments, submitAssignment,
  fetchExams,
  fetchSyllabus, toggleSyllabusTopic,
  fetchNotes, createNote, rateNote,
  fetchLostFound, createLostFoundItem, claimLostFoundItem,
  fetchAchievements,
  fetchLeaderboard
} from '../services/api'
import { AlertCircle, FileText, CheckCircle, Clock, ThumbsUp, Upload, MapPin, X } from 'lucide-react'

// --- REUSABLE MODAL COMPONENT ---
const Modal = ({ title, onClose, children, actionLabel, onAction }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3>{title}</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
      </div>
      {children}
      {onAction && (
        <div className="modal-actions">
          <button className="outline-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn compact-btn" onClick={onAction}>{actionLabel}</button>
        </div>
      )}
    </div>
  </div>
)

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('Complaints')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Modals state
  const [showModal, setShowModal] = useState(null)
  const [formData, setFormData] = useState({})

  const tabs = [
    'Complaints', 'Assignments', 'Exams', 'Syllabus', 'Events', 'Notes', 
    'Polls', 'Lost+Found', 'Announcements', 'Faculty', 'Achievements', 'Leaderboard'
  ]

  function loadData(tab = activeTab) {
    setLoading(true)
    let p;
    switch(tab) {
      case 'Complaints': p = fetchComplaints(); break;
      case 'Assignments': p = fetchAssignments(); break;
      case 'Exams': p = fetchExams(); break;
      case 'Syllabus': p = fetchSyllabus(); break;
      case 'Events': p = fetchEvents(); break;
      case 'Notes': p = fetchNotes(); break;
      case 'Polls': p = fetchPolls(); break;
      case 'Lost+Found': p = fetchLostFound(); break;
      case 'Announcements': p = fetchAnnouncements(); break;
      case 'Faculty': p = fetchFaculty(); break;
      case 'Achievements': p = fetchAchievements(); break;
      case 'Leaderboard': p = fetchLeaderboard(); break;
      default: p = Promise.resolve({data: []})
    }
    
    p.then(res => {
      if (!res) {
        setData([])
        setLoading(false)
        return
      }
      
      let fieldData = []
      if (Array.isArray(res)) {
        fieldData = res
      } else if (typeof res === 'object') {
         const keys = Object.keys(res)
         if (keys.length > 0) {
            fieldData = res[keys[0]] || []
         }
      }
      setData(Array.isArray(fieldData) ? fieldData : [])
      setLoading(false)
    }).catch(() => {
      setData([])
      setLoading(false)
    })
  }

  useEffect(() => { loadData(activeTab) }, [activeTab])

  const GenericChange = (field, val) => setFormData(p => ({ ...p, [field]: val }))
  
  const resetAndReload = () => { setShowModal(null); setFormData({}); loadData(); }

  // --- ACTIONS ---
  const handleUpvoteComplaint = async (id) => { try { await upvoteComplaint(id); loadData(); } catch(e){} }
  const handleCreateComplaint = async () => { try { await createComplaint(formData); resetAndReload(); } catch(e) { alert("Failed to log complaint") } }
  
  const handleSubmitAssignment = async (id) => { try { await submitAssignment(id); loadData(); } catch(e){} }
  
  const handleRsvpEvent = async (id) => { try { await rsvpEvent(id); loadData(); } catch(e){} }
  
  const handleToggleTopic = async (id) => { try { await toggleSyllabusTopic(id); loadData(); } catch(e){} }
  
  const handleRateNote = async (id, isHelpful) => { try { await rateNote(id, isHelpful); loadData(); } catch(e){} }
  const handleCreateNote = async () => { try { await createNote(formData); resetAndReload(); } catch(e){} }
  
  const handleVotePoll = async (id, idx) => { try { await votePoll(id, idx); loadData(); } catch(e){} }
  
  const handleClaimItem = async (id) => { try { await claimLostFoundItem(id); loadData(); } catch(e){} }
  const handleCreateItem = async () => { try { await createLostFoundItem(formData); resetAndReload(); } catch(e){} }

  // --- TAB RENDERS ---
  const renderComplaints = () => (
    <>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="primary-btn compact-btn" onClick={() => setShowModal('Complaint')}>+ Log Complaint</button>
      </div>
      <div className="feature-list">
        {data.map(c => (
          <div key={c.id} className={`feature-item-card urgency-${c.urgency.toLowerCase()}`}>
            <div className="fi-header">
              <span className={`fi-badge level-${c.level.toLowerCase()}`}>{c.level}</span>
              <span className={`fi-badge urgency-${c.urgency.toLowerCase()}`}>{c.urgency}</span>
              <span className={`fi-badge status-${c.status.replace(' ', '-').toLowerCase()}`}>{c.status}</span>
              <span className="fi-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
                 👍 {c.upvotes}
              </span>
            </div>
            <h4>{c.title}</h4>
            <p>{c.description}</p>
            {c.admin_response && <div className="admin-response">Admin: {c.admin_response}</div>}
            <div className="fi-footer">
              <span className="fi-meta">{c.category}</span>
              <button className="outline-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleUpvoteComplaint(c.id)}>Upvote</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  const renderAssignments = () => (
    <div className="dashboard-grid">
      {data.map(a => (
        <div key={a.id} className="feature-item-card">
          <div className="fi-header">
            {a.status === 'Submitted' ? <span className="fi-badge status-approved">Submitted</span> : 
             a.status === 'Overdue' ? <span className="fi-badge urgency-critical">Overdue</span> : 
             <span className="fi-badge status-pending">Pending</span>}
          </div>
          <h4>{a.title}</h4>
          <p>{a.description}</p>
          <div className="fi-meta" style={{ marginTop: '12px' }}>
            <AlertCircle size={12} style={{ display:'inline', marginRight:'2px' }}/> Due {new Date(a.due_date).toLocaleDateString()}
          </div>
          <div className="fi-footer" style={{ marginTop: '16px' }}>
            <span className="fi-meta">{a.subject_name}</span>
            {a.status === 'Pending' && (
              <button className="primary-btn compact-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleSubmitAssignment(a.id)}>Submit Work</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderEvents = () => (
    <div className="dashboard-grid">
      {data.map(e => (
        <div key={e.id} className="feature-item-card">
          <div className="fi-header">
            <span className="fi-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>{e.category}</span>
          </div>
          <h4>{e.name}</h4>
          <p>{e.description}</p>
          <div className="fi-meta" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span><Clock size={12} style={{ display:'inline', marginRight:'2px' }}/> {new Date(e.date_time).toLocaleString()}</span>
            <span><MapPin size={12} style={{ display:'inline', marginRight:'2px' }}/> {e.location}</span>
          </div>
          <div className="fi-footer">
            <span className="fi-meta">RSVPs: {e.rsvp_count}</span>
            {!e.has_rsvpd ? (
                <button className="primary-btn compact-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleRsvpEvent(e.id)}>Reserve Spot</button>
            ) : (
                <span style={{ color: '#6ee7b7', fontSize: '0.85rem', fontWeight: 600 }}>Reserved ✅</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderNotes = () => (
    <>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="primary-btn compact-btn" onClick={() => setShowModal('Note')}>+ Upload Notes</button>
      </div>
      <div className="dashboard-grid">
        {data.map(n => (
          <div key={n.id} className="feature-item-card">
             <h4>{n.title}</h4>
             <div className="note-content">{n.content}</div>
             <div className="fi-footer">
               <span className="fi-meta">By {n.uploaded_by}</span>
               <div className="note-ratings">
                  <button className="outline-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleRateNote(n.id, true)}>👍 {n.helpful_votes}</button>
                  <button className="outline-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleRateNote(n.id, false)}>👎 {n.not_helpful_votes}</button>
               </div>
             </div>
          </div>
        ))}
      </div>
    </>
  )

  const renderLostFound = () => (
    <>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="primary-btn compact-btn" onClick={() => setShowModal('LostFound')}>+ Report Item</button>
      </div>
      <div className="dashboard-grid">
        {data.map(i => (
          <div key={i.id} className="feature-item-card">
            <div className="fi-header">
              <span className={`fi-badge ${i.item_type === 'Lost' ? 'urgency-high' : 'status-approved'}`}>{i.item_type}</span>
              <span className={`fi-badge ${i.status === 'Open' ? 'status-pending' : 'status-approved'}`}>{i.status}</span>
            </div>
            <h4>{i.item_name}</h4>
            <p>{i.description}</p>
            <div className="fi-meta" style={{ marginTop: '12px' }}>
              <MapPin size={12} style={{ display:'inline', marginRight:'2px' }}/> {i.location}
            </div>
            <div className="fi-footer">
              <span className="fi-meta">By {i.reported_by}</span>
              {i.status === 'Open' && (
                <button className="primary-btn compact-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleClaimItem(i.id)}>
                  {i.item_type === 'Lost' ? 'I found this' : 'This is mine!'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <ErpLayout title="Campus Hub" subtitle="Enterprise Workflows and Resource Management">
      
      <div className="features-tabs">
        {tabs.map(t => (
          <button key={t} className={`feature-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div className="feature-content" style={{ minHeight: '500px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Synchonizing Enterprise Data...</div>
        ) : (
          <>
            {data.length === 0 && activeTab !== 'Leaderboard' && <div className="empty-state card">No active records found for {activeTab}.</div>}
            
            {activeTab === 'Complaints' && renderComplaints()}
            {activeTab === 'Assignments' && renderAssignments()}
            {activeTab === 'Events' && renderEvents()}
            {activeTab === 'Notes' && renderNotes()}
            {activeTab === 'Lost+Found' && renderLostFound()}
            
            {/* Polls */}
            {activeTab === 'Polls' && (
              <div className="dashboard-grid">
                {data.map(p => {
                  const total = p.options.reduce((sum, opt) => sum + opt.votes, 0)
                  return (
                    <div key={p.id} className="feature-item-card">
                      <div className="fi-header">
                        {p.has_voted ? <span className="fi-badge status-approved">Voted</span> : <span className="fi-badge status-pending">Active</span>}
                      </div>
                      <h4>{p.question}</h4>
                      <div className="poll-options">
                        {p.options.map((opt, i) => {
                          const pct = total === 0 ? 0 : Math.round((opt.votes / total) * 100)
                          return (
                            <div key={i} className="poll-option" onClick={() => !p.has_voted && handleVotePoll(p.id, i)}>
                              <div className="poll-option-bar" style={{ width: `${pct}%` }}></div>
                              <span className="poll-option-text">{opt.text}</span>
                              <span className="poll-option-pct">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Syllabus */}
            {activeTab === 'Syllabus' && (
              <div>
                {data.map(sub => {
                  const covered = sub.topics.filter(t => t.is_covered).length
                  const total = sub.topics.length
                  const pct = total === 0 ? 0 : Math.round((covered / total) * 100)
                  return (
                    <div key={sub.subject_id} className="card" style={{ marginBottom: '16px' }}>
                      <h4>{sub.subject_name}</h4>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--accent)' }}></div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pct}% Covered</span>
                      <div className="syllabus-unit">
                        <div className="syllabus-topics">
                          {sub.topics.map(t => (
                            <div key={t.id} className={`syllabus-topic ${t.is_covered ? 'covered' : ''}`} onClick={() => handleToggleTopic(t.id)}>
                              <input type="checkbox" checked={t.is_covered} readOnly style={{ pointerEvents: 'none' }} />
                              <span>{t.topic_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Achievements & Leaderboard & Simple Lists */}
            {activeTab === 'Achievements' && (
              <div className="achievements-grid">
                {data.map(a => (
                  <div key={a.id} className={`achievement-card ${a.locked ? 'locked' : 'unlocked'}`}>
                    <div className="achievement-icon">{a.icon}</div>
                    <h4>{a.name}</h4><p>{a.description}</p>
                    <div style={{ fontSize: '0.75rem', color: a.locked ? 'var(--text-muted)' : '#6ee7b7', fontWeight: 600 }}>{a.locked ? 'Locked' : 'Unlocked'}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Leaderboard' && (
              <div className="card">
                <table style={{ width: '100%' }}>
                  <thead><tr><th>Rank</th><th>Student</th><th>Score / GPA</th></tr></thead>
                  <tbody>
                    {data.map((l, i) => (
                      <tr key={i} className={i < 3 ? 'top-rank' : ''}>
                        <td style={{ fontWeight: 800, color: i===0?'#fcd34d':i===1?'#e2e8f0':i===2?'#fb923c':'var(--text-secondary)' }}>#{i+1}</td>
                        <td>{l.student_name}</td><td style={{ fontWeight: 700 }}>{l.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {['Announcements', 'Faculty', 'Exams'].includes(activeTab) && (
              <div className="dashboard-grid">
                {data.map(item => (
                  <div key={item.id} className="feature-item-card">
                    <h4>{item.title || item.name}</h4>
                    <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>{item.description || item.department || item.subject_name}</p>
                    <div className="fi-meta" style={{ marginTop: '12px' }}>
                      {item.date_time && <><Clock size={12} style={{ display:'inline', marginRight:'2px' }}/> {new Date(item.date_time).toLocaleDateString()}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      {showModal === 'Complaint' && (
        <Modal title="Log Official Complaint" actionLabel="Submit Complaint" onClose={() => setShowModal(null)} onAction={handleCreateComplaint}>
          <div className="erp-form">
             <label>Title <input type="text" onChange={e => GenericChange('title', e.target.value)} /></label>
             <label>Description <textarea rows={3} onChange={e => GenericChange('description', e.target.value)}></textarea></label>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
               <label>Level
                 <select onChange={e => GenericChange('level', e.target.value)}>
                   <option value="Classroom">Classroom</option>
                   <option value="Department">Department</option>
                   <option value="College">College</option>
                 </select>
               </label>
               <label>Urgency
                 <select onChange={e => GenericChange('urgency', e.target.value)}>
                   <option value="Low">Low</option>
                   <option value="Medium">Medium</option>
                   <option value="High">High</option>
                   <option value="Critical">Critical</option>
                 </select>
               </label>
             </div>
             <label>Category
                 <select onChange={e => GenericChange('category', e.target.value)}>
                   <option value="Infrastructure">Infrastructure</option>
                   <option value="Academics">Academics</option>
                   <option value="Administration">Administration</option>
                   <option value="Other">Other</option>
                 </select>
               </label>
          </div>
        </Modal>
      )}

      {showModal === 'LostFound' && (
        <Modal title="Report Lost or Found Item" actionLabel="Report Item" onClose={() => setShowModal(null)} onAction={handleCreateItem}>
          <div className="erp-form">
             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
               <label>Item Type
                 <select onChange={e => GenericChange('item_type', e.target.value)}>
                   <option value="Lost">I Lost Something</option>
                   <option value="Found">I Found Something</option>
                 </select>
               </label>
             </div>
             <label>Item Name <input type="text" onChange={e => GenericChange('item_name', e.target.value)} /></label>
             <label>Description (Color, brand, etc.) <textarea rows={2} onChange={e => GenericChange('description', e.target.value)}></textarea></label>
             <label>Location (where lost/found) <input type="text" onChange={e => GenericChange('location', e.target.value)} /></label>
          </div>
        </Modal>
      )}

      {showModal === 'Note' && (
        <Modal title="Upload Shared Notes" actionLabel="Share Notes" onClose={() => setShowModal(null)} onAction={handleCreateNote}>
          <div className="erp-form">
             <label>Subject ID <input type="number" onChange={e => GenericChange('subject_id', e.target.value)} /></label>
             <label>Title / Topic <input type="text" onChange={e => GenericChange('title', e.target.value)} /></label>
             <label>Content (or Markdown link) <textarea rows={4} onChange={e => GenericChange('content', e.target.value)}></textarea></label>
          </div>
        </Modal>
      )}

    </ErpLayout>
  )
}
