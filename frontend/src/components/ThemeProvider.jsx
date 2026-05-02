import React, { useEffect } from 'react';
import useUIStore from '../stores/uiStore';

const accentColors = {
  violet: { primary: '#7c3aed', container: '#6d28d9', rgb: '124, 58, 237' },
  blue: { primary: '#3b82f6', container: '#2563eb', rgb: '59, 130, 246' },
  teal: { primary: '#10b981', container: '#059669', rgb: '16, 185, 129' },
  rose: { primary: '#f43f5e', container: '#dc2626', rgb: '244, 63, 94' },
  amber: { primary: '#f59e0b', container: '#d97706', rgb: '245, 158, 11' },
};

export default function ThemeProvider({ children }) {
  const { theme, accentColor, compactMode, animationsOn } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // 1. Theme (Dark/Light/System)
    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const setClasses = (isDark) => {
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);
      body.classList.toggle('dark', isDark);
      body.classList.toggle('light', !isDark);
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    setClasses(activeTheme === 'dark');

    // 2. Accent Color
    const colors = accentColors[accentColor] || accentColors.violet;
    
    // Set variables on root and body
    [root, body].forEach(el => {
      el.style.setProperty('--color-primary', colors.primary, 'important');
      el.style.setProperty('--color-primary-container', colors.container, 'important');
      el.style.setProperty('--primary-rgb', colors.rgb, 'important');
    });
    
    // Inject global styles to ensure overrides take effect
    let styleTag = document.getElementById('studvisor-theme-overrides');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'studvisor-theme-overrides';
      document.head.appendChild(styleTag);
    }
    
    const isDark = activeTheme === 'dark';
    styleTag.innerHTML = `
      :root, .light, [data-theme='light'] {
        --surface: ${isDark ? '#131315' : '#f8fafc'} !important;
        --on-surface: ${isDark ? '#ffffff' : '#0f172a'} !important;
      }
      ${!animationsOn ? `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      ` : ''}
      ${compactMode ? `
        .glass-panel { padding: 1rem !important; }
        .p-10 { padding: 1.5rem !important; }
        .p-8 { padding: 1.25rem !important; }
        .gap-6 { gap: 1rem !important; }
        .gap-8 { gap: 1.25rem !important; }
        .mb-10 { margin-bottom: 1.5rem !important; }
      ` : ''}
    `;

  }, [theme, accentColor, compactMode, animationsOn]);

  return (
    <>
      {children}
      {/* Theme Indicator (Dev) */}
      <div className="fixed bottom-4 left-4 z-[9999] px-3 py-1.5 bg-on-surface/10 backdrop-blur-md text-on-surface text-[9px] font-black rounded-full opacity-30 pointer-events-none uppercase tracking-[0.2em] border border-on-surface/5 hidden md:block">
        Theme: {theme} | Accent: {accentColor}
      </div>
    </>
  );
}
