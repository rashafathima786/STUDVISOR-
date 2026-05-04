import { useState, useEffect } from 'react'
import { uploadMarks, publishMarks, fetchMySubjects, fetchStudentsBySubject, fetchExistingMarks } from '../../services/api'
import useAuthStore from '../../stores/authStore'
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
  }, [])

  useEffect(() => {
    if (subjectId) {
      const subj = subjects.find(s => String(s.id) === String(subjectId))
      if (subj?.semester) setSemester(String(subj.semester))
      
      setLoading(true)
      Promise.all([
        fetchStudentsBySubject(subjectId),
        fetchExistingMarks(subjectId, assessmentType).catch(() => ({ marks: [] }))
      ]).then(([studentsRes, marksRes]) => {
          const list = studentsRes.students || []
          setStudents(list)
          
          const existingMap = {}
          marksRes.marks?.forEach(m => {
            existingMap[m.student_id] = { marks: String(m.marks_obtained), max: String(m.max_marks) }
          })

          const init = {}
          list.forEach(s => {
            init[s.id] = existingMap[s.id] || { marks: '', max: '100' }
          })
          setEntries(init)
        })
        .finally(() => setLoading(false))
    }
  }, [subjectId, subjects, assessmentType])

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

  const handleExportCSV = () => {
    if (students.length === 0) return
    const headers = ['Student ID', 'Name', 'Marks Obtained', 'Max Marks', 'Percentage']
    const rows = students.map(s => {
      const data = entries[s.id] || { marks: '0', max: '100' }
      const pct = (parseFloat(data.marks) / parseFloat(data.max) * 100).toFixed(2)
      return [s.username, s.name, data.marks, data.max, `${pct}%`]
    })
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Marks_${assessmentType}_${subjectId}.csv`)
    document.body.appendChild(link)
    link.click()
    toast.success("CSV Export Triggered")
  }

  const stats = (() => {
    const marks = Object.values(entries).map(e => parseFloat(e.marks)).filter(m => !isNaN(m))
    if (marks.length === 0) return { avg: '0.0', pass: 0, fail: 0 }
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length
    const pass = marks.filter(m => m >= 40).length
    return { avg: avg.toFixed(1), pass, fail: marks.length - pass }
  })()
  const user = useAuthStore(s => s.user)

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
                  {['Internal', 'CAT-1', 'CAT-2', 'Assignment', 'Project', 'Lab', 'Semester'].map(t => (
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
              onClick={handleExportCSV}
              disabled={students.length === 0}
              className="px-6 h-[58px] bg-surface-container border border-border-color text-on-surface-variant/40 hover:text-on-surface rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
              title="Export to CSV"
            >
              <Upload size={18} />
            </button>
            <button 
              onClick={handleUpload} 
              disabled={submitting || !subjectId}
              className="flex-1 lg:flex-none h-[58px] px-8 bg-surface-container border border-border-color text-on-surface rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Save size={18} className="text-primary" />
              <span>{submitting ? 'SAVING...' : 'SAVE DRAFT'}</span>
            </button>
            <button 
              onClick={handlePublish} 
              disabled={publishing || !subjectId}
              className="flex-1 lg:flex-none h-[58px] px-8 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Send size={18} />
              <span>{publishing ? 'PUBLISHING...' : 'PUBLISH'}</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Panel */}
        {students.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border-color flex flex-wrap gap-8">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase tracking-widest mb-1">Faculty Node</span>
              <span className="text-sm font-bold text-on-surface">{user?.full_name} ({user?.department || 'General'})</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase tracking-widest mb-1">Roster Count</span>
              <span className="text-sm font-bold text-on-surface">{students.length} Students</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase tracking-widest mb-1">Average Performance</span>
              <span className="text-sm font-bold text-primary">{stats.avg}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase tracking-widest mb-1">Pass / Fail</span>
              <div className="flex gap-2">
                <span className="text-sm font-bold text-tertiary">{stats.pass} P</span>
                <span className="text-sm font-bold text-error">{stats.fail} F</span>
              </div>
            </div>
            <div className="flex flex-col ml-auto text-right">
              <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase tracking-widest mb-1">Target Assessment</span>
              <span className="text-sm font-bold text-secondary">{assessmentType} • Semester {semester}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <SkeletonLoader key={i} variant="table" />)}
        </div>
      ) : students.length > 0 ? (
        <div className="card glass-panel border-border-color overflow-hidden bg-surface-container-low">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-on-surface/[0.02]">
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
                        className="border-t border-border-color hover:bg-on-surface/[0.01] transition-colors"
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
                              {(() => {
                                const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-error', 'bg-blue-500', 'bg-emerald-500']
                                const charCode = student.name.charCodeAt(0)
                                const colorClass = colors[charCode % colors.length]
                                return (
                                  <div className={`w-8 h-8 rounded-full ${colorClass}/20 flex items-center justify-center ${colorClass.replace('bg-', 'text-')} text-[10px] font-bold`}>
                                    {student.name.charAt(0)}
                                  </div>
                                )
                              })()}
                              <div>
                                <div className="text-sm font-bold text-on-surface">{student.name}</div>
                                <div className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-widest">{student.username}</div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <input 
                            type="number"
                            placeholder="0.0"
                            className="bg-surface-container border border-border-color rounded-xl py-2 px-4 text-sm font-bold text-on-surface focus:border-primary/30 outline-none transition-all w-24"
                            value={data.marks}
                            onChange={(e) => updateEntry(student.id, 'marks', e.target.value)}
                          />
                        </td>
                        <td className="p-6">
                          <input 
                            type="number"
                            className="bg-surface-container border border-border-color rounded-xl py-2 px-4 text-sm font-bold text-on-surface-variant/50 focus:border-primary/30 outline-none transition-all w-24"
                            value={data.max}
                            onChange={(e) => updateEntry(student.id, 'max', e.target.value)}
                          />
                        </td>
                        <td className="p-6">
                           {!isNaN(percentage) && (
                             <div className="flex items-center gap-3">
                               <div className="flex-1 h-1.5 bg-on-surface/5 rounded-full overflow-hidden min-w-[60px]">
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
          
          <div className="p-4 border-t border-border-color bg-on-surface/[0.01]">
            <button 
              onClick={addRow}
              className="w-full py-3 border border-dashed border-border-color rounded-2xl text-[10px] font-bold text-on-surface-variant/40 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>INSERT AD-HOC STUDENT ROW</span>
            </button>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={<BarChart3 size={48} className="text-on-surface-variant/10" />}
          title="Analytics Node Offline"
          description={subjectId ? "No students found for this subject." : "Initialize the evaluation engine by selecting a subject from the command bar."}
        />
      )}
    </ErpLayout>
  )
}
