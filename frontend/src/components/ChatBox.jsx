import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, SendHorizonal, User } from 'lucide-react'
import { fetchChatHistory, sendChatMessage, streamChatMessage } from '../services/api'

const messageVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
}

function BotMessage({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text || 'No response received.'}
    </ReactMarkdown>
  )
}

function ProviderBadge({ meta }) {
  const label = meta?.orchestration?.provider_summary?.label
  if (!label) return null

  return <div className="provider-badge">{label}</div>
}

function TypingIndicator() {
  return (
    <motion.div
      className="chat-message bot"
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="chat-avatar">
        <Bot size={16} />
      </div>
      <div className="chat-bubble bot typing-bubble" aria-live="polite">
        <span className="typing-copy">Thinking through your ERP data</span>
        <span className="typing-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </motion.div>
  )
}

const promptSets = {
  attendance: [
    ['which classes did i miss today', 'Missed today'],
    ['show my missed classes this week', 'This week'],
    ['how many classes can i miss', 'Can miss'],
    ['which subject did i miss most', 'Most missed'],
  ],
  results: [
    ['what is my weakest subject', 'Weakest'],
    ['what is my best subject', 'Best'],
    ['what is my latest sgpa', 'SGPA'],
    ['compare my semester performance', 'Trend'],
  ],
  calendar: [
    ['when is the next holiday', 'Next holiday'],
    ['is tomorrow a working day', 'Tomorrow'],
    ['show holidays this month', 'This month'],
    ['how many working hours are there on 24 April', 'Hours'],
  ],
  od: [
    ['which classes did i miss on 10 April for OD', 'OD details'],
    ['which od have i applied and not applied', 'OD status'],
    ['show pending medical leave requests', 'Medical'],
    ['what dates should I mention for my medical leave', 'Dates'],
  ],
  dashboard: [
    ['which classes did i miss today', 'Missed today'],
    ['when is the next holiday', 'Next holiday'],
    ['what is my weakest subject', 'Weakest'],
    ['explain my eligibility status', 'Eligibility'],
  ],
}

export default function ChatBox({ onNewChat, resetToken = 0, className = '', contextPage = 'dashboard', compact = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const chatEndRef = useRef(null)
  const hasMountedRef = useRef(false)
  const currentMetaRef = useRef(null)

  useEffect(() => {
    loadInitialChats()
  }, [])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    setMessages([{ sender: 'bot', text: 'Chat history cleared. Ask me anything about your ERP data.' }])
  }, [resetToken])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function loadInitialChats() {
    setLoadingHistory(true)
    try {
      const history = await fetchChatHistory()
      const formatted = []

      history
        .slice()
        .reverse()
        .slice(-10)
        .forEach((item) => {
          formatted.push({ sender: 'user', text: item.query })
          formatted.push({ sender: 'bot', text: item.response })
        })

      setMessages(
        formatted.length
          ? formatted
          : [{ sender: 'bot', text: 'Ask me about attendance, marks, profile, and more.' }],
      )
    } catch {
      setMessages([{ sender: 'bot', text: 'Unable to load previous chat history.' }])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    const botMessageId = `bot-${Date.now()}`
    currentMetaRef.current = null
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: userMessage }])
    setInput('')
    setSending(true)
    setShowTyping(true)

    try {
      const streamed = await streamChatMessage(userMessage, {
        contextPage,
        onMeta: (meta) => {
          currentMetaRef.current = meta
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId ? { ...msg, meta } : msg,
            ),
          )
        },
        onChunk: (_chunk, finalText) => {
          setShowTyping(false)
          setMessages((prev) => {
            const existing = prev.some((msg) => msg.id === botMessageId)
            if (!existing) {
              return [...prev, { id: botMessageId, sender: 'bot', text: finalText, streaming: true, meta: currentMetaRef.current }]
            }

            return prev.map((msg) =>
              msg.id === botMessageId ? { ...msg, text: finalText, streaming: true, meta: currentMetaRef.current || msg.meta } : msg,
            )
          })
        },
        onDone: (finalText) => {
          setShowTyping(false)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId ? { ...msg, text: finalText || msg.text, streaming: false, meta: currentMetaRef.current || msg.meta } : msg,
            ),
          )
        },
      })

      if (!streamed.reply) {
        const response = await sendChatMessage(userMessage, contextPage)
        setShowTyping(false)
        setMessages((prev) => [...prev, { id: botMessageId, sender: 'bot', text: response.reply || 'No reply received.', meta: response.meta }])
      }

      if (onNewChat) {
        onNewChat()
      }
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    } catch {
      try {
        const response = await sendChatMessage(userMessage, contextPage)
        setMessages((prev) => [...prev, { id: botMessageId, sender: 'bot', text: response.reply || 'No reply received.', meta: response.meta }])
        if (onNewChat) {
          onNewChat()
        }
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: botMessageId, sender: 'bot', text: 'Failed to connect to chatbot backend.' },
        ])
      }
    } finally {
      setSending(false)
      setShowTyping(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`card chatbot-card ${compact ? 'compact-chatbot-card' : ''} ${className}`}>
      <div className="chatbot-header">
        <h3 className="section-title">ERP Chatbot</h3>
        {!compact ? (
          <p className="chatbot-subtitle">
            Ask about attendance, weakest subject, eligibility, marks, or a quick academic summary.
          </p>
        ) : null}
        <div className="chat-prompt-row">
          {(promptSets[contextPage] || promptSets.dashboard).map(([prompt, label]) => (
            <button key={prompt} type="button" className="chat-prompt-chip" onClick={() => setInput(prompt)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {loadingHistory ? (
          <div className="chat-history-loader">Loading your recent conversation...</div>
        ) : null}

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id || `${msg.sender}-${index}-${msg.text.slice(0, 18)}`}
              className={`chat-message ${msg.sender}`}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.24, ease: 'easeOut' }}
              layout
            >
              <div className="chat-avatar">{msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}</div>
              <div
                className={`chat-bubble ${msg.sender} ${msg.sender === 'bot' ? 'markdown-body' : ''} ${
                  msg.streaming ? 'streaming-bubble' : ''
                }`}
              >
                {msg.sender === 'bot' ? (
                  <>
                    <BotMessage text={msg.text} />
                    <ProviderBadge meta={msg.meta} />
                  </>
                ) : msg.text}
              </div>
            </motion.div>
          ))}
          {showTyping ? <TypingIndicator key="typing-indicator" /> : null}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-box">
        <textarea
          placeholder="Ask your ERP chatbot here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button className="send-btn" onClick={handleSend} disabled={sending}>
          <SendHorizonal size={18} />
          {sending ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
