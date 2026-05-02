import { useState, useEffect } from 'react'
import { fetchFacultyLectureLogs, createLectureLog, fetchFacultyTimetable, fetchMySubjects } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { BookOpen, History, Plus, Send, Clock, Book, Hash, Calendar, Layers, PenTool, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyLectureLog() {
  const [logs, setLogs] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    subject_id: '',
    date: new Date().toISOString().split('T')[0],
    hour: 1,
    topic_covered: '',
    methodology: 'Lecture',
    remarks: ''
  })
  
  const toast = useToast()

  useEffect(() => {
    loadData()
    fetchMySubjects().then(res => setSubjects(res.subjects || []))
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const logsRes = await fetchFacultyLectureLogs()
      setLogs(logsRes?.logs || [])
      setLoading(false)
    } catch (err) {
      toast.error("Failed to load lecture logs")
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subject_id || !formData.topic_covered) {
      toast.warning("Please fill all required fields")
      return
    }
    
    setSubmitting(true)
    try {
      await createLectureLog({
        ...formData,
        subject_id: parseInt(formData.subject_id),
        hour: parseInt(formData.hour)
      })
      toast.success("Lecture log recorded successfully")
      setShowForm(false)
      setFormData({
        ...formData,
        topic_covered: '',
        remarks: ''
      })
      loadData()
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to record log")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ErpLayout title="Lecture Registry" subtitle="Digital session logging and curriculum coverage tracker">
      
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant/30 flex items-center gap-2">
          <History size={14} /> Session History ({logs.length})
        </h3>
        <button 
          className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg
            ${showForm ? 'bg-surface-container text-on-surface-variant/40' : 'bg-primary text-white shadow-primary/20'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Close Editor' : <><Plus size={16} /> New Entry</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card glass-panel mb-8 border-primary/20 bg-surface-container p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="relative group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2 group-focus-within:text-primary transition-colors">Select Subject</label>
                    <BookOpen size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                    <select 
                      className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                      value={formData.subject_id}
                      onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      required
                    >
                      <option value="">Choose subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Date</label>
                    <Calendar size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                    <input 
                      type="date" 
                      className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Hour</label>
                    <Clock size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                    <select 
                      className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                      value={formData.hour}
                      onChange={(e) => setFormData({...formData, hour: e.target.value})}
                    >
                      {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>Hour {h}</option>)}
                    </select>
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Methodology</label>
                    <Layers size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                    <select 
                      className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                      value={formData.methodology}
                      onChange={(e) => setFormData({...formData, methodology: e.target.value})}
                    >
                      <option value="Lecture">Lecture</option>
                      <option value="PPT">Presentation</option>
                      <option value="Demo">Demonstration</option>
                      <option value="Seminar">Student Seminar</option>
                      <option value="Group Discussion">Group Discussion</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2 relative group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 px-1">Detailed Coverage / Topics</label>
                  <textarea 
                    className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none min-h-[120px]" 
                    placeholder="Describe technical concepts and modules discussed..."
                    value={formData.topic_covered}
                    onChange={(e) => setFormData({...formData, topic_covered: e.target.value})}
                    required
                  />
               </div>

               <div className="space-y-2 relative group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 px-1">Academic Remarks</label>
                  <input 
                    type="text" 
                    className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none" 
                    placeholder="Student engagement, missed objectives, etc."
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  />
               </div>

               <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    className="primary-btn h-[52px] px-10 flex items-center gap-3 shadow-[0_10px_20px_rgba(124,58,237,0.3)]"
                    disabled={submitting}
                  >
                    <Send size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">{submitting ? 'Recording...' : 'Commit to Log'}</span>
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card glass-panel p-0 overflow-hidden border-border-color bg-surface-container">
        {loading ? (
          <div className="p-8"><SkeletonLoader variant="table-row" count={5} /></div>
        ) : logs.length === 0 ? (
          <div className="p-20"><EmptyState title="Logbook Vacant" description="No academic sessions have been recorded in the current cycle." /></div>
        ) : (
          <div className="table-wrapper">
            <table className="w-full">
              <thead>
                <tr className="bg-on-surface/[0.01]">
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">Timeline</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">Curriculum</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">Context & Topics</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">Modality</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t border-border-color group hover:bg-on-surface/[0.02] transition-colors"
                  >
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-container border border-border-color flex flex-col items-center justify-center">
                             <span className="text-[10px] font-black text-primary leading-none">{log.hour}</span>
                             <span className="text-[6px] font-black text-on-surface-variant/30 uppercase">Hr</span>
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant/60">{log.date}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{log.subject}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">{log.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6" style={{ maxWidth: '400px' }}>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed mb-1">{log.topic_covered}</p>
                      {log.remarks && (
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/30 italic">
                           <PenTool size={10} /> {log.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="px-3 py-1 rounded-lg bg-info/10 border border-info/20 text-info text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                        <CheckCircle2 size={10} /> {log.methodology}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErpLayout>
  )
}
