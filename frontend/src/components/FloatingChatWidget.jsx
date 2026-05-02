import { useState, useCallback, useEffect } from 'react'
import { X, Maximize2, Minimize2, Move } from 'lucide-react'
import useChatStore from '../stores/chatStore'
import ChatBox from './ChatBox'
import ChatbotLogo from './ui/ChatbotLogo'

export default function FloatingChatWidget({ contextPage = 'dashboard' }) {
  const { isOpen, isFullScreen, setChatOpen, toggleFullScreen } = useChatStore()
  const [dimensions, setDimensions] = useState({ width: 420, height: 600 })
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return

    // Since the panel is anchored at bottom-right (right: 24px, bottom: 24px)
    // Resizing from top-left means:
    // New width = (windowWidth - currentX) - anchorMarginRight
    // New height = (windowHeight - currentY) - anchorMarginBottom
    
    const newWidth = Math.max(320, Math.min(800, window.innerWidth - e.clientX - 24))
    const newHeight = Math.max(400, Math.min(window.innerHeight - 48, window.innerHeight - e.clientY - 24))
    
    setDimensions({ width: newWidth, height: newHeight })
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div className="floating-chat-shell">
      {isOpen ? (
        <div 
          className={`floating-chat-panel ${isFullScreen ? 'full-screen' : ''} ${isResizing ? 'resizing' : ''}`}
          style={isFullScreen ? {} : { width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        >
          {/* Resize Handle (Top-Left) */}
          {!isFullScreen && (
            <div 
              className="chat-resize-handle" 
              onMouseDown={handleMouseDown}
              title="Drag to resize"
            >
              <Move size={12} className="opacity-40" />
            </div>
          )}

          <div className="floating-chat-titlebar">
            <div className="floating-chat-title">
              <ChatbotLogo size={24} />
              <span>Studvisor AI</span>
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
                aria-label="Close Studvisor AI"
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
          aria-label="Open Studvisor AI"
          title="Ask Studvisor AI"
        >
          <div className="hidden md:block">
            <ChatbotLogo size={44} mode="logo" />
          </div>
          <div className="block md:hidden">
            <ChatbotLogo size={32} mode="logo" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-surface animate-pulse" />
        </button>
      )}
    </div>
  )
}
