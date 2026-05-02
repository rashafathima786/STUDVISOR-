import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Sun, Moon, Menu, User, LogOut, ChevronDown, Bot, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications } from '../services/api';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import useChatStore from '../stores/chatStore';
import ChatbotLogo from './ui/ChatbotLogo';


/**
 * Header v4.1 — Precision Command Bar.
 * Unified search, theme orchestration, and real-time notification telemetry.
 */
export default function Header({ title, subtitle }) {
  const [notifs, setNotifs] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, setTheme } = useUIStore();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { toggleChat, isOpen } = useChatStore();

  useEffect(() => {
    fetchNotifications()
      .then(res => setNotifs(res?.notifications || []))
      .catch(() => {});
  }, []);

  // Global theme management is now handled by ThemeProvider

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const unreadCount = notifs.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || user?.username || 'User';
  const roleLabel = (role || 'student').charAt(0).toUpperCase() + (role || 'student').slice(1);

  return (
    <header className="sticky top-0 z-[30] bg-surface/80 backdrop-blur-md border-b border-panel-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      
      {/* Left: Context & Navigation */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <div className="animate-fade-in-up">
          <h1 className="text-on-surface tracking-tight" style={{ 
            fontFamily: 'var(--font-jakarta)',
            fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)',
            fontWeight: 800
          }}>
            {title}
          </h1>
          {subtitle && (
            <p className="font-bold text-on-surface-variant uppercase tracking-widest opacity-60 line-clamp-1 max-w-[150px] md:max-w-none" style={{
              fontSize: 'clamp(0.5rem, 0.45rem + 0.2vw, 0.65rem)'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Global Search Core */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-container-low rounded-xl border border-white/5 focus-within:border-primary/30 transition-all w-64">
          <Search size={16} className="text-on-surface-variant/40" />
          <input 
            type="text" 
            placeholder="Command Search..." 
            className="bg-transparent text-sm text-on-surface outline-none w-full placeholder:text-on-surface-variant/30"
          />
        </div>

        {/* Theme Orchestration */}
        <button 
          className="p-2.5 rounded-xl hover:bg-white/5 text-on-surface-variant transition-all active:scale-95" 
          onClick={toggleTheme} 
          title="Switch Reality"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Notification Telemetry */}
        <div className="relative" ref={notifRef}>
          <button 
            className={`p-2.5 rounded-xl hover:bg-white/5 text-on-surface-variant transition-all active:scale-95 ${unreadCount > 0 ? 'text-primary' : ''}`}
            onClick={() => setShowPanel(!showPanel)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(124,58,237,0.6)] animate-pulse" />
            )}
          </button>

          {showPanel && (
            <div className="absolute top-full right-0 mt-4 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Intelligence Feed</span>
                    {unreadCount > 0 && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold">{unreadCount} NEW</span>}
                </div>
                <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                    {notifs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-on-surface-variant/40 italic">No active data streams</div>
                    ) : (
                        notifs.map(n => (
                            <div key={n.id} className="p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="flex gap-3">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-primary" />
                                    <div>
                                        <p className="text-xs font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{n.title}</p>
                                        <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">{n.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}
        </div>

        {/* Intelligence Orchestrator (Chatbot) */}
        <button 
          className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center
            ${isOpen ? 'bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'hover:bg-white/5 text-on-surface-variant'}
          `} 
          onClick={toggleChat}
          title="Studvisor AI"
        >
          <ChatbotLogo size={20} />
        </button>

        {/* Identity & Session Control */}
        <div className="relative" ref={userMenuRef}>
          <button 
            className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-all border border-panel-border"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-on-surface">{displayName}</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{roleLabel}</span>
            </div>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-primary-soft flex items-center justify-center text-primary border border-primary/20">
              <User size={14} />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-4 w-56 glass-panel rounded-2xl shadow-2xl p-2 animate-fade-in-up">
              <button 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-all"
                onClick={() => navigate('/settings')}
              >
                <SettingsIcon size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Preferences</span>
              </button>
              <div className="h-px bg-white/5 my-2 mx-2" />
              <button 
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all group"
                onClick={handleLogout}
              >
                <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOut size={14} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
