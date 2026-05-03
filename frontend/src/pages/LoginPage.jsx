import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { loginUser } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, ShieldCheck, Zap, AlertTriangle, ArrowRight, Activity, Terminal, GraduationCap, Building2 } from 'lucide-react';

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    // Add role selector: 'student' or 'college' (faculty/admin)
    const [loginRole, setLoginRole] = useState('student');
    
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...credentials,
                role: loginRole === 'college' ? 'faculty' : 'student'
            };
            const res = await loginUser(payload);
            const role = res.role || 'student';
            const userData = res.user || {};
            
            login(res.access_token, role, {
                id: userData.id,
                username: credentials.username,
                full_name: userData.name || userData.full_name || credentials.username,
                role,
                department: userData.department,
            });
            
            if (res.refresh_token) localStorage.setItem('erp_refresh_token', res.refresh_token);

            const from = location.state?.from?.pathname || (role === 'admin' ? "/admin/dashboard" : (role === 'faculty' || role === 'hod') ? "/faculty/dashboard" : "/dashboard");
            setTimeout(() => {
                 navigate(from, { replace: true });
            }, 600);
        } catch (err) {
            console.error("Login Error:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred.';
            setError(`Authentication failed: ${errorMessage}`);
            setLoading(false);
        }
    };

    const isStudent = loginRole === 'student';

    return (
        <div className="min-h-screen w-full bg-surface text-on-surface flex items-center justify-center relative overflow-hidden font-sans selection:bg-primary/30">
            
            {/* Interactive Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div 
                    className={`absolute w-[600px] h-[600px] rounded-full blur-[100px] transition-colors duration-1000 ${isStudent ? 'bg-primary/10' : 'bg-tertiary/10'}`}
                    animate={{ x: mousePosition.x - 300, y: mousePosition.y - 300 }}
                    transition={{ type: "spring", stiffness: 50, damping: 20, mass: 0.5 }}
                />
                <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse transition-colors duration-1000 ${isStudent ? 'bg-secondary/10' : 'bg-primary/10'}`} style={{ animationDuration: '8s' }} />
                <div className={`absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse transition-colors duration-1000 ${isStudent ? 'bg-tertiary/5' : 'bg-secondary/5'}`} style={{ animationDuration: '12s' }} />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(to right, var(--on-surface) 1px, transparent 1px), linear-gradient(to bottom, var(--on-surface) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--surface) 100%)]" />
            </div>

            <div className="relative z-10 w-full max-w-7xl px-6 py-12 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
                
                {/* Left Side: Brand & Hero */}
                <motion.div 
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-1 w-full flex flex-col items-center text-center lg:items-start lg:text-left"
                >
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        className="mb-8 relative group"
                    >
                        <div className="relative w-20 h-20 rounded-3xl glass-panel flex items-center justify-center shadow-2xl backdrop-blur-md">
                            <ShieldCheck size={36} className={isStudent ? 'text-primary' : 'text-tertiary'} />
                        </div>
                    </motion.div>
                    
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6 leading-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                        Studvisor <br/>
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r transition-all duration-700 ${isStudent ? 'from-primary via-secondary to-tertiary' : 'from-tertiary via-secondary to-primary'}`}>
                            Nexus
                        </span>
                    </h1>
                    
                    <p className="text-on-surface-variant/70 text-lg lg:text-xl max-w-md font-medium leading-relaxed mb-12">
                        {isStudent 
                            ? 'Advanced campus intelligence and academic orchestration platform for modern scholars.' 
                            : 'High-fidelity command center for faculty and administrative operations.'}
                    </p>

                    <div className="flex gap-6 justify-center lg:justify-start w-full">
                        <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-2xl border border-border-color">
                            <Activity size={16} className={`${isStudent ? 'text-primary' : 'text-tertiary'} animate-pulse`} />
                            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Core Online</span>
                        </div>
                        <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-2xl border border-border-color">
                            <Terminal size={16} className="text-secondary" />
                            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">v4.1.0-beta</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Authentication Terminal */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="w-full max-w-md relative"
                >
                    <div className="relative glass-panel rounded-[32px] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
                        
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-on-surface mb-2" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>Secure Access</h2>
                            <p className="text-sm font-medium text-on-surface-variant/60">Select authorization clearance level.</p>
                        </div>

                        {/* Role Selector Tabs */}
                        <div className="flex gap-2 mb-8 bg-surface-container p-1.5 rounded-2xl border border-border-color relative">
                            <button
                                type="button"
                                onClick={() => setLoginRole('student')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all z-10 ${isStudent ? 'text-on-surface' : 'text-on-surface-variant/40 hover:text-on-surface'}`}
                            >
                                <GraduationCap size={16} />
                                Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginRole('college')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all z-10 ${!isStudent ? 'text-on-surface' : 'text-on-surface-variant/40 hover:text-on-surface'}`}
                            >
                                <Building2 size={16} />
                                College
                            </button>
                            
                            <motion.div 
                                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl border transition-colors duration-300 ${isStudent ? 'bg-primary/20 border-primary/30' : 'bg-tertiary/20 border-tertiary/30'}`}
                                animate={{ x: isStudent ? '0%' : '100%' }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{ left: '0.375rem' }}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
                                >
                                    <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest leading-relaxed">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            
                            {/* Identifier Field */}
                            <div className="flex flex-col gap-2">
                                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${focusedField === 'username' ? (isStudent ? 'text-primary' : 'text-tertiary') : 'text-on-surface-variant/60'}`}>
                                    {isStudent ? 'Student ID' : 'Staff Identifier'}
                                </label>
                                <div className="relative">
                                    <Fingerprint 
                                        size={20} 
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'username' ? (isStudent ? 'text-primary' : 'text-tertiary') : 'text-on-surface-variant/40'}`} 
                                    />
                                    {/* The autofill-override class handles browser autocomplete styling */}
                                    <input 
                                        type="text" 
                                        className={`autofill-override w-full bg-surface-container border rounded-2xl py-4 pl-12 pr-4 text-on-surface text-sm outline-none transition-all duration-300 placeholder:text-on-surface-variant/20 ${focusedField === 'username' ? (isStudent ? 'border-primary/50 ring-1 ring-primary/50' : 'border-tertiary/50 ring-1 ring-tertiary/50') : 'border-border-color hover:border-on-surface/20'}`}
                                        placeholder={isStudent ? "e.g. CS21001" : "e.g. FAC001 / ADMIN"}
                                        required
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </div>
                            </div>

                            {/* Passcode Field */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${focusedField === 'password' ? (isStudent ? 'text-primary' : 'text-tertiary') : 'text-on-surface-variant/60'}`}>
                                        Passcode
                                    </label>
                                    <button type="button" className="text-[10px] font-bold text-on-surface-variant/40 hover:text-on-surface uppercase tracking-widest transition-colors">
                                        Recover?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock 
                                        size={20} 
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? (isStudent ? 'text-primary' : 'text-tertiary') : 'text-on-surface-variant/40'}`} 
                                    />
                                    <input 
                                        type="password" 
                                        className={`autofill-override w-full bg-surface-container border rounded-2xl py-4 pl-12 pr-4 text-on-surface text-sm outline-none transition-all duration-300 placeholder:text-on-surface-variant/20 tracking-[0.2em] ${focusedField === 'password' ? (isStudent ? 'border-primary/50 ring-1 ring-primary/50' : 'border-tertiary/50 ring-1 ring-tertiary/50') : 'border-border-color hover:border-on-surface/20'}`}
                                        placeholder="••••••••••••"
                                        required
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    className={`w-full relative overflow-hidden rounded-2xl font-bold uppercase tracking-[0.2em] text-xs h-14 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 ${isStudent ? 'bg-primary text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-tertiary text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                            <Zap size={18} />
                                        </motion.div>
                                    ) : (
                                        <>
                                            <span className="relative z-10">Establish Connection</span>
                                            <ArrowRight size={16} className="relative z-10" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center text-center px-6">
                <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.4em] opacity-40">
                    Department of Educational Technology • Secure Node
                </p>
            </div>
        </div>
    );
}
