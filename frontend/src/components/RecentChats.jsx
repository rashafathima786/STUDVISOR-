import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { clearChatHistory } from '../services/api'

export default function RecentChats({ chatHistory, onHistoryCleared }) {
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState('')

  async function handleClearHistory() {
    if (clearing || !chatHistory.length) return

    setClearing(true)
    setClearError('')
    try {
      await clearChatHistory()
      if (onHistoryCleared) {
        await onHistoryCleared()
      }
    } catch {
      setClearError('Unable to clear chat history right now.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header-row">
        <h3 className="section-title">Recent Chat History</h3>
        <button
          type="button"
          className="history-clear-btn"
          onClick={handleClearHistory}
          disabled={!chatHistory.length || clearing}
        >
          <Trash2 size={16} />
          {clearing ? 'Clearing...' : 'Clear'}
        </button>
      </div>
      {clearError ? <div className="error-box">{clearError}</div> : null}
      {chatHistory.length ? (
        <div className="chat-history-list">
          {chatHistory.slice(0, 8).map((item, index) => (
            <div className="history-item" key={index}>
              <div className="history-user">
                <strong>You:</strong> {item.query}
              </div>
              <div className="history-bot">
                <strong>Bot:</strong> {item.response}
              </div>
              <div className="history-time">{new Date(item.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No recent chats found.</div>
      )}
    </div>
  )
}
