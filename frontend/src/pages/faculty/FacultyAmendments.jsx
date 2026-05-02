import { useState, useEffect } from 'react'
import { fetchPendingAmendments, approveAmendment } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { FileSearch, Check, X, ArrowRight, User, Book, Calendar, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyAmendments() {
  const [amendments, setAmendments] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    fetchPendingAmendments()
      .then((res) => setAmendments(res?.pending_amendments || []))
      .catch(() => setAmendments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAction = async (id, approve) => {
    setProcessing(id)
    try {
      await approveAmendment(id, approve, '')
      toast.success(approve ? 'Amendment approved' : 'Amendment rejected')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Action failed')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <ErpLayout title="Data Integrity Hub" subtitle="Audit and authorize attendance record amendments">
      
      <div className="mb-8">
         <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant/30 mb-6 flex items-center gap-2">
            <FileSearch size={14} /> Rectification Queue ({amendments.length})
         </h3>

         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <SkeletonLoader variant="card" count={3} />
            </div>
         ) : amendments.length === 0 ? (
            <EmptyState 
              title="Registry Synced" 
              description="No pending attendance amendments detected in the system." 
              icon={<Check size={48} className="text-success/20" />}
            />
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {amendments.map((a, idx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.1 }}
                    className="card glass-panel p-6 border-border-color bg-surface-container flex flex-col group relative"
                  >
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <User size={18} />
                       </div>
                       <div className="flex-1">
                          <h4 className="text-sm font-bold text-on-surface leading-tight">{a.faculty}</h4>
                          <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-widest">Amendment Request</span>
                       </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                       <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-border-color">
                          <div className="flex flex-col items-center">
                             <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase mb-1 tracking-widest">Original</span>
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${a.old_status === 'P' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                {a.old_status}
                             </div>
                          </div>
                          <ArrowRight size={16} className="text-on-surface-variant/10" />
                          <div className="flex flex-col items-center">
                             <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase mb-1 tracking-widest">Amended</span>
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${a.new_status === 'P' ? 'bg-success text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-error text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                                {a.new_status}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3 px-1">
                          <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant/60">
                             <Book size={12} className="text-primary" />
                             <span>{a.subject}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant/60">
                             <Calendar size={12} className="text-secondary" />
                             <span>{a.date}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-surface-container text-[10px] text-on-surface-variant/40 leading-relaxed italic border border-border-color">
                             "{a.reason || 'No reason provided'}"
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button 
                        className="flex-1 h-10 rounded-xl bg-surface-container border border-border-color text-on-surface-variant/40 text-[10px] font-bold uppercase tracking-widest hover:bg-error/10 hover:text-error hover:border-error/20 transition-all disabled:opacity-50"
                        onClick={() => handleAction(a.id, false)}
                        disabled={processing === a.id}
                       >
                          Reject
                       </button>
                       <button 
                        className="flex-1 h-10 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        onClick={() => handleAction(a.id, true)}
                        disabled={processing === a.id}
                       >
                          Approve
                       </button>
                    </div>

                    <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="text-on-surface-variant/10 hover:text-on-surface"><Info size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
         )}
      </div>
    </ErpLayout>
  )
}
