import { useState, useEffect, useRef } from 'react'
import ErpLayout from '../components/ErpLayout'
import { fetchAnonPosts, createAnonPost, reactToPost, flagPost } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  MoreVertical, 
  ThumbsUp, 
  ThumbsDown,
  Heart, 
  Smile, 
  AlertTriangle, 
  Shield, 
  Hash,
  Users,
  MessageSquare,
  Lock,
  ChevronRight,
  Zap,
  ShieldAlert,
  RotateCcw,
  MoreHorizontal,
  Plus,
  Trash2,
  Download,
  EyeOff,
  Settings2
} from 'lucide-react'

export default function AnonChatPage() {
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState("General")
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(false)

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your local transmission history?")) {
      const lastId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) : 0
      localStorage.setItem(`nexus_last_cleared_id_${category}`, lastId.toString())
      setPosts([])
      setShowMenu(false)
    }
  }

  const handleExport = () => {
    const content = posts.map(p => `[${p.session_hash === "NEXUS_AI_BOT" ? 'NEXUS AI' : 'USER'}] ${p.content}`).join('\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus_report_${category.toLowerCase()}.txt`
    a.click()
    setShowMenu(false)
  }
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isFirstLoad = useRef(true)

  const channels = [
    { id: "General", name: "Nexus General", desc: "Open campus discussions", icon: "🏫", color: "text-blue-400" },
    { id: "Confessions", name: "Confessions", desc: "Anonymous secrets", icon: "🤫", color: "text-primary" },
    { id: "Questions", name: "Academic Q&A", desc: "Help with studies", icon: "📚", color: "text-emerald-400" },
    { id: "Clubs", name: "Club Central", desc: "Events & updates", icon: "🎭", color: "text-amber-400" },
    { id: "Funny", name: "Meme Node", desc: "Campus humor", icon: "😂", color: "text-rose-400" }
  ]

  const reactionIcons = { 
    "thumbs_up": <ThumbsUp size={12} />, 
    "heart": <Heart size={12} />, 
    "laugh": <Smile size={12} /> 
  }

  function loadWall() {
    fetchAnonPosts(category, "recent").then(res => {
      const allPosts = (res?.posts || []).reverse()
      const lastClearedId = parseInt(localStorage.getItem(`nexus_last_cleared_id_${category}`) || "0")
      
      if (lastClearedId > 0) {
        setPosts(allPosts.filter(p => p.id > lastClearedId))
      } else {
        setPosts(allPosts)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadWall()
    isFirstLoad.current = true // Reset on category change
    
    // Auto-refresh polling every 10 seconds
    const interval = setInterval(loadWall, 10000)
    return () => clearInterval(interval)
  }, [category])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container && posts.length > 0) {
      // Very strict bottom check (within 50px)
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
      
      if (isFirstLoad.current) {
        // Initial load: Jump to bottom instantly
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        isFirstLoad.current = false
      } else if (isAtBottom) {
        // Only scroll for new messages if user is already at the bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [posts])

  async function handleSend(e) {
    e.preventDefault()
    if (!newContent.trim()) return
    try {
      await createAnonPost({ content: newContent, category })
      setNewContent('')
      loadWall()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleReact(postId, reactionType) {
    try {
      await reactToPost(postId, reactionType)
      loadWall()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleFlag(postId) {
    try {
      await flagPost(postId)
      // Feedback or reload
      loadWall()
    } catch (err) {
      console.error(err)
    }
  }

  const activeChannel = channels.find(c => c.id === category) || channels[0]

  return (
    <ErpLayout title="Campus Connect" subtitle="Next-generation intelligence protocol">
      <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto overflow-hidden bg-black text-white font-sans">
        
        {/* Grok-style Sidebar */}
        <div className="w-64 border-r border-white/5 flex flex-col p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg">
              <Zap size={18} className="text-black fill-black" />
            </div>
            <span className="font-black tracking-tighter text-lg">Nexus</span>
          </div>
          
          <div className="space-y-1 overflow-y-auto flex-1 pr-2 scrollbar-hide">
            {channels.map(c => (
              <button 
                key={c.id} 
                onClick={() => setCategory(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${
                  category === c.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl opacity-80">{c.icon}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 px-2">
            <div className="flex items-center gap-3 text-white/40 text-xs font-bold uppercase tracking-widest">
              <Shield size={14} />
              <span>Encrypted</span>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col relative">
          
          {/* Header */}
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">{activeChannel.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">System Synchronized</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 relative">
              <Search size={20} className="text-white/20 cursor-pointer hover:text-white transition-all" />
              <div className="relative">
                <MoreVertical 
                  size={20} 
                  className={`cursor-pointer transition-all ${showMenu ? 'text-white' : 'text-white/20 hover:text-white'}`}
                  onClick={() => setShowMenu(!showMenu)}
                />
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-4 w-64 bg-[#161618] border border-white/5 rounded-2xl shadow-2xl p-2 z-40 backdrop-blur-2xl">
                      <div className="px-4 py-3 mb-2 border-b border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Protocol Actions</p>
                      </div>
                      
                      <button 
                        onClick={handleClearChat}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} /> Clear History
                      </button>
                      
                      <button 
                        onClick={handleExport}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Download size={16} /> Export Academic Report
                      </button>

                      <button 
                        onClick={() => { setPrivacyMode(!privacyMode); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <EyeOff size={16} /> {privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
                      </button>

                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Settings2 size={16} /> Ensemble Config
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-8 md:px-24 py-12 space-y-12 scrollbar-hide"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Decrypting Stream...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                <MessageSquare size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest italic">No Transmission Detected</p>
              </div>
            ) : (
              posts.map((post, idx) => {
                const isOutgoing = post.is_mine;
                const reacts = post.reactions || {};
                // Enhanced detection: check hash OR if it looks like an AI report
                const isAI = post.session_hash === "NEXUS_AI_BOT" || post.content.startsWith("### 🟢");
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={post.id} 
                    className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] w-full ${isOutgoing ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                      
                      {/* User Message (Grok Style) */}
                      {isOutgoing && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="bg-[#1d1d1f] text-white/90 px-5 py-3 rounded-2xl text-base md:text-lg font-medium shadow-sm">
                            {(post.content || "").replace(/\\n/g, '\n')}
                          </div>
                          <div className="flex items-center gap-3 opacity-20 hover:opacity-100 transition-all mr-1">
                             <div className="cursor-pointer hover:text-white"><Send size={12} className="rotate-[-45deg] opacity-50" /></div>
                             <div className="cursor-pointer hover:text-white"><Plus size={12} className="opacity-50" /></div>
                          </div>
                        </div>
                      )}

                      {/* AI Content (Academic Report Style) */}
                      {isAI && (
                        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 shadow-2xl">
                          <div className="flex items-center gap-3 mb-8 opacity-60">
                             <div className="p-2 bg-white/10 rounded-lg">
                               <Zap size={16} className="text-white fill-white" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Campus Connect</span>
                               <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Protocol v5.0 Active</span>
                             </div>
                          </div>

                          <div className="text-white">
                            <div className="prose prose-invert prose-p:leading-8 prose-p:mb-8 max-w-none 
                                prose-headings:text-white/40 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-[0.3em] prose-headings:text-[10px] prose-headings:mb-6
                                prose-strong:text-white prose-strong:font-bold
                                prose-ul:list-disc prose-ul:pl-4 prose-li:mb-2">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {(post.censored_content || post.content || "").replace(/\\n/g, '\n')}
                              </ReactMarkdown>
                            </div>
                          </div>

                          {/* Grok Action Row for AI */}
                          <div className="flex items-center gap-6 mt-10 text-white/20 border-t border-white/5 pt-6">
                            <div className="flex items-center gap-5">
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><Search size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><Send size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><ThumbsUp size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><ThumbsDown size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><RotateCcw size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><MoreHorizontal size={18} /></div>
                            </div>
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase ml-auto opacity-30">
                              Secure Node Verification · {new Date(post.date || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Other User Nodes */}
                      {!isOutgoing && !isAI && (
                        <div className="flex flex-col items-start gap-3">
                          <div className="bg-[#161618]/50 text-white/60 px-5 py-3 rounded-2xl text-base font-medium italic border border-white/5">
                            {(post.censored_content || post.content || "").replace(/\\n/g, '\n')}
                          </div>
                          <div className="flex items-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-[0.2em] ml-2">
                            <span>{`NODE-${post.id.toString().padStart(4, '0')}`}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span>{new Date(post.date || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Interface */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <form className="relative flex items-center gap-4" onSubmit={handleSend}>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-6 pr-14 text-sm text-white font-medium outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                  placeholder="Initiate anonymous broadcast..." 
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/20">
                   <Lock size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest">TLS 1.3</span>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={!newContent.trim() || loading}
                className="w-14 h-14 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
              >
                <Send size={20} />
              </button>
            </form>
            <div className="mt-4 flex justify-center">
               <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">Campus Integrity Protocol v4.1 · End-to-End Encrypted</p>
            </div>
          </div>

        </div>
      </div>
    </ErpLayout>
  )
}
