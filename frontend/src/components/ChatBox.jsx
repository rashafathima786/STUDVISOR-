import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, SendHorizonal, User, ArrowRight, ExternalLink } from 'lucide-react'
import { fetchChatHistory, sendChatMessage, streamChatMessage, fetchChatWelcome } from '../services/api'
import { useNavigate } from 'react-router-dom'

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, scale: 0.95, filter: 'blur(5px)' },
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
  const protocol = meta?.protocol || meta?.orchestration?.provider_summary?.label
  if (!protocol) return null

  return <div className="provider-badge">{protocol}</div>
}

function ActionButtons({ actions, onAction }) {
  if (!actions || actions.length === 0) return null

  return (
    <div className="chat-action-container">
      {actions.map((action, idx) => (
        <motion.button
          key={`${action.label}-${idx}`}
          className={`chat-action-btn ${action.category || ''}`}
          onClick={() => onAction(action)}
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.label}
          {action.action === 'navigate' ? <ExternalLink size={12} className="ml-1 opacity-60" /> : <ArrowRight size={12} className="ml-1 opacity-60" />}
        </motion.button>
      ))}
    </div>
  )
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
      <div className="chat-avatar bot-avatar-premium">
        <Bot size={16} strokeWidth={2.5} />
      </div>
      <div className="chat-bubble bot bot-bubble-premium typing-bubble" aria-live="polite">
        <span className="typing-copy typing-shimmer">Analyzing your academic profile...</span>
        <span className="typing-dots" aria-hidden="true">
          <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
          <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
          <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
        </span>
      </div>
    </motion.div>
  )
}

const promptSets = {
  attendance: [
    ['which classes did i miss today', 'Missed today', 'attendance'],
    ['show my missed classes this week', 'This week', 'attendance'],
    ['how many classes can i miss', 'Can miss', 'attendance'],
    ['which subject did i miss most', 'Most missed', 'attendance'],
  ],
  results: [
    ['what is my weakest subject', 'Weakest', 'results'],
    ['what is my best subject', 'Best', 'results'],
    ['what is my latest sgpa', 'SGPA', 'results'],
    ['compare my semester performance', 'Trend', 'results'],
  ],
  calendar: [
    ['when is the next holiday', 'Next holiday', 'calendar'],
    ['is tomorrow a working day', 'Tomorrow', 'calendar'],
    ['show holidays this month', 'This month', 'calendar'],
    ['how many working hours are there on 24 April', 'Hours', 'calendar'],
  ],
  od: [
    ['which classes did i miss on 10 April for OD', 'OD details', 'od'],
    ['which od have i applied and not applied', 'OD status', 'od'],
    ['show pending medical leave requests', 'Medical', 'od'],
    ['what dates should I mention for my medical leave', 'Dates', 'od'],
  ],
  dashboard: [
    ['which classes did i miss today', 'Missed today', 'attendance'],
    ['when is the next holiday', 'Next holiday', 'calendar'],
    ['what is my weakest subject', 'Weakest', 'results'],
    ['explain my eligibility status', 'Eligibility', 'attendance'],
  ],
}

export default function ChatBox({ onNewChat, resetToken = 0, className = '', contextPage = 'dashboard', compact = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [welcomeData, setWelcomeData] = useState(null)
  const navigate = useNavigate()
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
      const [history, welcome] = await Promise.all([
        fetchChatHistory(),
        fetchChatWelcome().catch(() => null)
      ])

      const formatted = []
      history
        .slice()
        .reverse()
        .slice(-10)
        .forEach((item) => {
          formatted.push({ sender: 'user', text: item.query })
          formatted.push({ sender: 'bot', text: item.response })
        })

      setWelcomeData(welcome)
      
      const hour = new Date().getHours()
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
      
      if (formatted.length === 0 && welcome) {
         setMessages([{ 
           sender: 'bot', 
           text: `✨ **${greeting}, ${welcome.message.split('!')[0].split(' ').pop() || ''}!** ${welcome.message}`,
           actions: welcome.actions,
           protocol: 'Turing-5'
         }])
      } else {
        setMessages(
          formatted.length
            ? formatted
            : [{ sender: 'bot', text: `✨ **${greeting}!** I'm your ERP Assistant. I can analyze your attendance, marks, and help you track missing ODs.\n\nType **help** to see everything I can do for you!` }],
        )
      }
    } catch {
      setMessages([{ sender: 'bot', text: 'Unable to load previous chat history.' }])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleAction(action) {
    if (action.action === 'navigate') {
      navigate(action.payload)
    } else if (action.query) {
      setInput(action.query)
      setTimeout(() => document.getElementById('chat-send-btn')?.click(), 10)
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
              msg.id === botMessageId ? { 
                ...msg, 
                text: finalText, 
                streaming: true, 
                meta: currentMetaRef.current || msg.meta,
                actions: currentMetaRef.current?.actions || msg.actions
              } : msg,
            )
          })
        },
        onDone: (finalText) => {
          setShowTyping(false)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId ? { 
                ...msg, 
                text: finalText || msg.text, 
                streaming: false, 
                meta: currentMetaRef.current || msg.meta,
                actions: currentMetaRef.current?.actions || msg.actions
              } : msg,
            ),
          )
        },
      })

      if (!streamed.reply) {
        const response = await sendChatMessage(userMessage, contextPage)
        setShowTyping(false)
        setMessages((prev) => [...prev, { 
          id: botMessageId, 
          sender: 'bot', 
          text: response.reply || 'No reply received.', 
          meta: response.meta,
          actions: response.actions
        }])
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
    <div className={`card chatbot-card chatbot-card-premium ${compact ? 'compact-chatbot-card' : ''} ${className}`}>
      <div className="chatbot-header">
        <h3 className="section-title">ERP Chatbot</h3>
        {!compact ? (
          <p className="chatbot-subtitle">
            Ask about attendance, weakest subject, eligibility, marks, or a quick academic summary.
          </p>
        ) : null}
        <div className="chat-prompt-row scrollbar-hide">
          {(welcomeData?.actions || promptSets[contextPage] || promptSets.dashboard).map((item) => {
            const prompt = Array.isArray(item) ? item[0] : item.query
            const label = Array.isArray(item) ? item[1] : item.label
            const category = Array.isArray(item) ? item[2] : item.category

            return (
              <motion.button 
                key={prompt} 
                type="button" 
                className={`chat-prompt-chip ${category || ''}`} 
                onClick={() => handleAction(Array.isArray(item) ? { query: prompt } : item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="chat-window custom-scrollbar">
        {loadingHistory ? (
          <div className="chat-history-loader">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="loader-spinner"
            />
            Synchronizing your academic data...
          </div>
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
              <div className={`chat-avatar ${msg.sender === 'user' ? 'user-avatar-premium' : 'bot-avatar-premium'}`}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`chat-bubble ${msg.sender} ${msg.sender === 'bot' ? 'markdown-body bot-bubble-premium' : 'user-bubble-premium'} ${
                  msg.streaming ? 'streaming-bubble' : ''
                }`}
              >
                {msg.sender === 'bot' ? (
                  <>
                    <BotMessage text={msg.text} />
                    <ActionButtons actions={msg.actions} onAction={handleAction} />
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
        <button id="chat-send-btn" className="send-btn" onClick={handleSend} disabled={sending}>
          <SendHorizonal size={18} />
          {sending ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
