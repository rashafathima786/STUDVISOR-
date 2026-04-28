import { useState } from 'react'
import { Bot, MessageCircle, X } from 'lucide-react'
import ChatBox from './ChatBox'

export default function FloatingChatWidget({ contextPage = 'dashboard' }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="floating-chat-shell">
      {open ? (
        <div className="floating-chat-panel">
          <div className="floating-chat-titlebar">
            <div className="floating-chat-title">
              <Bot size={18} />
              <span>ERP Assistant</span>
            </div>
            <button
              type="button"
              className="floating-chat-icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close ERP assistant"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
          <ChatBox compact contextPage={contextPage} className="floating-chatbox" />
        </div>
      ) : null}

      <button
        type="button"
        className="floating-chat-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open ERP assistant"
        title="ERP assistant"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  )
}
