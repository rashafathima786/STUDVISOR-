import { useState, useEffect } from 'react'
import { uploadMarks, publishMarks, fetchMySubjects, fetchStudentsBySubject } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { Upload, Send, Plus, Trash2, Hash, BookOpen, Layers, BarChart3, Save, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyMarks() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [assessmentType, setAssessmentType] = useState('CAT-1')
  const [semester, setSemester] = useState('1')
  const [entries, setEntries] = useState({}) // {student_id: {marks: '', max: '100'}}
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchMySubjects().then(res => setSubjects(res.subjects || []))
  }, [])

  useEffect(() => {
    if (subjectId) {
      setLoading(true)
      fetchStudentsBySubject(subjectId)
        .then(res => {
          const list = res.students || []
          setStudents(list)
          const init = {}
          list.forEach(s => init[s.id] = { marks: '', max: '100' })
          setEntries(init)
        })
        .finally(() => setLoading(false))
    }
  }, [subjectId])

  const updateEntry = (sid, field, value) => {
    setEntries(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [field]: value }
    }))
  }

  const addRow = () => {
    const tempId = `manual_${Date.now()}`
    setStudents(prev => [...prev, { id: tempId, name: 'Manual Entry', username: '', isManual: true }])
    setEntries(prev => ({ ...prev, [tempId]: { marks: '', max: '100', manualId: '' } }))
  }

  const removeRow = (sid) => {
    setStudents(prev => prev.filter(s => s.id !== sid))
    const next = { ...entries }
    delete next[sid]
    setEntries(next)
  }

  const handleUpload = async () => {
    if (!subjectId) {
      toast.warning('Please select a Subject')
      return
    }
    const uploadEntries = Object.entries(entries)
      .filter(([sid, data]) => {
        if (sid.startsWith?.('manual')) return data.marks !== '' && data.manualId !== ''
        return data.marks !== ''
      })
      .map(([sid, data]) => ({
        student_id: sid.startsWith?.('manual') ? parseInt(data.manualId) : parseInt(sid),
        marks_obtained: parseFloat(data.marks),
        max_marks: parseFloat(data.max)
      }))

    if (uploadEntries.length === 0) {
      toast.warning('Please enter marks for at least one student')
      return
    }

    setSubmitting(true)
    try {
      await uploadMarks({
        subject_id: parseInt(subjectId),
        assessment_type: assessmentType,
        semester,
        entries: uploadEntries
      })
      toast.success(`Uploaded ${uploadEntries.length} marks (unpublished draft)`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async () => {
    if (!subjectId) {
      toast.warning('Please enter a Subject ID')
      return
    }
    setPublishing(true)
    try {
      const res = await publishMarks(parseInt(subjectId), assessmentType)
      toast.success(res?.message || 'Marks published successfully')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <ErpLayout title="Grade Terminal" subtitle="Assessment processing and academic result management">
      
      {/* Evaluation Header */}
      <div className="card glass-panel mb-8 sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-border-color p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          
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
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Assessment Type</label>
              <div className="relative">
                <Layers size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                <select
                  className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                >
                  {['CAT-1', 'CAT-2', 'Assignment', 'Project', 'Lab', 'Semester'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-24 relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 absolute left-4 top-2">Sem</label>
              <div className="relative">
                <Hash size={16} className="absolute left-4 top-[34px] text-on-surface-variant/20" />
                <select
                  className="w-full bg-surface-container border border-border-color rounded-2xl pt-8 pb-4 pl-12 pr-4 text-on-surface text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={String(s)}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button 
              onClick={handleUpload} 
              disabled={submitting || !subjectId}
              className="flex-1 lg:flex-none h-[58px] px-8 bg-surface-container border border-border-color text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 transition-all flex items-center justify-center gap-3"
            >
              <Save size={18} className="text-primary" />
              <span>{submitting ? 'SAVING...' : 'SAVE DRAFT'}</span>
            </button>
            <button 
              onClick={handlePublish} 
              disabled={publishing || !subjectId}
              className="flex-1 lg:flex-none h-[58px] px-8 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-[0_10px_20px_rgba(124,58,237,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <Send size={18} />
              <span>{publishing ? 'PUBLISHING...' : 'PUBLISH'}</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <SkeletonLoader key={i} variant="table" />)}
        </div>
      ) : students.length > 0 ? (
        <div className="card glass-panel border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Student Identity</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Marks Obtained</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Max Possible</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Efficiency</th>
                  <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {students.map((student, idx) => {
                    const data = entries[student.id] || { marks: '', max: '100' }
                    const percentage = (parseFloat(data.marks) / parseFloat(data.max)) * 100
                    
                    return (
                      <motion.tr 
                        key={student.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="border-t border-white/5 hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="p-6">
                          {student.isManual ? (
                            <div className="relative">
                               <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/20" />
                               <input 
                                 placeholder="Student ID"
                                 className="bg-surface-container border border-border-color rounded-xl py-2 pl-9 pr-4 text-xs text-on-surface focus:border-primary/30 outline-none transition-all w-48"
                                 value={data.manualId || ''}
                                 onChange={(e) => updateEntry(student.id, 'manualId', e.target.value)}
                               />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{student.name}</div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{student.username}</div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <input 
                            type="number"
                            placeholder="0.0"
                            className="bg-surface-container border border-border-color rounded-xl py-2 px-4 text-sm font-bold text-white focus:border-primary/30 outline-none transition-all w-24"
                            value={data.marks}
                            onChange={(e) => updateEntry(student.id, 'marks', e.target.value)}
                          />
                        </td>
                        <td className="p-6">
                          <input 
                            type="number"
                            className="bg-surface-container border border-border-color rounded-xl py-2 px-4 text-sm font-bold text-white/50 focus:border-primary/30 outline-none transition-all w-24"
                            value={data.max}
                            onChange={(e) => updateEntry(student.id, 'max', e.target.value)}
                          />
                        </td>
                        <td className="p-6">
                           {!isNaN(percentage) && (
                             <div className="flex items-center gap-3">
                               <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${Math.min(100, percentage)}%` }}
                                   className={`h-full rounded-full ${percentage >= 75 ? 'bg-tertiary' : percentage >= 40 ? 'bg-secondary' : 'bg-error'}`}
                                 />
                               </div>
                               <span className={`text-[10px] font-black ${percentage >= 75 ? 'text-tertiary' : percentage >= 40 ? 'text-secondary' : 'text-error'}`}>
                                 {percentage.toFixed(1)}%
                               </span>
                             </div>
                           )}
                        </td>
                        <td className="p-6 text-right">
                          {student.isManual && (
                            <button onClick={() => removeRow(student.id)} className="p-2 text-on-surface-variant/20 hover:text-error transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
            <button 
              onClick={addRow}
              className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-[10px] font-bold text-on-surface-variant/40 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>INSERT AD-HOC STUDENT ROW</span>
            </button>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={<BarChart3 size={48} className="text-white/10" />}
          title="Analytics Node Offline"
          description={subjectId ? "No students found for this subject." : "Initialize the evaluation engine by selecting a subject from the command bar."}
        />
      )}
    </ErpLayout>
  )
}
