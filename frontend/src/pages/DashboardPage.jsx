import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { 
    fetchOverallAttendance, 
    fetchCGPA, 
    fetchTodaySchedule, 
    fetchPlacementDrives, 
    fetchHelpdeskStats 
} from '../services/api';
import ErpLayout from '../components/ErpLayout';

const DashboardPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState(null);
    const [cgpa, setCgpa] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [placementCount, setPlacementCount] = useState(0);
    const [activeTickets, setActiveTickets] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [attData, gpaData, schedData, placementRes, helpdeskRes] = await Promise.all([
                    fetchOverallAttendance(),
                    fetchCGPA(),
                    fetchTodaySchedule(),
                    fetchPlacementDrives().catch(() => ({ drives: [] })),
                    fetchHelpdeskStats().catch(() => ({ active_tickets: 0 }))
                ]);
                setAttendance(attData);
                setCgpa(gpaData);
                setSchedule(Array.isArray(schedData) ? schedData : (schedData?.timetable || []));
                setPlacementCount(placementRes.drives?.length || 0);
                setActiveTickets(helpdeskRes.active_tickets || 0);
            } catch (err) {
                console.error("Dashboard data load error", err);
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
                <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Syncing Aether Core...</p>
            </div>
        </div>
    );

    const firstName = user?.full_name?.split(' ')[0] || 'Scholar';

    return (
        <ErpLayout
            title={`Welcome back, ${firstName}`}
            subtitle="System status: Optimal • Viewing active academic portfolio"
        >
            {/* Bento Grid */}
            <div className="flex flex-col space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 w-full items-stretch">

                {/* Attendance Card — 8 cols */}
                <div className="glass-panel rounded-2xl p-5 md:p-8 md:col-span-8 flex flex-col justify-between min-h-[280px] md:min-h-[300px] relative overflow-hidden group w-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-tertiary/20" />
                    <div className="inner-light-catch" />

                    <div className="flex justify-between items-start z-10">
                        <div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-tertiary-container/20 border border-tertiary/30 mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-2 animate-pulse" />
                                <span className="text-[10px] text-tertiary uppercase tracking-wider font-bold">Active Attendance Monitoring</span>
                            </div>
                            <h3 className="text-xl md:text-3xl font-bold text-on-surface leading-tight md:leading-none mb-1 break-words" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                                Overall Presence
                            </h3>
                            <p className="text-on-surface-variant/60 text-sm">Real-time sync • Academic Cycle 2026</p>
                        </div>
                        <button
                            onClick={() => navigate('/attendance')}
                            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all border border-panel-border"
                        >
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>

                    <div className="z-10 mt-8">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px]">Processing Pipeline</span>
                            <span className="text-tertiary font-bold text-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {attendance?.percentage || 0}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-tertiary-container to-tertiary rounded-full shadow-[0_0_15px_rgba(78,222,163,0.4)] transition-all duration-1000"
                                style={{ width: `${attendance?.percentage || 0}%` }}
                            />
                        </div>
                        {/* Mobile Bunkability Summary */}
                        <div className="md:hidden mt-6 pt-4 border-t border-border-color flex items-center justify-between z-10">
                            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Bunk Reserve</span>
                            <span className={`text-xs font-black uppercase ${attendance?.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {attendance?.percentage >= 85 ? 'Optimal' : attendance?.percentage >= 75 ? 'Borderline' : 'Critical'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-panel-border">
                            <div>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Classes</p>
                                <p className="text-2xl text-on-surface font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {attendance?.total || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Classes Attended</p>
                                <p className="text-2xl text-on-surface font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {attendance?.present || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Bunk Safety</p>
                                <p className="text-2xl font-medium" style={{ fontFamily: 'var(--font-space-grotesk)', color: attendance?.percentage >= 75 ? '#4EDE9F' : '#FF6B6B' }}>
                                    {attendance?.percentage >= 85 ? 'Optimal' : attendance?.percentage >= 75 ? 'Borderline' : 'Critical'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CGPA Card — 4 cols */}
                <div className="glass-panel rounded-2xl p-5 md:p-8 md:col-span-4 flex flex-col relative overflow-hidden group cursor-pointer w-full" onClick={() => navigate('/gpa')}>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] -mr-24 -mb-24 transition-all group-hover:bg-secondary/20" />
                    <div className="inner-light-catch" />

                    <div className="flex justify-between items-start mb-6 md:mb-10 z-10">
                        <div className="p-3 rounded-2xl bg-secondary-container/20 border border-secondary/20 shadow-[0_0_20px_rgba(0,210,253,0.1)]">
                            <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                        </div>
                        <span className="text-[10px] font-bold text-secondary-fixed bg-secondary-container/20 px-3 py-1 rounded-full border border-secondary/20 uppercase tracking-widest">
                            Academic Status
                        </span>
                    </div>

                    <div className="z-10 mt-auto">
                        <h3 className="text-lg md:text-2xl font-bold text-on-surface mb-2 tracking-tight break-words" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                            Grade Quotient
                        </h3>
                        <p className="text-on-surface-variant/70 text-sm mb-4 md:mb-6">Cumulative Grade Point Average sync.</p>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-4xl md:text-5xl font-bold text-on-surface tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {cgpa?.cgpa?.toFixed(2) || '0.00'}
                            </span>
                            <span className="text-secondary font-black text-[10px] mb-2 uppercase tracking-widest">
                                Verified
                            </span>
                        </div>

                        <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-2">
                            <div
                                className="bg-secondary h-1.5 rounded-full shadow-[0_0_10px_rgba(0,210,253,0.4)]"
                                style={{ width: `${((cgpa?.cgpa || 0) / 10) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Placement & Helpdesk Grid — 12 cols */}
                <div className="col-span-12 flex flex-col md:grid md:grid-cols-2 gap-6">
                    <div 
                        onClick={() => navigate('/placement')}
                        className="glass-panel p-8 rounded-3xl border-white/5 cursor-pointer group hover:bg-white/5 transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-6xl">work</span>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <div>
                                <h4 className="text-on-surface font-bold tracking-tight">Placement Intelligence</h4>
                                <p className="text-[10px] text-on-surface-variant/40 uppercase font-black tracking-widest">{placementCount} Active Corporate Streams</p>
                            </div>
                        </div>
                        <p className="text-sm text-on-surface-variant/60 leading-relaxed mb-6">Track your career trajectory and apply to premium corporate portfolios.</p>
                        <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest gap-2">
                            Access Portal <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </div>
                    </div>

                    <div 
                        onClick={() => navigate('/helpdesk')}
                        className="glass-panel p-8 rounded-3xl border-white/5 cursor-pointer group hover:bg-white/5 transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-6xl">support_agent</span>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                                <span className="material-symbols-outlined">help</span>
                            </div>
                            <div>
                                <h4 className="text-on-surface font-bold tracking-tight">Support Terminal</h4>
                                <p className="text-[10px] text-on-surface-variant/40 uppercase font-black tracking-widest">{activeTickets} Ongoing Syncs</p>
                            </div>
                        </div>
                        <p className="text-sm text-on-surface-variant/60 leading-relaxed mb-6">Resolve academic inquiries and initiate secure support requests.</p>
                        <div className="flex items-center text-amber-400 text-[10px] font-black uppercase tracking-widest gap-2">
                            Open Helpdesk <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </div>
                    </div>
                </div>

                {/* Today's Timeline — full width */}
                <div className="glass-panel rounded-2xl p-8 col-span-12 relative overflow-hidden">
                    <div className="inner-light-catch" />
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                            Operational Timeline — Today
                        </h3>
                        <button
                            onClick={() => navigate('/timetable')}
                            className="text-primary hover:text-primary-fixed transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                            View Full Schedule
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {schedule.length > 0 ? schedule.map((slot, idx) => (
                            <div key={idx} className="min-w-[220px] flex-1 glass-panel-light p-6 rounded-2xl border border-border-color hover:border-primary/20 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                                        Hour {slot.hour}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" />
                                </div>
                                <p className="text-on-surface font-bold text-lg mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                                    {slot.subject || 'Class Session'}
                                </p>
                                <p className="text-on-surface-variant/50 text-xs mb-2">{slot.faculty || ''}</p>
                                <div className="flex items-center gap-2 text-on-surface-variant/60 text-xs">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    {slot.room || 'TBA'}
                                </div>
                            </div>
                        )) : (
                            <div className="w-full flex flex-col items-center justify-center py-10 opacity-40">
                                <span className="material-symbols-outlined text-4xl mb-2">calendar_today</span>
                                <p>No active sessions scheduled for today</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Nav Cards */}
                <div className="col-span-12 flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-6 mt-4">
                    {[
                        { label: 'Attendance', icon: 'fact_check', path: '/attendance', color: 'tertiary', value: `${attendance?.percentage || 0}%` },
                        { label: 'Placements', icon: 'rocket_launch', path: '/placement', color: 'primary', value: `${placementCount} Drives` },
                        { label: 'Financials', icon: 'payments', path: '/fees', color: 'success', value: 'Ledger Sync' },
                        { label: 'Helpdesk', icon: 'support_agent', path: '/helpdesk', color: 'warning', value: `${activeTickets} Tickets` },
                    ].map(({ label, icon, path, color, value }) => (
                        <div
                            key={path}
                            onClick={() => navigate(path)}
                            className="glass-panel rounded-2xl p-4 md:p-6 cursor-pointer hover:scale-[1.02] transition-transform group"
                        >
                            <div className={`p-2 md:p-3 rounded-xl bg-surface-container border border-border-color w-fit mb-3 md:mb-4 group-hover:bg-primary/20 transition-colors`}>
                                <span className={`material-symbols-outlined text-on-surface text-lg md:text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                            </div>
                            <p className="text-on-surface-variant/60 text-[9px] md:text-[10px] uppercase tracking-widest font-black mb-1">{label}</p>
                            <p className="text-on-surface font-black text-lg md:text-xl tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{value}</p>
                        </div>
                    ))}
                </div>

            </div>
        </ErpLayout>
    );
};

export default DashboardPage;
