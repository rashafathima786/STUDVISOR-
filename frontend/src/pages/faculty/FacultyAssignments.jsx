import { useState, useEffect } from 'react'
import { fetchFacultyAssignments, createFacultyAssignment, checkPlagiarism, fetchMySubjects } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { Plus, Book, Clock, Users, ShieldAlert, FileText, Send, Calendar, AlertTriangle, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ subject_id: '', title: '', description: '', due_date: '', max_marks: '100' })
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    Promise.all([
      fetchFacultyAssignments().catch(() => ({ assignments: [] })),
      fetchMySubjects().catch(() => ({ subjects: [] }))
    ]).then(([resA, resS]) => {
      setAssignments(resA?.assignments || [])
      setSubjects(resS?.subjects || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newAssignment.subject_id || !newAssignment.title) {
      toast.warning('Subject and Title are required')
      return
    }
    setSubmitting(true)
    try {
      await createFacultyAssignment({
        ...newAssignment,
        subject_id: parseInt(newAssignment.subject_id),
        max_marks: parseFloat(newAssignment.max_marks)
      })
      toast.success('Assignment published successfully')
      setShowCreate(false)
      setNewAssignment({ subject_id: '', title: '', description: '', due_date: '', max_marks: '100' })
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlagiarismCheck = async (id) => {
    setCheckingPlagiarism(id)
    try {
      const res = await checkPlagiarism(id)
      if (res.suspicious_pairs && res.suspicious_pairs.length > 0) {
        toast.warning(`Detected ${res.suspicious_pairs.length} suspicious submission pairs!`)
      } else {
        toast.success('No significant plagiarism detected.')
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Scan failed')
    } finally {
      setCheckingPlagiarism(null)
    }
  }

  return (
    <ErpLayout title="Curriculum & Evaluation" subtitle="Design assessments and audit academic integrity">
      
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant/30 flex items-center gap-2">
            <Book size={14} /> Academic Tasks ({assignments.length})
         </h3>
         <button 
          onClick={() => setShowCreate(true)}
          className="px-6 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
         >
           <Plus size={16} /> New Assessment
         </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card glass-panel mb-8 border-border-color bg-surface-container"
          >
            <form onSubmit={handleCreate} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest px-1">Subject Node</label>
                     <div className="relative">
                        <select 
                          className="w-full bg-surface-container border border-border-color rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary/50 outline-none transition-all appearance-none"
                          value={newAssignment.subject_id}
                          onChange={e => setNewAssignment({...newAssignment, subject_id: e.target.value})}
                          required
                        >
                          <option value="" className="bg-surface">Select Subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id} className="bg-surface">
                              {s.code} - {s.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/20">
                           <BookOpen size={14} />
                        </div>
                     </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest px-1">Assignment Title</label>
                     <input 
                      type="text" 
                      className="w-full bg-surface-container border border-border-color rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary/50 outline-none transition-all"
                      placeholder="e.g. Mid-term Research Paper"
                      value={newAssignment.title}
                      onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest px-1">Detailed Instructions</label>
                  <textarea 
                    className="w-full bg-surface-container border border-border-color rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary/50 outline-none transition-all min-h-[100px]"
                    placeholder="Provide context, resources, and evaluation criteria..."
                    value={newAssignment.description}
                    onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest px-1">Deadline Date</label>
                     <div className="relative">
                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/20" />
                        <input 
                          type="date" 
                          className="w-full bg-surface-container border border-border-color rounded-xl pl-12 pr-4 py-3 text-on-surface text-sm focus:border-primary/50 outline-none transition-all"
                          value={newAssignment.due_date}
                          onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest px-1">Evaluation Scale (Max Marks)</label>
                     <input 
                      type="number" 
                      className="w-full bg-surface-container border border-border-color rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary/50 outline-none transition-all"
                      value={newAssignment.max_marks}
                      onChange={e => setNewAssignment({...newAssignment, max_marks: e.target.value})}
                     />
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreate(false)}
                    className="px-6 py-2.5 rounded-xl bg-surface-container text-on-surface-variant/40 text-[10px] font-black uppercase tracking-widest hover:bg-on-surface/[0.05] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-8 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    {submitting ? 'Publishing...' : 'Deploy Assignment'}
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <SkeletonLoader variant="card" count={4} />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState title="Repository Empty" description="No assignments have been deployed yet." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {assignments.map((a, idx) => (
             <motion.div
               key={a.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="card glass-panel p-6 border-border-color bg-surface-container group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
                
                <div className="flex items-start justify-between mb-6">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <FileText size={14} className="text-primary" />
                         <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-widest">Assignment #{a.id}</span>
                      </div>
                      <h4 className="text-lg font-bold text-on-surface leading-tight">{a.title}</h4>
                   </div>
                   <div className="text-right">
                      <div className="flex items-center gap-1.5 text-success/80 font-black text-[10px] uppercase tracking-widest mb-1">
                         <Users size={12} />
                         {a.submissions} Submissions
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant/30 text-[10px] font-bold uppercase tracking-widest">
                         <Clock size={12} />
                         Due: {a.due}
                      </div>
                   </div>
                </div>

                <div className="flex gap-3 mt-8">
                   <button 
                    className="flex-1 h-11 rounded-xl bg-surface-container border border-border-color text-on-surface text-[10px] font-black uppercase tracking-widest hover:bg-on-surface/[0.05] transition-all flex items-center justify-center gap-2"
                   >
                      <Send size={14} /> View Submissions
                   </button>
                   <button 
                    className={`px-4 h-11 rounded-xl border transition-all flex items-center justify-center gap-2 
                      ${checkingPlagiarism === a.id 
                        ? 'bg-warning/20 border-warning/30 text-warning cursor-wait' 
                        : 'bg-error/10 border-error/20 text-error hover:bg-error hover:text-white'}`}
                    onClick={() => handlePlagiarismCheck(a.id)}
                    disabled={checkingPlagiarism === a.id}
                    title="Run Plagiarism Scan"
                   >
                      <ShieldAlert size={16} className={checkingPlagiarism === a.id ? 'animate-pulse' : ''} />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Audit</span>
                   </button>
                </div>

                <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-1 text-[8px] font-bold text-on-surface-variant/10 uppercase tracking-widest">
                      AI Guard Enabled <AlertTriangle size={8} />
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      )}
    </ErpLayout>
  )
}
