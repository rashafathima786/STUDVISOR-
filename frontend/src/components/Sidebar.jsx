import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  GraduationCap, 
  ShieldCheck, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  Users,
  Cpu,
  History,
  FileText
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';

const navData = {
  student: [
    { to: '/dashboard',    icon: <LayoutDashboard size={18} />, label: 'NEXUS' },
    { to: '/attendance',   icon: <Activity size={18} />,        label: 'MATRIX' },
    { to: '/academics',    icon: <GraduationCap size={18} />,   label: 'ACADEMIA' },
    { to: '/performance',  icon: <ShieldCheck size={18} />,     label: 'PERFORMANCE' },
    { to: '/campus',       icon: <MessageSquare size={18} />,   label: 'CAMPUS LIFE' },
    { to: '/services',     icon: <Settings size={18} />,        label: 'SERVICES' },
  ],
  faculty: [
    { to: '/faculty/dashboard', icon: <LayoutDashboard size={18} />, label: 'NEXUS' },
    { to: '/faculty/attendance', icon: <Activity size={18} />,        label: 'ROSTER' },
    { to: '/faculty/marks',      icon: <ShieldCheck size={18} />,     label: 'ACADEMIA' },
    { to: '/faculty/lecture-logs', icon: <GraduationCap size={18} />, label: 'DIARY' },
    { to: '/faculty/assignments',  icon: <FileText size={18} />,      label: 'ASSESS' },
    { to: '/faculty/leaves',     icon: <MessageSquare size={18} />,   label: 'REQUESTS' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: <ShieldCheck size={18} />,     label: 'COMMAND' },
    { to: '/admin/students',  icon: <Users size={18} />,           label: 'STUDENTS' },
    { to: '/admin/faculty',   icon: <Cpu size={18} />,             label: 'FACULTY' },
    { to: '/admin/analytics', icon: <Activity size={18} />,        label: 'INTEL' },
    { to: '/admin/audit',     icon: <History size={18} />,         label: 'AUDIT' },
  ]
};

export default function Sidebar({ onLogout }) {
  const role = useAuthStore((s) => s.role);
  const { sidebarOpen, closeSidebar } = useUIStore();
  const navItems = navData[role] || navData.student;

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] w-64 bg-surface-container-low
        border-r border-panel-border transition-transform duration-500 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col pt-8 pb-6 px-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-4 mb-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <GraduationCap className="text-white" size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight leading-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Studvisor
              </h2>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">
                ELITE V4.1
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) => `
                  group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-primary/10 text-on-surface border border-primary/20' 
                    : 'text-on-surface-variant/60 hover:bg-on-surface/[0.03] hover:text-on-surface'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-4">
                      <div className={`w-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`}>
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold tracking-[0.1em]">{item.label}</span>
                    </div>
                    {isActive && <div className="w-1 h-4 bg-primary rounded-full" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
            <NavLink
              to="/settings"
              onClick={closeSidebar}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant/60 hover:bg-on-surface/[0.03] hover:text-on-surface'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="w-5 flex items-center justify-center transition-colors duration-300">
                    <Settings size={18} className={isActive ? 'text-primary' : ''} />
                  </div>
                  <span className="text-[11px] font-bold tracking-[0.1em]">SETTINGS</span>
                </>
              )}
            </NavLink>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[#ff4444]/70 hover:text-[#ff4444] hover:bg-red-500/10 transition-all"
            >
              <div className="w-5 flex items-center justify-center">
                <LogOut size={18} />
              </div>
              <span className="text-[11px] font-bold tracking-[0.1em]">TERMINATE</span>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
