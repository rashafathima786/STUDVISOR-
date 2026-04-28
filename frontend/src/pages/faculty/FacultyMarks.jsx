import { useState } from 'react'
import { uploadMarks, publishMarks } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import { useToast } from '../../stores/toastStore'
import { Upload, Send, Plus, Trash2, Hash, BookOpen, Layers, BarChart3, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyMarks() {
  const [subjectId, setSubjectId] = useState('')
  const [assessmentType, setAssessmentType] = useState('CAT-1')
  const [semester, setSemester] = useState('1')
  const [entries, setEntries] = useState([{ student_id: '', marks_obtained: '', max_marks: '100' }])
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const toast = useToast()

  const addRow = () => {
    setEntries([...entries, { student_id: '', marks_obtained: '', max_marks: '100' }])
  }

  const removeRow = (idx) => {
    setEntries(entries.filter((_, i) => i !== idx))
  }

  const updateEntry = (idx, field, value) => {
    const updated = [...entries]
    updated[idx][field] = value
    setEntries(updated)
  }

  const handleUpload = async () => {
    if (!subjectId) {
      toast.warning('Please enter a Subject ID')
      return
    }
    const validEntries = entries.filter((e) => e.student_id && e.marks_obtained !== '')
    if (validEntries.length === 0) {
      toast.warning('Please add at least one mark entry')
      return
    }

    setSubmitting(true)
    try {
      await uploadMarks({
        subject_id: parseInt(subjectId),
        assessment_type: assessmentType,
        semester,
        entries: validEntries.map((e) => ({
          student_id: parseInt(e.student_id),
          marks_obtained: parseFloat(e.marks_obtained),
          max_marks: parseFloat(e.max_marks),
        })),
      })
      toast.success(`Uploaded ${validEntries.length} marks (unpublished draft)`)
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
      
      {/* Configuration Header */}
      <div className="card glass-panel mb-8 border-white/5 bg-white/[0.02]">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 absolute left-4 top-2 group-focus-within:text-primary transition-colors">Subject ID</label>
                <Hash size={16} className="absolute left-4 top-[34px] text-white/20" />
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pt-8 pb-4 pl-12 pr-4 text-white text-sm focus:border-primary/50 transition-all outline-none"
                  placeholder="e.g. 1"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                />
             </div>

             <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 absolute left-4 top-2">Assessment</label>
                <BookOpen size={16} className="absolute left-4 top-[34px] text-white/20" />
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pt-8 pb-4 pl-12 pr-4 text-white text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                >
                  <option value="CAT-1">CAT-1</option>
                  <option value="CAT-2">CAT-2</option>
                  <option value="CAT-3">CAT-3</option>
                  <option value="Semester">Semester Exam</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lab">Lab Practical</option>
                </select>
             </div>

             <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 absolute left-4 top-2">Semester</label>
                <Layers size={16} className="absolute left-4 top-[34px] text-white/20" />
                <select
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pt-8 pb-4 pl-12 pr-4 text-white text-sm focus:border-primary/50 transition-all outline-none appearance-none"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                </select>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              className="px-6 h-[66px] rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 group"
              onClick={handlePublish}
              disabled={publishing}
             >
                <Send size={18} className="group-hover:text-success transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{publishing ? 'Publishing...' : 'Publish'}</span>
             </button>
             <button 
              className="primary-btn h-[66px] px-8 flex items-center gap-3 shadow-[0_10px_20px_rgba(124,58,237,0.3)]"
              onClick={handleUpload}
              disabled={submitting}
             >
               <Save size={18} />
               <span className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold uppercase tracking-widest">Store Draft</span>
                  <span className="text-[8px] opacity-60">Upload results</span>
               </span>
             </button>
          </div>
        </div>
      </div>

      {/* Main Entry Terminal */}
      <div className="card glass-panel p-0 overflow-hidden border-white/5 bg-white/[0.02]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <BarChart3 size={20} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Entry Roster</h3>
           </div>
           <button 
            className="px-4 py-2 rounded-xl border border-primary/20 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
            onClick={addRow}
           >
             <Plus size={14} /> Add Student
           </button>
        </div>

        <div className="table-wrapper">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="w-16 px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">#</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Student Identifier</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Obtained Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Scale (Max)</th>
                <th className="w-24 px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {entries.map((entry, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t border-white/5 group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-center font-bold text-white/20 text-xs">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="relative group/field">
                        <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/field:text-primary transition-colors" />
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-white text-xs focus:border-primary/30 transition-all outline-none"
                          placeholder="Student ID"
                          value={entry.student_id}
                          onChange={(e) => updateEntry(idx, 'student_id', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-white text-xs focus:border-success/30 transition-all outline-none font-bold"
                        placeholder="Marks"
                        value={entry.marks_obtained}
                        onChange={(e) => updateEntry(idx, 'marks_obtained', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-white text-xs focus:border-white/10 transition-all outline-none"
                        placeholder="Max"
                        value={entry.max_marks}
                        onChange={(e) => updateEntry(idx, 'max_marks', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        className="p-2 rounded-lg text-white/20 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        onClick={() => removeRow(idx)}
                        disabled={entries.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-white/[0.01] flex justify-center">
           <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
              {entries.length} student entries loaded in buffer
           </div>
        </div>
      </div>
    </ErpLayout>
  )
}
