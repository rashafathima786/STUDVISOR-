import { useState, useEffect } from 'react'
import { fetchAllFaculty } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { Cpu, Search, Plus, Filter, MoreHorizontal, Shield, GraduationCap, Briefcase, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchAllFaculty()
      .then((res) => { const f = res?.faculty || []; setFaculty(f); setFiltered(f) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(faculty); return }
    const q = search.toLowerCase()
    setFiltered(faculty.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.department?.toLowerCase().includes(q) ||
      f.designation?.toLowerCase().includes(q)
    ))
  }, [search, faculty])

  return (
    <ErpLayout title="Faculty Command" subtitle="Academic node registry and verified instructor directory">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
               <Cpu size={24} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-white">Faculty Nodes</h3>
               <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{filtered.length} Verified Instructors</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="relative">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
               <input 
                type="text" 
                placeholder="Audit faculty..." 
                className="bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-secondary/50 outline-none w-64 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
               />
            </div>
            <button className="bg-secondary text-white p-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20">
               <Plus size={20} />
            </button>
         </div>
      </div>

      <div className="card glass-panel p-0 border-white/5 bg-white/[0.02] overflow-hidden">
         {loading ? (
           <div className="p-8"><SkeletonLoader variant="table-row" count={8} /></div>
         ) : filtered.length === 0 ? (
           <div className="p-20"><EmptyState title="No faculty found" description="Adjust your filters or verify instructor records." /></div>
         ) : (
           <div className="table-wrapper">
              <table className="w-full">
                 <thead>
                    <tr className="bg-white/[0.01]">
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Identity</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Role & Dept</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Academic Load</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Security</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filtered.map((f, idx) => (
                      <motion.tr 
                        key={f.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                                  {f.name?.[0]}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">{f.name}</span>
                                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">ID #{f.id}</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-white/60">{f.designation || 'Lecturer'}</span>
                               <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{f.department || 'General'}</span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                               <GraduationCap size={14} className="text-white/20" />
                               <span className="text-xs font-bold text-white/60">{f.subjects || 0} Modules</span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="px-3 py-1 rounded-lg bg-info/10 border border-info/20 text-info text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                               <Shield size={10} /> Verified
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

    </ErpLayout>
  )
}
