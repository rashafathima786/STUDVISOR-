import React, { useState } from 'react';
import ErpLayout from '../components/ErpLayout';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Shield, Palette, Globe, Moon, Sun, Monitor,
  Eye, EyeOff, LogOut, ChevronRight, Check, Smartphone,
  BookOpen, GraduationCap, Mail, Phone, MapPin, Calendar
} from 'lucide-react';

// ── Small reusable components ─────────────────────────────────────────────────

function SettingsSection({ title, description, icon: Icon, children }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Icon size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-on-surface">{title}</h2>
          {description && <p className="text-xs text-on-surface-variant/60 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function SettingsRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-variant/50 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
        checked ? 'bg-primary shadow-[0_0_12px_rgba(124,58,237,0.4)]' : 'bg-surface-container-highest'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  );
}

function SelectChip({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            value === opt.value
              ? 'bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-white/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function InfoField({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon size={15} className="text-on-surface-variant/50 flex-shrink-0" />}
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-semibold text-on-surface mt-0.5">{value || '—'}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();

  // Preferences state (persisted to localStorage)
  const load = (key, def) => {
    try { return JSON.parse(localStorage.getItem(`setting_${key}`)) ?? def; }
    catch { return def; }
  };
  const save = (key, val) => localStorage.setItem(`setting_${key}`, JSON.stringify(val));

  const [theme, setTheme] = useState(() => load('theme', 'dark'));
  const [accentColor, setAccentColor] = useState(() => load('accent', 'violet'));
  const [notifAnnounce, setNotifAnnounce] = useState(() => load('notif_announce', true));
  const [notifAssign, setNotifAssign] = useState(() => load('notif_assign', true));
  const [notifAttend, setNotifAttend] = useState(() => load('notif_attend', true));
  const [notifExam, setNotifExam] = useState(() => load('notif_exam', true));
  const [notifLeave, setNotifLeave] = useState(() => load('notif_leave', false));
  const [compactMode, setCompactMode] = useState(() => load('compact', false));
  const [animationsOn, setAnimationsOn] = useState(() => load('animations', true));
  const [language, setLanguage] = useState(() => load('language', 'en'));
  const [showRollNo, setShowRollNo] = useState(() => load('show_roll', true));
  const [saved, setSaved] = useState(false);

  const persist = (setter, key) => (val) => {
    setter(val);
    save(key, val);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const accentOptions = [
    { value: 'violet', label: 'Violet', color: '#7c3aed' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'teal', label: 'Teal', color: '#10b981' },
    { value: 'rose', label: 'Rose', color: '#f43f5e' },
    { value: 'amber', label: 'Amber', color: '#f59e0b' },
  ];

  return (
    <ErpLayout title="Settings" subtitle="Manage your profile, preferences, and notifications">
      <div className="flex flex-col gap-6">

        {/* Saved Toast */}
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface-container border border-tertiary/30 text-tertiary text-sm font-bold shadow-xl transition-all duration-300 ${saved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <Check size={16} />
          Settings saved
        </div>

        {/* ── Profile Card (Full Width) ─────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-[0_0_24px_rgba(124,58,237,0.3)]"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-on-surface truncate" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
              {user?.full_name || 'Student'}
            </h3>
            <p className="text-sm text-on-surface-variant/60">{user?.username || ''}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary border border-primary/20">
                {role || 'student'}
              </span>
              {user?.department && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary/10 text-secondary border border-secondary/20">
                  {user.department}
                </span>
              )}
            </div>
          </div>
          <div className="hidden md:block pr-4">
             <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-bold hover:bg-error/20 transition-all"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* ── LEFT COLUMN ────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* ── Profile Information ───────────────────────────── */}
            <SettingsSection title="Profile Information" description="Your academic identity on record" icon={User}>
              <InfoField label="Full Name" value={user?.full_name} icon={User} />
              <InfoField label="Username / Roll No" value={user?.username} icon={GraduationCap} />
              <InfoField label="Department" value={user?.department} icon={BookOpen} />
              <InfoField label="Email" value={user?.email || `${user?.username}@studvisor.edu`} icon={Mail} />
              <SettingsRow label="Show Roll No publicly" description="Visible on leaderboard & campus wall">
                <Toggle checked={showRollNo} onChange={persist(setShowRollNo, 'show_roll')} />
              </SettingsRow>
            </SettingsSection>

            {/* ── Appearance ────────────────────────────────────── */}
            <SettingsSection title="Appearance" description="Personalise your visual experience" icon={Palette}>
              <SettingsRow label="Theme" description="Interface colour mode">
                <SelectChip
                  value={theme}
                  onChange={persist(setTheme, 'theme')}
                  options={[
                    { value: 'dark', label: '🌑 Dark' },
                    { value: 'system', label: '💻 System' },
                  ]}
                />
              </SettingsRow>
              <SettingsRow label="Accent Colour" description="Primary highlight colour across UI">
                <div className="flex gap-2">
                  {accentOptions.map(a => (
                    <button
                      key={a.value}
                      onClick={() => persist(setAccentColor, 'accent')(a.value)}
                      title={a.label}
                      style={{ background: a.color }}
                      className={`w-7 h-7 rounded-full transition-all border-2 ${accentColor === a.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </SettingsRow>
              <SettingsRow label="Compact Mode" description="Reduce padding and card spacing">
                <Toggle checked={compactMode} onChange={persist(setCompactMode, 'compact')} />
              </SettingsRow>
              <SettingsRow label="Animations" description="Entrance animations and micro-interactions">
                <Toggle checked={animationsOn} onChange={persist(setAnimationsOn, 'animations')} />
              </SettingsRow>
            </SettingsSection>

            {/* ── Language ──────────────────────────────────────── */}
            <SettingsSection title="Language & Region" description="Interface language preferences" icon={Globe}>
              <SettingsRow label="Interface Language" description="Applied across all pages">
                <SelectChip
                  value={language}
                  onChange={persist(setLanguage, 'language')}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'हिंदी' },
                    { value: 'ta', label: 'Tamil' },
                  ]}
                />
              </SettingsRow>
            </SettingsSection>
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* ── Notifications ─────────────────────────────────── */}
            <SettingsSection title="Notifications" description="Choose what alerts you receive" icon={Bell}>
              <SettingsRow label="Announcements" description="Campus-wide and department notices">
                <Toggle checked={notifAnnounce} onChange={persist(setNotifAnnounce, 'notif_announce')} />
              </SettingsRow>
              <SettingsRow label="Assignment Deadlines" description="Reminders 24 hours before due date">
                <Toggle checked={notifAssign} onChange={persist(setNotifAssign, 'notif_assign')} />
              </SettingsRow>
              <SettingsRow label="Attendance Alerts" description="Warnings when attendance drops below 75%">
                <Toggle checked={notifAttend} onChange={persist(setNotifAttend, 'notif_attend')} />
              </SettingsRow>
              <SettingsRow label="Exam Schedule" description="Upcoming exam reminders">
                <Toggle checked={notifExam} onChange={persist(setNotifExam, 'notif_exam')} />
              </SettingsRow>
              <SettingsRow label="Leave Status" description="Updates on leave approval / rejection">
                <Toggle checked={notifLeave} onChange={persist(setNotifLeave, 'notif_leave')} />
              </SettingsRow>
            </SettingsSection>

            {/* ── Security ──────────────────────────────────────── */}
            <SettingsSection title="Security" description="Account access and session management" icon={Shield}>
              <SettingsRow label="Active Session" description={`Logged in as ${user?.username || 'student'}`}>
                <span className="flex items-center gap-1.5 text-xs font-bold text-tertiary">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  Active
                </span>
              </SettingsRow>
              <SettingsRow label="Change Password" description="Update your login credentials">
                <button className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-on-surface-variant hover:bg-white/5 transition-colors flex items-center gap-2">
                  Update <ChevronRight size={12} />
                </button>
              </SettingsRow>
            </SettingsSection>

            {/* ── Quick Links ───────────────────────────────────── */}
            <SettingsSection title="Quick Navigation" description="Jump to key sections" icon={Smartphone}>
              <div className="grid grid-cols-2 divide-x divide-y divide-white/5 border-b border-white/5">
                {[
                  { label: 'Attendance', path: '/attendance' },
                  { label: 'GPA Engine', path: '/gpa' },
                  { label: 'Exam Table', path: '/exams' },
                  { label: 'Leave Req', path: '/leave' },
                ].map(({ label, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="p-5 hover:bg-white/[0.03] transition-colors text-left flex items-center justify-between group"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface/80 group-hover:text-primary transition-colors">{label}</span>
                    <ChevronRight size={14} className="text-on-surface-variant/20 group-hover:text-primary/40 transition-colors" />
                  </button>
                ))}
              </div>
            </SettingsSection>

            {/* ── Danger Zone (Mobile only or at bottom) ────────── */}
            <div className="md:hidden glass-panel rounded-2xl overflow-hidden border-error/20">
              <div className="p-5">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-6 rounded-2xl bg-error/10 border border-error/20 text-error text-sm font-bold hover:bg-error/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Version footer */}
        <p className="text-center text-[10px] text-on-surface-variant/30 uppercase tracking-widest pt-4 pb-2">
          Studvisor Elite v4.1.0 · Academic Session 2025–26
        </p>

      </div>
    </ErpLayout>
  );
}
