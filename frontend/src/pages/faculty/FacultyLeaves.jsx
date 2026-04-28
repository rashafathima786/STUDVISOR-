import { useState, useEffect } from 'react'
import { fetchFacultyPendingLeaves, approveFacultyLeave, rejectFacultyLeave } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { PenTool, Check, X, Calendar, User, FileText, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FacultyLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    fetchFacultyPendingLeaves()
      .then((res) => setLeaves(res?.pending || []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      await approveFacultyLeave(id)
      toast.success('Leave approved successfully')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to approve')
    } finally { setProcessing(null) }
  }

  const handleReject = async (id) => {
    setProcessing(id)
    try {
      await rejectFacultyLeave(id)
      toast.success('Leave request rejected')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to reject')
    } finally { setProcessing(null) }
  }

  return (
    <ErpLayout title="Leave Decision Center" subtitle="Validate and process student absence authorizations">
      <div className="mb-8">
         <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 mb-6 flex items-center gap-2">
            <PenTool size={14} /> Pending Verifications ({leaves.length})
         </h3>

         {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SkeletonLoader variant="card" count={4} />
            </div>
         ) : leaves.length === 0 ? (
            <EmptyState 
              title="Queue Cleared" 
              description="There are no pending leave requests awaiting your decision." 
              icon={<Check size={48} className="text-success/20" />}
            />
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {leaves.map((l, idx) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.1 }}
                    className="card glass-panel p-6 border-white/5 bg-white/[0.02] flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-lg">
                          {l.student?.[0]}
                       </div>
                       <div className="flex-1">
                          <h4 className="text-sm font-bold text-white leading-tight">{l.student}</h4>
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{l.type} Request</span>
                       </div>
                       <div className="px-2 py-1 rounded-lg bg-info/10 border border-info/20 text-info text-[8px] font-black uppercase tracking-widest">
                          Pending
                       </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                       <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-white/20" />
                          <div className="text-xs">
                             <span className="text-white font-bold">{l.from}</span>
                             <span className="text-white/20 mx-2">to</span>
                             <span className="text-white font-bold">{l.to}</span>
                          </div>
                       </div>
                       <div className="flex items-start gap-3">
                          <FileText size={14} className="text-white/20 mt-1 shrink-0" />
                          <p className="text-xs text-white/60 leading-relaxed italic">"{l.reason}"</p>
                       </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-white/5">
                       <button 
                        className="flex-1 h-11 rounded-xl bg-error/10 border border-error/20 text-error text-[10px] font-black uppercase tracking-[0.2em] hover:bg-error hover:text-white transition-all disabled:opacity-50"
                        onClick={() => handleReject(l.id)}
                        disabled={processing === l.id}
                       >
                          Reject
                       </button>
                       <button 
                        className="flex-1 h-11 rounded-xl bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-[0.2em] hover:bg-success hover:text-white transition-all disabled:opacity-50"
                        onClick={() => handleApprove(l.id)}
                        disabled={processing === l.id}
                       >
                          Approve
                       </button>
                    </div>

                    <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="text-white/20 hover:text-white"><Info size={14} /></button>
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
