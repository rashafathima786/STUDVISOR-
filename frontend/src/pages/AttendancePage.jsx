import React, { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { fetchOverallAttendance, fetchSubjectAttendance, fetchBunkAlerts } from '../services/api';
import ErpLayout from '../components/ErpLayout';


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
                // API returns { subjects: [...] } — extract the array
                setSubjects(Array.isArray(subs) ? subs : (subs?.subjects || []));
                // API returns { alerts: [...] } — extract the array
                setBunkAlerts(Array.isArray(alerts) ? alerts : (alerts?.alerts || []));
            } catch (err) {
                console.error("Attendance load error", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return (
        <div className="bg-surface min-h-screen flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Synchronizing Matrix...</p>
            </div>
        </div>
    );

    return (
        <ErpLayout title="Attendance Matrix" subtitle="Real-time engagement tracking across all modules">
            <div className="flex flex-col gap-8">
                {/* Header actions */}
                <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 glass-panel rounded-xl text-on-surface hover:bg-white/5 transition-colors border border-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        Current Term
                    </button>
                    <button className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(210,187,255,0.4)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Export Matrix
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Aggregate Score */}
                    <div className="lg:col-span-4 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-8xl">vital_signs</span>
                        </div>
                        <div className="inner-light-catch" />
                        <div>
                            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Aggregate Health</h2>
                            <div className="flex items-baseline gap-2">
                                <span className="text-7xl font-bold text-tertiary" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {overall?.percentage || '0.0'}
                                </span>
                                <span className="text-on-surface-variant font-bold text-2xl">%</span>
                            </div>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20">
                                <span className="material-symbols-outlined text-tertiary text-[14px]">trending_up</span>
                                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Stable Trajectory</span>
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-widest">
                                <span className="text-on-surface-variant">Threshold Distance</span>
                                <span className="text-on-surface">Optimal</span>
                            </div>
                            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-tertiary-container to-tertiary rounded-full transition-all duration-1000" 
                                    style={{ width: `${overall?.percentage || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bunkability Meter */}
                    <div className="lg:col-span-8 glass-panel rounded-2xl p-8 relative overflow-hidden">
                        <div className="inner-light-catch" />
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Strategic Reserve</h2>
                                <p className="text-sm text-on-surface-variant/70">Calculated based on 75% mandatory threshold.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {bunkAlerts.length > 0 ? bunkAlerts.slice(0, 4).map((alert, idx) => (
                                <div key={idx} className="glass-panel-light rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-all">
                                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 truncate w-full">
                                        {alert.subject_name}
                                    </span>
                                    <div className={`relative w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all group-hover:scale-110 ${alert.safe_bunks > 0 ? 'border-secondary/40 group-hover:border-secondary' : 'border-error/40 group-hover:border-error'}`}>
                                        <span className={`text-xl font-bold ${alert.safe_bunks > 0 ? 'text-secondary' : 'text-error'}`} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                            {alert.safe_bunks}
                                        </span>
                                    </div>
                                    <span className="text-[10px] mt-3 font-medium text-on-surface-variant/60 uppercase tracking-widest">
                                        {alert.safe_bunks > 0 ? 'Bunks left' : 'Critical'}
                                    </span>
                                </div>
                            )) : (
                                <div className="col-span-4 py-8 text-center opacity-40">No strategic reserve data available</div>
                            )}
                        </div>
                    </div>

                    {/* Module Breakdown Table */}
                    <div className="lg:col-span-12 glass-panel rounded-2xl overflow-hidden flex flex-col">
                        <div className="inner-light-catch" />
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Module Breakdown</h2>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-[18px]">filter_list</span></button>
                                <button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant transition-colors"><span className="material-symbols-outlined text-[18px]">search</span></button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.01] border-b border-white/5">
                                        <th className="py-4 px-8 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">Code</th>
                                        <th className="py-4 px-8 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">Subject</th>
                                        <th className="py-4 px-8 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">Conducted</th>
                                        <th className="py-4 px-8 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">Attended</th>
                                        <th className="py-4 px-8 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">Ratio</th>
                                        <th className="py-4 px-8 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {subjects.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-5 px-8 text-sm font-bold text-primary/80" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{s.code}</td>
                                            <td className="py-5 px-8 text-sm text-on-surface font-semibold">{s.subject}</td>
                                            <td className="py-5 px-8 text-sm text-on-surface-variant/60 font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{s.total}</td>
                                            <td className="py-5 px-8 text-sm text-on-surface font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{s.present}</td>
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-sm font-bold ${s.percentage >= 75 ? 'text-tertiary' : 'text-error'}`} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                                        {s.percentage}%
                                                    </span>
                                                    <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${s.percentage >= 75 ? 'bg-tertiary' : 'bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)]'}`} 
                                                            style={{ width: `${s.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${s.percentage >= 75 ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-error/10 text-error border-error/20'}`}>
                                                    {s.percentage >= 75 ? 'Optimal' : 'Critical'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ErpLayout>
    );
};

export default AttendancePage;
