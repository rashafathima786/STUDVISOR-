import { useState, useEffect } from 'react'
import { markAttendance, fetchStudentsBySubject, fetchMySubjects, fetchExistingAttendance } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { UserCheck, Search, Save, Calendar, Clock, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyAttendance() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hour, setHour] = useState(1)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchMySubjects()
      .then(res => {
        const subjs = res.subjects || []
        setSubjects(subjs)
        const preselect = localStorage.getItem('faculty_preselect_subject')
        if (preselect) {
          setSubjectId(preselect)
          localStorage.removeItem('faculty_preselect_subject')
        } else if (subjs.length > 0) {
          setSubjectId(subjs[0].id)
        }
      })
      .catch(() => toast.error("Failed to load subjects"))
  }, [])

  const loadStudents = async (sid) => {
    if (!sid) {
      setStudents([])
      return
    }
    setLoading(true)
    try {
      const [studentsRes, existingRes] = await Promise.all([
        fetchStudentsBySubject(sid),
        fetchExistingAttendance(sid, date, hour).catch(() => ({ attendance: {} }))
      ])
      
      const list = studentsRes?.students || []
      setStudents(list)
      
      const existingMap = existingRes?.attendance || {}
      const init = {}
      list.forEach((s) => (init[s.id] = existingMap[s.id] || 'P'))
      setAttendance(init)
    } catch (err) {
      toast.error("Failed to load students for this subject")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents(subjectId)
  }, [subjectId, date, hour])

  const toggleStatus = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'P' ? 'A' : prev[studentId] === 'A' ? 'DL' : 'P',
    }))
  }

  const setAll = (status) => {
    const next = {}
    students.forEach((s) => (next[s.id] = status))
    setAttendance(next)
    toast.info(`Set all to ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Duty Leave'}`)
  }

  const handleSubmit = async () => {
    if (!subjectId) {
      toast.warning('Please select a Subject')
      return
    }
    setSubmitting(true)
    try {
      const entries = Object.entries(attendance).map(([sid, status]) => ({
        student_id: parseInt(sid),
        status,
      }))
      await markAttendance({
        subject_id: parseInt(subjectId),
        date,
        hour,
        entries,
      })
      toast.success(`Attendance recorded for ${entries.length} students`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to record attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.username?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    P: Object.values(attendance).filter(v => v === 'P').length,
    A: Object.values(attendance).filter(v => v === 'A').length,
    DL: Object.values(attendance).filter(v => v === 'DL').length
  }

  return (
    <ErpLayout title="Attendance Terminal" subtitle="Session tracking and student roster management">
      
      {/* Session Controls Header */}
      <div className="card glass-panel mb-8 sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-border-color p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex flex-1 gap-4 w-full">
            <div className="flex-1 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Subject</label>
              <div className="relative">
                <BookOpen size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                <select
                  className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  <option value="">Choose a subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                <input
                  type="date"
                  className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="w-32 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Hour</label>
              <div className="relative">
                <Clock size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                <select
                  className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
             <button 
              className="bg-primary hover:bg-primary-container text-white h-[58px] px-8 flex-1 lg:flex-none flex items-center justify-center gap-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-95"
              onClick={handleSubmit}
              disabled={submitting || !subjectId}
             >
               <Save size={18} />
               <span>{submitting ? 'RECORDING...' : 'COMMIT LOGS'}</span>
             </button>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border-color items-center">
           <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-tertiary/10 border border-tertiary/20">
                 <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">Present: {stats.P}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-error/10 border border-error/20">
                 <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-error">Absent: {stats.A}</span>
              </div>
           </div>
           
           <div className="flex gap-2">
               <button onClick={() => setAll('P')} className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all">Mark All Present</button>
               <button onClick={() => setAll('A')} className="px-4 py-2 rounded-xl bg-on-surface/5 border border-border-color text-on-surface-variant text-[8px] font-black uppercase tracking-widest hover:bg-on-surface/10 transition-all">Mark All Absent</button>
               <button 
                onClick={() => {
                  const init = {}
                  students.forEach(s => init[s.id] = 'P')
                  setAttendance(init)
                  toast.info("Reset to default (Present)")
                }} 
                className="px-4 py-2 rounded-xl bg-on-surface/5 border border-border-color text-on-surface-variant text-[8px] font-black uppercase tracking-widest hover:bg-on-surface/10 transition-all"
               >
                Reset
               </button>
            </div>

           <div className="ml-auto relative w-full lg:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/20" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full bg-surface-container border border-border-color rounded-xl py-2.5 pl-9 pr-4 text-xs text-on-surface focus:border-primary/30 outline-none transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <SkeletonLoader key={i} variant="card" />)}
        </div>
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredStudents.map((student, idx) => {
              const status = attendance[student.id]
              return (
                <motion.div 
                  key={student.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className={`card glass-panel p-6 border-border-color relative group cursor-pointer transition-all hover:scale-[1.02] ${
                    status === 'P' ? 'bg-tertiary/5 border-tertiary/20 shadow-lg shadow-tertiary/5' : 
                    status === 'A' ? 'bg-error/5 border-error/20 shadow-lg shadow-error/5' : 
                    'bg-secondary/5 border-secondary/20 shadow-lg shadow-secondary/5'
                  }`}
                  onClick={() => toggleStatus(student.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${
                      status === 'P' ? 'bg-tertiary text-white shadow-lg shadow-tertiary/20' : 
                      status === 'A' ? 'bg-error text-white shadow-lg shadow-error/20' : 
                      'bg-secondary text-white shadow-lg shadow-secondary/20'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-on-surface truncate">{student.name}</div>
                      <div className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-widest">{student.username}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      status === 'P' ? 'bg-tertiary/20 text-tertiary' : 
                      status === 'A' ? 'bg-error/20 text-error' : 
                      'bg-secondary/20 text-secondary'
                    }`}>
                      {status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'DL'}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState 
          icon={<UserCheck size={48} className="text-on-surface-variant/10" />}
          title="Roster Offline"
          description={subjectId ? "No students found for this subject." : "Select a subject from the command bar to initialize the roster."}
        />
      )}
    </ErpLayout>
  )
}
