import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { fetchOverallAttendance, fetchCGPA, fetchTodaySchedule } from '../services/api';
import ErpLayout from '../components/ErpLayout';

const DashboardPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState(null);
    const [cgpa, setCgpa] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [attData, gpaData, schedData] = await Promise.all([
                    fetchOverallAttendance(),
                    fetchCGPA(),
                    fetchTodaySchedule()
                ]);
                setAttendance(attData);
                setCgpa(gpaData);
                setSchedule(Array.isArray(schedData) ? schedData : (schedData?.timetable || []));
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Attendance Card — 8 cols */}
                <div className="glass-panel rounded-2xl p-8 md:col-span-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:bg-tertiary/20" />
                    <div className="inner-light-catch" />

                    <div className="flex justify-between items-start z-10">
                        <div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-tertiary-container/20 border border-tertiary/30 mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-2 animate-pulse" />
                                <span className="text-[10px] text-tertiary uppercase tracking-wider font-bold">Active Attendance Monitoring</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white leading-none mb-1" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                                Overall Presence
                            </h3>
                            <p className="text-on-surface-variant/60 text-sm">Real-time sync • Academic Cycle 2026</p>
                        </div>
                        <button
                            onClick={() => navigate('/attendance')}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
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
                        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
                            <div>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Classes</p>
                                <p className="text-2xl text-white font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {attendance?.total || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Classes Attended</p>
                                <p className="text-2xl text-white font-medium" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
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
                <div className="glass-panel rounded-2xl p-8 md:col-span-4 flex flex-col relative overflow-hidden group cursor-pointer" onClick={() => navigate('/gpa')}>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px] -mr-24 -mb-24 transition-all group-hover:bg-secondary/20" />
                    <div className="inner-light-catch" />

                    <div className="flex justify-between items-start mb-10 z-10">
                        <div className="p-3 rounded-2xl bg-secondary-container/20 border border-secondary/20 shadow-[0_0_20px_rgba(0,210,253,0.1)]">
                            <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
                        </div>
                        <span className="text-[10px] font-bold text-secondary-fixed bg-secondary-container/20 px-3 py-1 rounded-full border border-secondary/20 uppercase tracking-widest">
                            High Fidelity
                        </span>
                    </div>

                    <div className="z-10 mt-auto">
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                            Academic Transcript
                        </h3>
                        <p className="text-on-surface-variant/70 text-sm mb-6">Cumulative Grade Point Average across all semesters.</p>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-5xl font-bold text-white tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {cgpa?.cgpa?.toFixed(2) || '0.00'}
                            </span>
                            <span className="text-secondary font-bold text-lg mb-1 flex items-center">
                                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                                +0.2
                            </span>
                        </div>

                        <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-2">
                            <div
                                className="bg-secondary h-1.5 rounded-full shadow-[0_0_10px_rgba(0,210,253,0.4)]"
                                style={{ width: `${((cgpa?.cgpa || 0) / 10) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                            <span>Target: 9.00</span>
                            <span>{cgpa?.cgpa ? `${((cgpa.cgpa / 9) * 100).toFixed(0)}% to target` : '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Today's Timeline — full width */}
                <div className="glass-panel rounded-2xl p-8 col-span-12 relative overflow-hidden">
                    <div className="inner-light-catch" />
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
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
                            <div key={idx} className="min-w-[220px] flex-1 glass-panel-light p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                                        Hour {slot.hour}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shadow-[0_0_8px_rgba(210,187,255,0.4)]" />
                                </div>
                                <p className="text-white font-bold text-lg mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
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
                {[
                    { label: 'Attendance', icon: 'fact_check', path: '/attendance', color: 'tertiary', value: `${attendance?.percentage || 0}%` },
                    { label: 'GPA / Results', icon: 'grade', path: '/gpa', color: 'secondary', value: cgpa?.cgpa?.toFixed(2) || '—' },
                    { label: 'Timetable', icon: 'calendar_month', path: '/timetable', color: 'primary', value: 'Full Schedule' },
                    { label: 'Fees', icon: 'payments', path: '/fees', color: 'error', value: 'Check Status' },
                ].map(({ label, icon, path, color, value }) => (
                    <div
                        key={path}
                        onClick={() => navigate(path)}
                        className="glass-panel rounded-2xl p-6 md:col-span-3 cursor-pointer hover:scale-[1.02] transition-transform group"
                    >
                        <div className={`p-3 rounded-xl bg-${color}/10 border border-${color}/20 w-fit mb-4`}>
                            <span className={`material-symbols-outlined text-${color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        </div>
                        <p className="text-on-surface-variant/60 text-[10px] uppercase tracking-widest font-bold mb-1">{label}</p>
                        <p className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{value}</p>
                    </div>
                ))}

            </div>
        </ErpLayout>
    );
};

export default DashboardPage;
