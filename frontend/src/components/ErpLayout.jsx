import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from './Toast';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';


/**
 * ErpLayout v4.1 — Optimized for 'Aether' Design System.
 * Handles the persistent dashboard shell with a glassmorphic sidebar and responsive main content area.
 */
export default function ErpLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { isOpen } = useChatStore();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex font-sans antialiased overflow-hidden main-content-wrap">
      {/* Background Ambience (Global) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="bg-blob w-[800px] h-[800px] top-[-200px] left-[-200px] bg-primary opacity-[0.015]" />
          <div className="bg-blob w-[600px] h-[600px] bottom-[-100px] right-[-100px] bg-secondary opacity-[0.01]" />
      </div>

      {/* Persistence Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Scrollable Command Center */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto relative z-10 scrollbar-hide">
        {/* Persistent Header with Contextual Title */}
        <Header title={title} subtitle={subtitle} />

        {/* Dynamic Page Content with Entrance Animation */}
        <div className="flex-1 wrapper w-full animate-fade-in-up mt-4">
          {children}
        </div>
        
      </main>

      {/* Overlay Notifications */}
      <ToastContainer />
    </div>
  );
}
