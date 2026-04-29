import { Bot, X, Maximize2, Minimize2 } from 'lucide-react'
import useChatStore from '../stores/chatStore'
import ChatBox from './ChatBox'

export default function FloatingChatWidget({ contextPage = 'dashboard' }) {
  const { isOpen, isFullScreen, setChatOpen, toggleFullScreen } = useChatStore()

  return (
    <div className="floating-chat-shell">
      {isOpen ? (
        <div className={`floating-chat-panel sidebar-chat-panel ${isFullScreen ? 'full-screen' : ''}`}>
          <div className="floating-chat-titlebar">
            <div className="floating-chat-title">
              <Bot size={18} />
              <span>ERP Assistant</span>
            </div>
            <div className="floating-chat-actions">
              <button
                type="button"
                className="floating-chat-icon-btn"
                onClick={toggleFullScreen}
                aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
                title={isFullScreen ? "Minimize" : "Maximize"}
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                type="button"
                className="floating-chat-icon-btn"
                onClick={() => setChatOpen(false)}
                aria-label="Close ERP assistant"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <ChatBox compact={!isFullScreen} contextPage={contextPage} className="floating-chatbox" />
        </div>
      ) : (
        <button 
          className="floating-chat-trigger"
          onClick={() => setChatOpen(true)}
          aria-label="Open ERP assistant"
          title="Ask AI Assistant"
        >
          <Bot size={28} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-surface animate-pulse" />
        </button>
      )}
    </div>
  )
}
