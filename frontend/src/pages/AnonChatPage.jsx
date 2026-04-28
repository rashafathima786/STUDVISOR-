import { useState, useEffect, useRef } from 'react'
import ErpLayout from '../components/ErpLayout'
import { fetchAnonPosts, createAnonPost, reactToPost, flagPost } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  MoreVertical, 
  ThumbsUp, 
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
  Plus
} from 'lucide-react'

export default function AnonChatPage() {
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState("General")
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

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
      setPosts((res?.posts || []).reverse())
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadWall()
  }, [category])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    <ErpLayout title="Campus Connect" subtitle="Encrypted anonymous messaging protocol">
      <div className="flex h-[calc(100vh-180px)] gap-6 max-w-7xl mx-auto px-6 overflow-hidden">
        
        {/* Channel Intelligence Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          <div className="p-6 bg-[#121214]/80 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Channels</h2>
              <div className="p-2 rounded-xl bg-white/5">
                <Hash size={14} className="text-primary" />
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="text" 
                placeholder="Search encrypted streams..." 
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-primary/40 transition-all placeholder:text-white/10"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {channels.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setCategory(c.id)}
                  className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    category === c.id 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`text-2xl transition-transform group-hover:scale-110 ${category === c.id ? 'opacity-100' : 'opacity-50'}`}>
                    {c.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-xs font-black uppercase tracking-widest truncate ${category === c.id ? 'text-white' : 'text-white/80'}`}>{c.name}</div>
                    <div className={`text-[9px] font-bold truncate mt-0.5 ${category === c.id ? 'text-white/60' : 'text-white/20'}`}>{c.desc}</div>
                  </div>
                  {category === c.id && <Zap size={12} className="text-white/40 animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messaging Terminal */}
        <div className="flex-1 flex flex-col bg-[#0d0d10]/80 backdrop-blur-2xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shadow-inner">
                {activeChannel.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{activeChannel.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Active Synchronisation</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-3 rounded-xl hover:bg-white/5 text-white/40 transition-all"><Search size={18} /></button>
              <button className="p-3 rounded-xl hover:bg-white/5 text-white/40 transition-all"><MoreVertical size={18} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
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
                const isOutgoing = (post.id % 3) === 0
                const reacts = post.reactions || {}
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={post.id} 
                    className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                  >
                    {post.censored_content && post.censored_content !== post.content && (
                      <div className="flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                        <Shield size={10} className="text-red-400" />
                        <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Protocol Intervention</span>
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] group relative`}>
                      <div className={`p-5 rounded-3xl text-sm leading-relaxed border transition-all ${
                        isOutgoing 
                          ? 'bg-primary text-white border-primary/20 rounded-tr-none shadow-lg' 
                          : 'bg-white/5 text-white/90 border-white/5 rounded-tl-none hover:border-white/10'
                      }`}>
                        {post.censored_content || post.content}
                        
                        <div className={`flex items-center gap-4 mt-3 text-[9px] font-bold uppercase tracking-tighter ${
                          isOutgoing ? 'text-white/40' : 'text-white/20'
                        }`}>
                          <span>ID-{post.id.toString().padStart(4, '0')}</span>
                          <span>{new Date(post.date || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Reactions & Actions */}
                      <div className={`flex flex-wrap gap-2 mt-3 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                        {['thumbs_up', 'heart', 'laugh'].map(rt => {
                          const count = reacts[rt] || 0
                          if (count === 0) return null
                          return (
                            <button 
                              key={rt} 
                              onClick={() => handleReact(post.id, rt)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-all group/react"
                            >
                              <span className="group-hover/react:scale-125 transition-transform">{reactionIcons[rt]}</span>
                              <span className="text-[10px] font-black text-white/60">{count}</span>
                            </button>
                          )
                        })}
                        <button 
                          onClick={() => handleReact(post.id, 'thumbs_up')}
                          className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/5 rounded-full text-white/20 hover:text-white/60 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Plus size={12} />
                        </button>

                        {!isOutgoing && (
                          <button 
                            onClick={() => handleFlag(post.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-full hover:bg-red-500/20 text-red-400/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Report Intelligence Violation"
                          >
                            <ShieldAlert size={12} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Flag</span>
                          </button>
                        )}
                      </div>
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white font-medium outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
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
                className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
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
