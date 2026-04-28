import { useEffect, useState } from 'react'
import ErpLayout from '../components/ErpLayout'
import { applyLeaveRequest, fetchLeaveRequests, fetchMissedClasses } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  History, 
  AlertCircle, 
  Calendar, 
  Send, 
  CheckCircle, 
  Clock, 
  UserPlus,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

const initialForm = {
  leave_type: 'OD',
  from_date: new Date().toISOString().split('T')[0],
  to_date: new Date().toISOString().split('T')[0],
  reason: '',
}

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [missedClasses, setMissedClasses] = useState([])
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function loadLeaveData() {
    try {
      const [leaveData, missedData] = await Promise.all([
        fetchLeaveRequests(),
        fetchMissedClasses(),
      ])
      // Handle potential object wrappers in API response
      setLeaveRequests(Array.isArray(leaveData) ? leaveData : (leaveData?.leave_requests || []))
      setMissedClasses(Array.isArray(missedData) ? missedData : (missedData?.missed_classes || []))
    } catch (err) {
      setError('System synchronization failed. Verify uplink.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaveData()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      await applyLeaveRequest(form)
      setMessage('Leave protocol initiated. Status: Pending.')
      setForm(initialForm)
      await loadLeaveData()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Protocol rejection. Check parameters.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
  }

  return (
    <ErpLayout title="Service Management" subtitle="Formal leave requests and academic absence tracking">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Alerts Section */}
        <AnimatePresence>
          {(error || message) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${
                error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">{error || message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Apply Form - Column 4 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-primary/10 rounded-2xl">
                 <FileText className="text-primary" size={24} />
               </div>
               <h2 className="text-xl font-bold text-white tracking-tight">Request Protocol</h2>
            </div>
            
            <div className="glass-panel rounded-[40px] p-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Send size={80} />
              </div>
              
              <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Absence Class</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-primary/50 transition-all appearance-none"
                    value={form.leave_type} 
                    onChange={e => setForm({...form, leave_type: e.target.value})}
                  >
                    <option value="OD" className="bg-[#0d0d10]">ON DUTY (OD)</option>
                    <option value="Medical" className="bg-[#0d0d10]">MEDICAL RELIEF</option>
                    <option value="Leave" className="bg-[#0d0d10]">PERSONAL LEAVE</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Commencement</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white font-bold outline-none focus:border-primary/50 transition-all"
                      value={form.from_date} 
                      onChange={e => setForm({...form, from_date: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Conclusion</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white font-bold outline-none focus:border-primary/50 transition-all"
                      value={form.to_date} 
                      onChange={e => setForm({...form, to_date: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Justification</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white font-medium outline-none focus:border-primary/50 transition-all placeholder:text-white/10 resize-none"
                    rows={4}
                    placeholder="Provide detailed reasoning for administrative review..."
                    value={form.reason}
                    onChange={e => setForm({...form, reason: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Transmit Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* History & Missed Classes - Column 8 */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Applied Requests Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <History className="text-emerald-400" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Active Logs</h2>
                </div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{leaveRequests.length} Total Records</span>
              </div>

              <div className="glass-panel rounded-[40px] overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Type</th>
                        <th className="px-6 py-5 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Temporal Range</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                         <tr><td colSpan="4" className="py-20 text-center animate-pulse"><p className="text-white/20 uppercase font-black text-[10px] tracking-widest">Retrieving Secure Records...</p></td></tr>
                      ) : leaveRequests.length === 0 ? (
                        <tr><td colSpan="4" className="py-20 text-center opacity-20 italic">No active leave protocols found.</td></tr>
                      ) : (
                        leaveRequests.map((item, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={item.id} 
                            className="hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="px-8 py-6">
                              <span className="text-xs font-black text-white group-hover:text-primary transition-colors tracking-widest">{item.leave_type}</span>
                            </td>
                            <td className="px-6 py-6">
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-white/80">{item.from_date === item.to_date ? item.from_date : `${item.from_date} — ${item.to_date}`}</span>
                                 <span className="text-[9px] text-white/20 font-medium uppercase tracking-tighter mt-0.5">Duration Confirmed</span>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <span className="text-xs text-white/40 font-medium italic">{item.reason || '—'}</span>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Missed Classes Section */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 rounded-2xl">
                    <ShieldCheck className="text-red-400" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Anomalous Absences</h2>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missedClasses.length === 0 ? (
                   <div className="col-span-2 py-12 glass-panel rounded-3xl flex flex-col items-center justify-center border border-white/5 opacity-40">
                      <CheckCircle size={32} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Full Synchronization: No Absences</p>
                   </div>
                ) : (
                  missedClasses.map((day, idx) => (
                    <motion.div 
                      key={day.date}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-panel rounded-3xl p-6 border border-white/5 hover:border-red-500/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Absence Date</span>
                          <span className="text-sm font-black text-white mt-1">{day.date}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                          <Clock size={18} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {day.missed_hours.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                            <span className="text-[10px] font-bold text-white/60 uppercase">{item.subject_name}</span>
                            <span className="text-[10px] font-black text-primary uppercase">{item.hour}HR</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2 text-white/20">
                         <ChevronRight size={12} />
                         <span className="text-[9px] font-black uppercase tracking-widest">Requires OD Coverage</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ErpLayout>
  )
}
