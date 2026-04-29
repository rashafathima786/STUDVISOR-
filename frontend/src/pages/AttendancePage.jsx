import React, { useState, useEffect } from 'react';
import { fetchOverallAttendance, fetchSubjectAttendance, fetchBunkAlerts } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Download, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Search,
  ChevronRight,
  Zap
} from 'lucide-react';

const AttendancePage = () => {
    const [overall, setOverall] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [bunkAlerts, setBunkAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [over, subs, alerts] = await Promise.all([
                    fetchOverallAttendance(),
                    fetchSubjectAttendance(),
                    fetchBunkAlerts()
                ]);
                setOverall(over);
                setSubjects(Array.isArray(subs) ? subs : (subs?.subjects || []));
                setBunkAlerts(Array.isArray(alerts) ? alerts : (alerts?.alerts || []));
            } catch (err) {
                console.error("Attendance load error", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleExport = () => {
        if (!subjects.length) return;
        const headers = ["Subject Code", "Subject Name", "Total Classes", "Present", "Percentage", "Status"];
        const rows = subjects.map(s => [
            s.code,
            s.subject,
            s.total,
            s.present,
            `${s.percentage}%`,
            s.percentage >= 75 ? "Optimal" : "Critical"
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_matrix_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="bg-surface min-h-screen flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Synchronizing Matrix...</p>
            </div>
        </div>
    );

    return (
        <ErpLayout title="Attendance Matrix" subtitle="Real-time engagement tracking and strategic absence analytics">
            <div className="max-w-7xl mx-auto px-6 py-8">
                
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <Activity className="text-primary" size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Engagement Core</h2>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Protocol: Real-Time Sync</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                        onClick={() => alert("Current Term: Semester 1 (Jan - June 2026)")}
                        className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-3 text-xs font-bold uppercase tracking-widest shadow-xl"
                    >
                      <Calendar size={18} />
                      Current Term
                    </button>
                    <button 
                        onClick={handleExport}
                        className="px-8 py-3.5 rounded-2xl bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-xs font-bold uppercase tracking-widest shadow-2xl"
                    >
                      <Download size={18} />
                      Export Matrix
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    {/* Aggregate Score Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 glass-panel rounded-[40px] p-10 flex flex-col justify-between min-h-[340px] relative overflow-hidden border border-white/5"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Activity size={120} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Aggregate Health</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-8xl font-black text-primary tracking-tighter" style={{ fontFamily: 'var(--font-jakarta)' }}>
                                    {Math.round(overall?.percentage || 0)}
                                </span>
                                <span className="text-white/20 font-black text-3xl">%</span>
                            </div>
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                                <TrendingUp size={14} className="text-primary" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Stable Trajectory</span>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex justify-between text-[9px] font-black mb-3 uppercase tracking-[0.2em]">
                                <span className="text-white/30">Mandatory Threshold</span>
                                <span className="text-white">75% Capacity</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overall?.percentage || 0}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" 
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Bunkability Meter */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 glass-panel rounded-[40px] p-10 relative overflow-hidden border border-white/5 shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShieldAlert size={100} />
                        </div>
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Strategic Reserve</h2>
                                <p className="text-white/40 text-xs font-medium">calculated for 75% operational threshold.</p>
                            </div>
                            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Safety Margin</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {bunkAlerts.length > 0 ? bunkAlerts.slice(0, 4).map((alert, idx) => (
                                <motion.div 
                                  key={idx} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="bg-white/5 rounded-[32px] px-3 py-6 border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/[0.08] transition-all"
                                >
                                    <span className="text-[9px] font-black text-white/50 uppercase tracking-tight mb-4 line-clamp-2 h-8 flex items-center justify-center w-full px-1 leading-tight">
                                        {alert.subject_name}
                                    </span>
                                    <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-2 transition-all group-hover:scale-110 ${alert.safe_bunks > 0 ? 'border-primary/20 bg-primary/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                        <span className={`text-2xl font-black ${alert.safe_bunks > 0 ? 'text-primary' : 'text-red-400'}`}>
                                            {alert.safe_bunks > 0 ? alert.safe_bunks : alert.required_to_clear || 0}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] mt-4 font-black uppercase tracking-widest ${alert.safe_bunks > 0 ? 'text-white/20' : 'text-red-400/60'}`}>
                                        {alert.safe_bunks > 0 ? 'Units Left' : 'Required'}
                                    </span>
                                </motion.div>
                            )) : (
                                <div className="col-span-4 py-12 text-center opacity-20 italic font-medium uppercase tracking-widest text-[10px]">Strategic reserve data pending...</div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Module Breakdown Table */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-[48px] border border-white/5 overflow-hidden shadow-2xl flex flex-col"
                >
                    <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-white/5 rounded-2xl">
                             <Filter className="text-white/40" size={20} />
                           </div>
                           <h2 className="text-xl font-bold text-white tracking-tight">Module Breakdown</h2>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                               <input type="text" placeholder="Filter subjects..." className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-primary/40 transition-all w-48" />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="py-6 px-10 text-[10px] font-black text-white/30 uppercase tracking-widest">Identifier</th>
                                    <th className="py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-widest">Module Name</th>
                                    <th className="py-6 px-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Sync Conducted</th>
                                    <th className="py-6 px-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Active Attended</th>
                                    <th className="py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-widest">Efficiency Ratio</th>
                                    <th className="py-6 px-10 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Operational Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {subjects.map((s, idx) => (
                                    <motion.tr 
                                      key={idx} 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 + idx * 0.05 }}
                                      className="hover:bg-white/[0.03] transition-colors group"
                                    >
                                        <td className="py-8 px-10 text-xs font-black text-primary tracking-tighter">{s.code}</td>
                                        <td className="py-8 px-8">
                                           <div className="flex flex-col">
                                             <span className="text-white font-bold group-hover:text-primary transition-colors tracking-tight">{s.subject}</span>
                                             <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter mt-1 italic">Verified Original</span>
                                           </div>
                                        </td>
                                        <td className="py-8 px-6 text-center text-xs text-white/40 font-black">{s.total}</td>
                                        <td className="py-8 px-6 text-center text-xs text-white font-black">{s.present}</td>
                                        <td className="py-8 px-8">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center pr-2">
                                                   <span className={`text-lg font-black tracking-tighter ${s.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                       {s.percentage}%
                                                   </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${s.percentage}%` }}
                                                        className={`h-full rounded-full ${s.percentage >= 75 ? 'bg-emerald-400' : 'bg-red-400'}`} 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 px-10 text-right">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.percentage >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {s.percentage >= 75 ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                                                {s.percentage >= 75 ? 'Optimal' : 'Critical'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer Insight */}
                <div className="mt-8 flex justify-between items-center px-10 py-8 bg-white/5 rounded-[40px] border border-white/5">
                   <div className="flex items-center gap-4">
                      <Zap className="text-primary/60" size={24} />
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Integrated Engagement Metrics Verified by Core Academic Ledger</p>
                   </div>
                   <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest group">
                      Analytics Documentation <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
            </div>
        </ErpLayout>
    );
};

export default AttendancePage;
