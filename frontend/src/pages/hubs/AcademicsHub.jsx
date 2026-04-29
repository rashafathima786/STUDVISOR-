import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  fetchAssignments, 
  submitAssignment, 
  fetchTodaySchedule, 
  fetchSyllabus, 
  fetchUpcomingExams, 
  fetchNotes, 
  fetchStudentLectureLogs 
} from '../../services/api'

export default function AcademicsHub() {
  const [assignments, setAssignments] = useState([])
  const [schedule, setSchedule] = useState([])
  const [syllabus, setSyllabus] = useState([])
  const [exams, setExams] = useState([])
  const [notes, setNotes] = useState([])
  const [logs, setLogs] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadAllData() {
      try {
        const [assignData, schedData, syllData, examData, notesData, logsData] = await Promise.all([
          fetchAssignments(),
          fetchTodaySchedule(),
          fetchSyllabus(),
          fetchUpcomingExams(),
          fetchNotes(),
          fetchStudentLectureLogs()
        ])
        
        setAssignments(Array.isArray(assignData) ? assignData : (assignData?.assignments || []))
        setSchedule(Array.isArray(schedData) ? schedData : (schedData?.timetable || []))
        setSyllabus(Array.isArray(syllData) ? syllData : (syllData?.syllabus || []))
        setExams(Array.isArray(examData) ? examData : (examData?.upcoming || examData?.exams || []))
        setNotes(Array.isArray(notesData) ? notesData : (notesData?.notes || []))
        setLogs(Array.isArray(logsData) ? logsData : (logsData?.logs || []))
        
      } catch (err) {
        console.error("Failed to load hub data", err)
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  const handleSubmit = async (id) => {
    try {
      await submitAssignment(id)
      const data = await fetchAssignments()
      setAssignments(Array.isArray(data) ? data : (data?.assignments || []))
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.message || err.message))
    }
  }

  // Helper for syllabus progress
  const calculateTotalProgress = () => {
    if (!syllabus.length) return 0
    return 65
  }

  return (
    <ErpLayout title="Academics" subtitle="Manage your academic journey">
      <div className="bento-grid">
        
        {/* Assignments - Large Bento Tile */}
        <div className="bento-tile bento-span-2 bento-row-span-2" style={{ cursor: 'default' }}>
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">📝</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Assignments</span>
              <span className="hub-tile-desc text-on-surface-variant/80">Submit & track work</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/assignments" className="bento-task-action primary px-4 py-2">View All</Link>
            </div>
          </div>
          <div className="bento-internal-scroll mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 opacity-40 italic text-xs uppercase tracking-widest">
                Retrieving assignments...
              </div>
            ) : assignments.length > 0 ? (
              assignments.slice(0, 4).map((item) => (
                <div key={item.id} className="bento-task-item">
                  <div className="bento-task-info">
                    <span className="bento-task-title text-on-surface">{item.title}</span>
                    <span className={`bento-task-meta font-semibold ${item.submitted ? 'text-emerald-400' : 'text-primary/70'}`}>
                      {item.submitted ? '✓ Submitted' : `Due: ${item.due_date}`}
                    </span>
                  </div>
                  {item.submitted ? (
                    <button className="bento-task-action" onClick={() => setSelectedTask(item)}>Details</button>
                  ) : item.title.toLowerCase().includes('quiz') ? (
                    <button className="bento-task-action primary" onClick={() => navigate(`/exams`)}>Take Quiz</button>
                  ) : (
                    <button className="bento-task-action primary" onClick={() => handleSubmit(item.id)}>Submit</button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <span className="material-symbols-outlined text-4xl mb-2">assignment_turned_in</span>
                <p className="text-xs uppercase tracking-widest">No pending assignments</p>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        <AnimatePresence>
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTask(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-panel w-full max-w-lg p-8 rounded-[40px] relative z-10 border border-white/10 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{selectedTask.title}</h3>
                      <p className="text-primary/70 text-xs font-black uppercase tracking-widest">{selectedTask.subject}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-white/40">close</span>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                    <p className="text-on-surface-variant/80 text-sm leading-relaxed">
                      {selectedTask.description || "No description provided for this assignment."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Max Marks</p>
                      <p className="text-xl font-bold text-white">{selectedTask.max_marks || 100}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-xl font-bold text-emerald-400">Verified</p>
                    </div>
                  </div>

                  {selectedTask.submitted_at && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-400/5 border border-emerald-400/10">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                      <p className="text-[11px] font-medium text-emerald-400/80">
                        Submitted on {new Date(selectedTask.submitted_at).toLocaleDateString()} at {new Date(selectedTask.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedTask(null)}
                  className="w-full mt-8 py-4 rounded-2xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  Close View
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Timetable - Wide Bento Tile */}
        <Link to="/timetable" className="bento-tile bento-span-2 glass-panel-accent">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-primary/20">📅</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Today's Schedule</span>
              <span className="hub-tile-desc text-white/70">Your classes for today</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '8px' }}>
            <div className="mini-status-list space-y-3">
              {!loading && schedule.length > 0 ? schedule.slice(0, 3).map((slot, i) => (
                <div key={i} className="mini-status-item p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <span className={`mini-tag ${i % 2 === 0 ? 'violet' : 'blue'} w-[80px] text-center shadow-lg`}>H-{slot.hour}</span>
                  <span className="text-white font-bold ml-4">{slot.subject}</span>
                  <span className="ml-auto text-xs font-bold text-on-surface-variant/40 tracking-widest uppercase">{slot.room}</span>
                </div>
              )) : (
                <div className="w-full flex flex-col items-center justify-center py-6 opacity-40">
                   <p className="text-xs uppercase tracking-widest">No classes today</p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Syllabus Tracker */}
        <Link to="/syllabus" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-tertiary/20">📊</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Syllabus Tracker</span>
              <span className="hub-tile-desc text-tertiary font-bold">Overall Progress: {calculateTotalProgress()}%</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
             <div className="seg-progress" style={{ height: '10px', gap: '6px' }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className={`seg-block h-[10px] ${i <= 5 ? 'seg-block--filled green shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'opacity-20'}`}></div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              {syllabus.slice(0, 2).map((s, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 truncate max-w-[120px]">
                  {s.subject}: <span className={i === 0 ? "text-tertiary" : "text-secondary"}>80%</span>
                </span>
              ))}
            </div>
          </div>
        </Link>

        {/* Upcoming Exams */}
        <Link to="/exams" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-error/10">📖</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Exams</span>
              <span className="hub-tile-desc text-error/80 font-bold uppercase tracking-widest text-[10px]">
                {exams.length > 0 ? `${exams.length} Upcoming` : 'No Exams'}
              </span>
            </div>
          </div>
          <div className="hub-tile-preview mt-4">
            <div className="mini-status-list space-y-2">
              {exams.length > 0 ? exams.slice(0, 2).map((exam, i) => (
                <div key={i} className="mini-status-item flex items-center gap-3">
                  <div className="mini-dot warning shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                  <span className="text-sm font-semibold text-on-surface truncate">{exam.subject}</span>
                </div>
              )) : (
                <span className="text-sm text-on-surface-variant/40">Schedule not released</span>
              )}
            </div>
          </div>
        </Link>

        {/* Study Resources */}
        <Link to="/notes" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-secondary/10">📄</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Resources</span>
              <span className="hub-tile-desc text-secondary/80 font-bold uppercase tracking-widest text-[10px]">
                {notes.length} New Materials
              </span>
            </div>
          </div>
          <div className="hub-tile-preview mt-4">
             <div className="mini-status-list space-y-2">
              {notes.length > 0 ? notes.slice(0, 2).map((note, i) => (
                <div key={i} className="mini-status-item flex items-center gap-3">
                  <div className="mini-dot active shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-sm font-semibold text-on-surface truncate">{note.title}</span>
                </div>
              )) : (
                <span className="text-sm text-on-surface-variant/40">No recent uploads</span>
              )}
            </div>
          </div>
        </Link>

        {/* Lecture Logs */}
        <Link to="/lecture-logs" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-info/10">📓</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Lecture Logs</span>
              <span className="hub-tile-desc text-info/80 font-bold uppercase tracking-widest text-[10px]">Session Topics</span>
            </div>
          </div>
          <div className="hub-tile-preview mt-4">
             <div className="mini-status-list space-y-2">
              <div className="mini-status-item flex items-center gap-3">
                <div className="mini-dot active shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-sm font-semibold text-on-surface">Browse Session Data</span>
              </div>
            </div>
          </div>
        </Link>

      </div>
    </ErpLayout>
  )
}
