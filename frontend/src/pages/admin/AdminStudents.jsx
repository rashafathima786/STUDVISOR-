import { useState, useEffect } from 'react'
import { fetchAllStudents, createStudent } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { Users, Search, Plus, Filter, MoreHorizontal, Download, UserPlus, X, Hash, GraduationCap, Mail, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newStudent, setNewStudent] = useState({ username: '', email: '', password: '', full_name: '', department: '', semester: '' })
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    fetchAllStudents()
      .then((res) => { const s = res?.students || []; setStudents(s); setFiltered(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(students); return }
    const q = search.toLowerCase()
    setFiltered(students.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.username?.toLowerCase().includes(q) || 
      s.department?.toLowerCase().includes(q)
    ))
  }, [search, students])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createStudent({
        ...newStudent,
        semester: newStudent.semester ? parseInt(newStudent.semester) : null
      })
      toast.success("Student identity provisioned successfully")
      setShowCreate(false)
      setNewStudent({ username: '', email: '', password: '', full_name: '', department: '', semester: '' })
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Provisioning failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ErpLayout title="Entity Management" subtitle="System-wide student registry and identity provisioning">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
               <Users size={24} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-white">Student Roster</h3>
               <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{filtered.length} Active Records</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="relative">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
               <input 
                type="text" 
                placeholder="Search index..." 
                className="bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none w-64 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
               />
            </div>
            <button 
              onClick={() => setShowCreate(true)}
              className="bg-primary text-white p-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
               <Plus size={20} />
            </button>
         </div>
      </div>

      <div className="card glass-panel p-0 border-white/5 bg-white/[0.02] overflow-hidden">
         {loading ? (
           <div className="p-8"><SkeletonLoader variant="table-row" count={8} /></div>
         ) : filtered.length === 0 ? (
           <div className="p-20"><EmptyState title="No matches found" description="Adjust your search parameters or provision a new entity." /></div>
         ) : (
           <div className="table-wrapper">
              <table className="w-full">
                 <thead>
                    <tr className="bg-white/[0.01]">
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Identity</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Academic Node</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Status</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Merit</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filtered.map((s, idx) => (
                      <motion.tr 
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                  {s.name?.[0]}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">{s.name}</span>
                                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{s.username}</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-white/60">{s.department || 'N/A'}</span>
                               <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Semester {s.semester || '0'}</span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="px-3 py-1 rounded-lg bg-success/10 border border-success/20 text-success text-[8px] font-black uppercase tracking-widest inline-block">
                               Active Node
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                               <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-secondary" style={{ width: `${Math.min(100, (s.merit || 0))}%` }}></div>
                               </div>
                               <span className="text-xs font-bold text-secondary">{s.merit || 0}</span>
                            </div>
                         </td>
                         <td className="px-6 py-5 text-right">
                            <button className="p-2 rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all">
                               <MoreHorizontal size={16} />
                            </button>
                         </td>
                      </motion.tr>
                    ))}
                 </tbody>
              </table>
           </div>
         )}
      </div>

      {/* ── Provisioning Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0e]/80 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="w-full max-w-2xl glass-panel rounded-[2rem] border-primary/20 bg-[#12121a] overflow-hidden shadow-2xl"
             >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/[0.03]">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                         <UserPlus size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white">Provision Identity</h3>
                         <p className="text-xs text-white/40">Register new student in the central nexus</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setShowCreate(false)}
                    className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-error/10 hover:text-error transition-all"
                   >
                      <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleCreate} className="p-8 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 flex items-center gap-2"><Mail size={12}/> Academic Email</label>
                         <input 
                          type="email" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="student@clg.edu"
                          value={newStudent.email}
                          onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                          required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 flex items-center gap-2"><Shield size={12}/> Access Password</label>
                         <input 
                          type="password" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="••••••••"
                          value={newStudent.password}
                          onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                          required
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 flex items-center gap-2"><Hash size={12}/> Legal Full Name</label>
                      <input 
                       type="text" 
                       className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-primary/50 outline-none transition-all"
                       placeholder="e.g. Johnathan Smith"
                       value={newStudent.full_name}
                       onChange={e => setNewStudent({...newStudent, full_name: e.target.value})}
                       required
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Username</label>
                         <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="jsmith2025"
                          value={newStudent.username}
                          onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                          required
                         />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Department Node</label>
                         <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm focus:border-primary/50 outline-none transition-all"
                          placeholder="e.g. Computer Science"
                          value={newStudent.department}
                          onChange={e => setNewStudent({...newStudent, department: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="flex justify-end gap-4 pt-6">
                      <button 
                        type="button" 
                        onClick={() => setShowCreate(false)}
                        className="px-8 py-3.5 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Abort
                      </button>
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-12 py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                      >
                        {submitting ? 'Provisioning...' : 'Confirm Provision'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </ErpLayout>
  )
}
