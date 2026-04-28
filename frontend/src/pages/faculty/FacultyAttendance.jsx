import { useState, useEffect } from 'react'
import { markAttendance, fetchAllStudents } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { UserCheck, Check, X, RotateCcw, Search, Save, Calendar, Clock, Hash } from 'lucide-react'
import { motion } from 'framer-motion'

export default function FacultyAttendance() {
  const [students, setStudents] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hour, setHour] = useState(1)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchAllStudents()
      .then((res) => {
        const list = res?.students || []
        setStudents(list)
        // Initialize all as Present
        const init = {}
        list.forEach((s) => (init[s.id] = 'P'))
        setAttendance(init)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
      toast.warning('Please enter a Subject ID')
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
      <div className="card glass-panel mb-8 sticky top-0 z-20 bg-[#0a0a0e]/80 backdrop-blur-xl border-white/10">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          
          <div className="flex flex-1 gap-4 w-full">
            <div className="flex-1 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 absolute left-4 top-2 group-focus-within:text-primary transition-colors">Subject ID</label>
              <div className="relative">
                <Hash size={16} className="absolute left-4 top-[34px] text-white/20" />
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pt-8 pb-4 pl-12 pr-4 text-white text-sm focus:border-primary/50 transition-all outline-none"
                  placeholder="e.g. 1"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 absolute left-4 top-2">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-[34px] text-white/20" />
                <input
                  type="date"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pt-8 pb-4 pl-12 pr-4 text-white text-sm focus:border-primary/50 transition-all outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="w-32 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 absolute left-4 top-2">Hour</label>
              <div className="relative">
                <Clock size={16} className="absolute left-4 top-[34px] text-white/20" />
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pt-8 pb-4 pl-12 pr-4 text-white text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button className="px-4 py-2 text-[10px] font-bold text-success hover:bg-success/10 rounded-lg transition-all" onClick={() => setAll('P')}>PRESENT</button>
                <div className="w-[1px] bg-white/5 mx-1" />
                <button className="px-4 py-2 text-[10px] font-bold text-error hover:bg-error/10 rounded-lg transition-all" onClick={() => setAll('A')}>ABSENT</button>
             </div>
             <button 
              className="primary-btn h-[58px] px-8 flex items-center gap-3 shadow-[0_10px_20px_rgba(124,58,237,0.3)]"
              onClick={handleSubmit}
              disabled={submitting}
             >
               <Save size={18} />
               <span>{submitting ? 'RECORDING...' : 'COMMIT LOGS'}</span>
             </button>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="flex gap-8 mt-6 pt-6 border-t border-white/5">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Present: <span className="text-white">{stats.P}</span></span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Absent: <span className="text-white">{stats.A}</span></span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-info shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Duty Leave: <span className="text-white">{stats.DL}</span></span>
           </div>
           <div className="ml-auto relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-white/10 outline-none transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Student Roster */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <SkeletonLoader variant="card" count={6} />
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState title="Roster Empty" description="No students found matching your criteria." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((s, idx) => {
            const status = attendance[s.id] || 'P'
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={`card glass-panel group relative overflow-hidden p-6 border-white/5 hover:border-white/20 transition-all cursor-pointer ${status === 'A' ? 'bg-error/5 border-error/20' : status === 'DL' ? 'bg-info/5 border-info/20' : 'bg-white/[0.02]'}`}
                onClick={() => toggleStatus(s.id)}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${status === 'P' ? 'bg-success/10 text-success' : status === 'A' ? 'bg-error/20 text-error' : 'bg-info/10 text-info'}`}>
                      {s.name?.[0]}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{s.name}</div>
                      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{s.username || `STU-${s.id}`}</div>
                   </div>
                   <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${status === 'P' ? 'bg-success/20 text-success' : status === 'A' ? 'bg-error text-white' : 'bg-info text-white'}`}>
                      {status === 'P' ? 'PRESENT' : status === 'A' ? 'ABSENT' : 'DL'}
                   </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
                   <span>{s.department}</span>
                   <span>Sem {s.semester}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </ErpLayout>
  )
}
