import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowUpRight, 
  Target, 
  Zap, 
  Building,
  GraduationCap,
  CalendarDays,
  IndianRupee,
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin
} from 'lucide-react'
import { fetchPlacementDrives, fetchMyApplications, applyToDrive as transmitApplication } from '../services/api'


export default function PlacementPage() {
  const [drives, setDrives] = useState([])
  const [applications, setApplications] = useState([])
  const [tab, setTab] = useState('drives')
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    loadPlacementData();
  }, [])

  async function loadPlacementData() {
    setLoading(true);
    try {
      const [drivesRes, appsRes] = await Promise.all([
        fetchPlacementDrives(),
        fetchMyApplications()
      ]);
      setDrives(drivesRes.drives || []);
      setApplications(appsRes.applications || []);
    } catch (err) {
      console.error("Placement data load error", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (driveId) => {
    try {
      const data = await transmitApplication(driveId);
      alert(data.message || "Application transmitted successfully.");
      loadPlacementData();
    } catch (err) {
      alert("System Error: Application transmission failed.");
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Selected': return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
      case 'Rejected': return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
      default: return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    }
  }

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Synchronizing Portfolios...</p>
        </div>
    </div>
  )

  return (
    <ErpLayout title="Career Terminal" subtitle="Strategic management of corporate relations and placement protocols">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Briefcase className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Placement Hub</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Active Drive Phase: {drives.length > 0 ? 'Peak' : 'Standby'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 shadow-2xl">
            {['drives', 'applications'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'drives' ? 'Corporate Drives' : 'Applied Streams'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {tab === 'drives' ? (
            <motion.div 
              key="drives"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {drives.map((d, idx) => (
                <motion.div 
                  key={d.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative glass-panel rounded-[40px] p-8 border border-white/5 hover:border-primary/40 transition-all flex flex-col overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                    <Building size={80} />
                  </div>

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-start gap-4">
                      {d.company_logo_url ? (
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                          <img src={d.company_logo_url} alt={d.company} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Building2 className="text-primary" size={24} />
                        </div>
                      )}
                      <div className="flex flex-col">
                         <h3 className="text-xl font-black text-on-surface tracking-tighter uppercase group-hover:text-primary transition-colors">{d.company}</h3>
                         {/* Removed role from here to place it prominently below */}
                         <div className="flex items-center gap-1.5 mt-2 text-white/30">
                           <MapPin size={10} className="text-primary/60" />
                           <span className="text-[9px] font-bold uppercase tracking-wider">{d.location || 'Remote'}</span>
                         </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {d.package_lpa && (
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black text-emerald-400 tracking-tighter">₹{d.package_lpa}L</span>
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Base CTC</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[9px] font-black text-amber-400">{d.company_rating || '4.0'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/5 group/role transition-all hover:bg-white/[0.08]">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Job Role</span>
                      <span className="text-lg font-black text-on-surface tracking-tight leading-none mt-1 group-hover/role:text-primary transition-colors">{d.role}</span>
                    </div>
                  </div>

                  {d.requirements && (
                    <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                      {d.requirements.split(',').map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 uppercase tracking-wider">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col md:grid md:grid-cols-2 gap-4 mb-8 relative z-10">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Eligibility</span>
                       <div className="flex items-center gap-2">
                         <Target size={12} className="text-primary/60" />
                         <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/80">{d.min_cgpa} CGPA</span>
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Max {d.backlogs || 0} Backlogs</span>
                          </div>
                       </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Deadline</span>
                       <div className="flex items-center gap-2">
                         <Clock size={12} className="text-amber-400/60" />
                         <span className="text-xs font-bold text-white/80">{d.last_date_apply ? new Date(d.last_date_apply).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBA'}</span>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleApply(d.id)}
                    className="mt-auto w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 relative z-10"
                  >
                    Transmit Application
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              ))}
              {drives.length === 0 && (
                <div className="col-span-full py-32 glass-panel rounded-[40px] flex flex-col items-center justify-center text-center opacity-40">
                   <Zap size={48} className="mb-6" />
                   <h3 className="text-xl font-bold uppercase tracking-widest">Horizon Clear</h3>
                   <p className="text-sm mt-2">No active corporate drives detected in the current cycle.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="applications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl">
                   <Target className="text-emerald-400" size={24} />
                 </div>
                 <h2 className="text-xl font-bold text-white tracking-tight">Synchronized Submissions</h2>
              </div>

              <div className="glass-panel rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02]">
                        <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Corporate Partner</th>
                        <th className="px-6 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Domain / Role</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Compensation</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {applications.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-10 py-32 text-center">
                            <p className="text-white/20 text-sm font-bold uppercase tracking-widest italic">No application streams initiated</p>
                          </td>
                        </tr>
                      ) : (
                        applications.map((a, idx) => {
                          const style = getStatusStyle(a.status);
                          return (
                            <motion.tr 
                              key={a.id || idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="hover:bg-white/[0.03] transition-colors group"
                            >
                              <td className="px-10 py-8">
                                 <div className="flex items-center gap-4">
                                   {a.company_logo_url ? (
                                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                                       <img src={a.company_logo_url} alt={a.company_name} className="w-full h-full object-contain" />
                                     </div>
                                   ) : (
                                     <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                       <Building2 className="text-primary" size={18} />
                                     </div>
                                   )}
                                   <div className="flex flex-col">
                                     <span className="text-white font-bold group-hover:text-primary transition-colors tracking-tight text-lg">{a.company_name}</span>
                                     <span className="text-[11px] text-on-surface-variant/40 font-black uppercase tracking-widest">{a.role_title}</span>
                                   </div>
                                 </div>
                              </td>
                              <td className="px-6 py-8">
                                 <span className="text-xs font-bold text-white/60">{a.role_title}</span>
                              </td>
                              <td className="px-6 py-8 text-center font-bold text-emerald-400">
                                 {a.package_lpa ? `₹${a.package_lpa} LPA` : 'Competitive'}
                              </td>
                              <td className="px-6 py-8">
                                <div className="flex justify-center">
                                  <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.color} ${style.border}`}>
                                    <style.icon size={12} /> {a.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                 <span className="text-xs font-bold text-white/20">
                                   {new Date(a.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                 </span>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Note */}
              <div className="flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[32px] border border-white/5">
                 <ShieldCheck className="text-primary/60" size={20} />
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Corporate interaction protocols are strictly monitored. Ensure your profile metadata is accurate.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ErpLayout>
  )
}
