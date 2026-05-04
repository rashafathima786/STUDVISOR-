import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ClassroomStream from '../../components/faculty/ClassroomStream'
import { fetchFacultyDashboard, fetchFacultyTimetable, fetchFacultyPendingLeaves, fetchAttendanceDefaulters, fetchMySubjects, fetchFacultyAssignments } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import { 
  Users, ClipboardList, PenTool, AlertTriangle, 
  BookOpen, ArrowRight, Plus, Calendar,
  TrendingUp, CheckCircle2, MessageSquare, FileText,
  Sparkles, Clock
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function FacultyDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchFacultyDashboard().catch(() => null),
      fetchFacultyTimetable().catch(() => ({ timetable: [] })),
      fetchFacultyPendingLeaves().catch(() => ({ pending: [] })),
      fetchAttendanceDefaulters().catch(() => ({ defaulters: [] })),
      fetchMySubjects().catch(() => ({ subjects: [] })),
      fetchFacultyAssignments().catch(() => ({ assignments: [] })),
    ]).then(([dash, tt, leaves, defs, subjs, assns]) => {
      setDashboard(dash)
      setTimetable(tt?.timetable || [])
      setPendingLeaves(leaves?.pending || [])
      setDefaulters(defs?.defaulters || [])
      setSubjects(subjs?.subjects || [])
      setAssignments(assns?.assignments || [])
      setLoading(false)
    })
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todaySlots = timetable.filter(s => s.day === today)

  if (loading) {
    return (
      <ErpLayout title="Faculty Command" subtitle="Initializing secure session...">
        <div className="bento-grid">
          <div className="bento-tile bento-span-2 bento-row-span-2"><SkeletonLoader variant="card" /></div>
          <div className="bento-tile bento-span-2"><SkeletonLoader variant="card" /></div>
          <div className="bento-tile"><SkeletonLoader variant="card" /></div>
          <div className="bento-tile"><SkeletonLoader variant="card" /></div>
        </div>
      </ErpLayout>
    )
  }

  return (
    <ErpLayout
      title={`Welcome, ${dashboard?.name || 'Faculty'}`}
      subtitle={`${dashboard?.department || 'Academic'} Department • Node Active`}
    >
      {/* Quick Stats Row */}
      <div className="quick-stats-row">
        <div className="stat-card">
          <span className="stat-label">Teaching Load</span>
          <span className="stat-value">{dashboard?.subjects_count || 0} Subjects</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Reviews</span>
          <span className="stat-value text-primary">{pendingLeaves.length} Leaves</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">At-Risk Students</span>
          <span className="stat-value text-error">{defaulters.length} Defaulters</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">System Status</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-bold text-tertiary uppercase tracking-widest">Operational</span>
          </div>
        </div>
      </div>

      <div className="bento-grid">
        
        {/* Today's Schedule - Large Bento Tile */}
        <div className="bento-tile bento-span-2 bento-row-span-2 glass-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-primary/20 text-primary">
              <Calendar size={20} />
            </div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Today's Sessions</span>
              <span className="hub-tile-desc text-on-surface-variant/50">{todaySlots.length} Classes scheduled</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/faculty/timetable" className="bento-task-action primary">View Full</Link>
            </div>
          </div>
          
          <div className="bento-internal-scroll mt-6 space-y-3">
            {todaySlots.length > 0 ? todaySlots.map((slot, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="mini-status-item p-4 bg-surface-container border border-border-color flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {slot.hour}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{slot.subject}</div>
                    <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{slot.room} • {slot.section}</div>
                  </div>
                </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={() => {
                        localStorage.setItem('faculty_preselect_subject', slot.subject_id)
                        window.location.href = '/faculty/attendance'
                      }}
                      className="mini-tag primary cursor-pointer"
                    >
                      Mark
                    </button>
                    <button 
                      onClick={() => {
                        localStorage.setItem('faculty_preselect_subject', slot.subject_id)
                        window.location.href = '/faculty/marks'
                      }}
                      className="mini-tag secondary cursor-pointer"
                    >
                      Grade
                    </button>
                  </div>
              </motion.div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/20 py-12">
                <CheckCircle2 size={48} className="mb-4 opacity-10" />
                <span className="text-sm font-bold uppercase tracking-widest">No classes today</span>
              </div>
            )}
          </div>
        </div>

        <div 
          className="bento-tile group cursor-pointer hover:border-error/50 transition-all" 
          style={{ borderColor: defaulters.length > 0 ? 'rgba(239,68,68,0.2)' : 'var(--panel-border)' }}
          onClick={() => window.location.href = '/faculty/attendance'}
        >
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-error/20 text-error">
              <AlertTriangle size={20} />
            </div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">At-Risk Students</span>
              <span className="hub-tile-desc text-error font-bold">{defaulters.length} Below Threshold</span>
            </div>
          </div>
          {defaulters.length > 0 && (
            <div className="mt-4 flex -space-x-2">
              {defaulters.slice(0, 5).map((d, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-error/20 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-error">
                  {d.student?.[0]}
                </div>
              ))}
              {defaulters.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-surface-container border-2 border-surface flex items-center justify-center text-[10px] font-bold text-on-surface-variant/40">
                  +{defaulters.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions Hub - Span 2 */}
        <div className="bento-tile bento-span-2" style={{ background: 'var(--surface-container)' }}>
          <div className="hub-tile-header mb-4">
             <div className="hub-tile-title">
              <span className="hub-tile-label">Quick Actions</span>
              <span className="hub-tile-desc uppercase tracking-widest text-[10px] font-bold text-on-surface-variant/20">Operational Shortcuts</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Link to="/faculty/attendance" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-container border border-border-color hover:bg-primary/10 hover:border-primary/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><ClipboardList size={20} /></div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Attendance</span>
            </Link>
            <Link to="/faculty/marks" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-container border border-border-color hover:bg-secondary/10 hover:border-secondary/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Grade Upload</span>
            </Link>
            <Link to="/faculty/lecture-logs" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-container border border-border-color hover:bg-tertiary/10 hover:border-tertiary/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform"><BookOpen size={20} /></div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Diary</span>
            </Link>
            <Link to="/faculty/assignments" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-container border border-border-color hover:bg-info/10 hover:border-info/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info group-hover:scale-110 transition-transform"><FileText size={20} /></div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Tasks</span>
            </Link>
            <Link to="/faculty/leaves" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-container border border-border-color hover:bg-warning/10 hover:border-warning/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning group-hover:scale-110 transition-transform"><Users size={20} /></div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">Approvals</span>
            </Link>
          </div>
        </div>

        {/* Classroom Stream - Full Width Span */}
        <div className="bento-tile bento-span-4" style={{ padding: 0, overflow: 'hidden', minHeight: 'auto' }}>
           <ClassroomStream subjects={subjects} assignments={assignments} />
        </div>

      </div>
    </ErpLayout>
  )
}
