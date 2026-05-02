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
  MessageSquare,
  Lock,
  Shield,
  Trash2,
  Download,
  EyeOff,
  Info,
  Hash,
  BookOpen,
  Megaphone,
  HelpCircle,
  FileText,
  UserCheck,
  Globe, Activity, Cpu, Calendar, Users,
  Clock,
  TrendingUp,
  BarChart3,
  Zap,
  RotateCcw,
  MoreHorizontal,
  ThumbsDown,
  Plus,
  ChevronDown,
  Mic,
  AudioLines
} from 'lucide-react'

export default function GeneralForumPage() {
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState("General")
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [isSending, setIsSending] = useState(false) 
  const [postCache, setPostCache] = useState({}) 

  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isFirstLoad = useRef(true)

  const channels = [
    { id: "General", name: "General Forum", desc: "Open campus dialogue", icon: <Globe size={18} /> },
    { id: "Lounge", name: "Student Lounge", desc: "Informal discussions", icon: <MessageSquare size={18} /> },
    { id: "Academic", name: "Academic Support", desc: "Peer-to-peer assistance", icon: <HelpCircle size={18} /> },
    { id: "Clubs", name: "Club Notices", desc: "Organization updates", icon: <Megaphone size={18} /> }
  ]

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your local history?")) {
      const lastId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) : 0
      localStorage.setItem(`forum_last_cleared_id_${category}`, lastId.toString())
      setPosts([])
      setShowMenu(false)
    }
  }

  const handleExport = () => {
    const content = posts.map(p => `[${p.session_hash === "NEXUS_AI_BOT" ? 'FORUM AI' : 'STUDENT'}] ${p.content}`).join('\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forum_report_${category.toLowerCase()}.txt`
    a.click()
    setShowMenu(false)
  }

  function loadWall(isBackground = false) {
    if (!isBackground) setLoading(!postCache[category])

    fetchAnonPosts(category, "recent").then(res => {
      const allPosts = (res?.posts || []).reverse()
      const lastClearedId = parseInt(localStorage.getItem(`forum_last_cleared_id_${category}`) || "0")
      const filtered = lastClearedId > 0 ? allPosts.filter(p => p.id > lastClearedId) : allPosts

      // ── OPTIMIZATION: Only update if content actually changed ────────────────
      setPosts(current => {
        const currentIds = current.map(p => p.id).join(',')
        const newIds = filtered.map(p => p.id).join(',')
        if (currentIds === newIds) return current // No change, skip state update
        return filtered
      })
      
      setPostCache(prev => ({ ...prev, [category]: filtered }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    // Immediate state switch from cache to prevent "pulling up" to empty state
    if (postCache[category]) {
      setPosts(postCache[category])
    } else {
      setPosts([])
    }
    
    loadWall()
    isFirstLoad.current = true
    const interval = setInterval(() => loadWall(true), 5000)
    return () => clearInterval(interval)
  }, [category])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container && posts.length > 0) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250
      
      if (isFirstLoad.current) {
        // Use a slight timeout to ensure layout has stabilized
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
          isFirstLoad.current = false
        }, 50)
      } else if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [posts])

  const handlePost = async () => {
    if (!newContent.trim() || isSending) return
    const content = newContent
    setNewContent('')
    setIsSending(true)

    const tempId = Date.now()
    const optimisticPost = {
      id: tempId,
      content: content,
      category: category,
      session_hash: "TRANSMITTING", 
      created_at: new Date().toISOString(),
      reactions: { like: 0, helpful: 0 },
      is_optimistic: true
    }
    setPosts(prev => [...prev, optimisticPost])

    try {
      await createAnonPost({ content, category })
      setIsSending(false)
      loadWall(true) 
    } catch (err) {
      console.error(err)
      setPosts(prev => prev.filter(p => p.id !== tempId))
      setIsSending(false)
    }
  }

  const handleReaction = async (pid, type) => {
    try {
      await reactToPost(pid, type)
      loadWall()
    } catch (err) {
      console.error(err)
    }
  }

  const handleFlag = async (pid) => {
    if (window.confirm("Report this post for moderation review?")) {
      try {
        await flagPost(pid)
        loadWall()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const getZoneTheme = (zoneId) => {
    const themes = {
      General: { color: "indigo", glow: "rgba(99, 102, 241, 0.2)", bg: "from-indigo-500/5 to-transparent", text: "text-indigo-400" },
      Lounge: { color: "rose", glow: "rgba(244, 63, 94, 0.2)", bg: "from-rose-500/5 to-transparent", text: "text-rose-400" },
      Academic: { color: "emerald", glow: "rgba(16, 185, 129, 0.2)", bg: "from-emerald-500/5 to-transparent", text: "text-emerald-400" },
      Clubs: { color: "purple", glow: "rgba(168, 85, 247, 0.2)", bg: "from-purple-500/5 to-transparent", text: "text-purple-400" }
    }
    return themes[zoneId] || themes.General
  }

  const getQuickActions = (zoneId) => {
    switch (zoneId) {
      case 'Academic': return [
        { label: "Performance Summary", icon: <BarChart3 size={12} />, prompt: "Provide a complete academic performance summary" },
        { label: "Attendance Intel", icon: <Activity size={12} />, prompt: "What is my current attendance status?" },
        { label: "Subject Analysis", icon: <Cpu size={12} />, prompt: "Analyze my performance across all subjects" }
      ]
      case 'Clubs': return [
        { label: "Upcoming Events", icon: <Calendar size={12} />, prompt: "What are the major club events this week?" },
        { label: "Recruitment Info", icon: <Users size={12} />, prompt: "Show active club recruitment notices" }
      ]
      case 'General': return [
        { label: "Campus Trends", icon: <Globe size={12} />, prompt: "What are the trending topics on campus today?" },
        { label: "Institutional News", icon: <Megaphone size={12} />, prompt: "Show latest official announcements" }
      ]
      default: return []
    }
  }

  const getRGB = (color) => {
    switch (color) {
      case 'indigo': return '99, 102, 241'
      case 'rose': return '244, 63, 94'
      case 'emerald': return '16, 185, 129'
      case 'purple': return '168, 85, 247'
      default: return '99, 102, 241'
    }
  }

  const activeChannel = channels.find(c => c.id === category) || channels[0]
  const zoneTheme = getZoneTheme(activeChannel.id)
  const quickActions = getQuickActions(activeChannel.id)
  const themeRGB = getRGB(zoneTheme.color)

  return (
    <ErpLayout title="General Forum" subtitle="Open campus dialogue">
      <div className="wrapper flex h-[calc(100vh-140px)] overflow-hidden bg-transparent backdrop-blur-3xl rounded-[2.5rem] border border-white/5 text-white font-sans relative">

        {/* Sidebar */}
        <div className="w-80 flex flex-col bg-white/[0.01] backdrop-blur-md hidden lg:flex">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Shield size={18} className="text-indigo-400" />
              </div>
              <span className="text-sm font-bold tracking-[0.1em] text-white/90 uppercase">Campus Feed</span>
            </div>

            <nav className="space-y-1">
              {channels.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`w-full group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border ${category === c.id
                      ? 'bg-opacity-10 text-white shadow-lg'
                      : 'text-white/30 border-transparent hover:bg-white/5 hover:text-white/60'
                    }`}
                  style={category === c.id ? {
                    backgroundColor: `rgba(${zoneTheme.color === 'indigo' ? '99, 102, 241' : zoneTheme.color === 'rose' ? '244, 63, 94' : zoneTheme.color === 'emerald' ? '16, 185, 129' : '168, 85, 247'}, 0.1)`,
                    borderColor: `rgba(${zoneTheme.color === 'indigo' ? '99, 102, 241' : zoneTheme.color === 'rose' ? '244, 63, 94' : zoneTheme.color === 'emerald' ? '16, 185, 129' : '168, 85, 247'}, 0.2)`,
                    boxShadow: `0 0 20px ${zoneTheme.glow}`
                  } : {}}
                >
                  <div className={`transition-colors duration-200`} style={{ color: category === c.id ? `rgb(${zoneTheme.color === 'indigo' ? '99, 102, 241' : zoneTheme.color === 'rose' ? '244, 63, 94' : zoneTheme.color === 'emerald' ? '16, 185, 129' : '168, 85, 247'})` : 'rgba(255,255,255,0.2)' }}>
                    {c.icon}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="text-sm font-bold truncate tracking-tight">{c.name}</span>
                    <span className="text-[10px] opacity-40 truncate font-medium">{c.desc}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-white/5">
            <div className="flex items-center gap-3 text-white/20">
              <Info size={14} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Privacy Protected</p>
            </div>
          </div>
        </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col bg-transparent relative">

          <div className="flex-1 overflow-y-auto scrollbar-hide bg-transparent relative" ref={scrollContainerRef}>
            <div className="max-w-4xl mx-auto px-6 py-10 pb-[200px]">
            <AnimatePresence mode="wait">
              {posts.length > 0 ? (
                posts.map((post, idx) => {
                  const isAI = post.session_hash === "NEXUS_AI_BOT" || post.content.startsWith("### 🟢");
                  return (
                    <motion.div 
                      key={post.id || idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      className="mb-8"
                    >
                      <div className="flex items-center justify-between mb-3 px-2">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${isAI ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-indigo-500/60 shadow-[0_0_8px_rgba(99,102,241,0.3)]'} animate-pulse`} />
                           <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                             {isAI ? 'Forum Intelligence' : 'Verified Student'}
                           </span>
                        </div>
                        <div className="flex items-center gap-2 opacity-30">
                          <Clock size={12} className="text-white" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                            {new Date(post.date || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {isAI && (
                        <div className="w-full py-4">
                          <div className="flex items-center gap-2 mb-6 opacity-40">
                             <AudioLines size={14} className="text-white" />
                             <span className="text-[11px] font-medium text-white tracking-tight">Thought for 1s</span>
                          </div>

                          <div className="text-white/90">
                            <div className="prose prose-invert prose-p:leading-relaxed prose-p:mb-6 max-w-none 
                                prose-headings:text-white prose-headings:font-bold prose-headings:text-lg prose-headings:mb-4
                                prose-strong:text-white prose-strong:font-bold
                                prose-ul:list-disc prose-ul:pl-5 prose-li:mb-2 prose-li:text-white/80">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {(post.censored_content || post.content || "").replace(/\\n/g, '\n')}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-8 opacity-20 hover:opacity-100 transition-opacity">
                             <div className="flex items-center gap-4">
                                <button className="hover:text-white transition-colors"><Search size={16} /></button>
                                <button className="hover:text-white transition-colors"><ThumbsUp size={16} /></button>
                                <button className="hover:text-white transition-colors"><ThumbsDown size={16} /></button>
                                <button className="hover:text-white transition-colors"><RotateCcw size={16} /></button>
                             </div>
                          </div>
                        </div>
                      )}

                      {!isAI && (
                        <div className={`group relative w-full flex ${post.is_mine || post.is_optimistic ? 'justify-end' : 'justify-start'}`}>
                          {post.is_mine || post.is_optimistic ? (
                            <div className="bg-white/10 border border-white/5 rounded-full px-5 py-2.5 max-w-[85%] shadow-sm">
                               <div className="text-white/90 text-[15px] font-medium">
                                 {post.censored_content || post.content}
                               </div>
                            </div>
                          ) : (
                            <div className="max-w-[85%] py-2">
                               <div className="text-white/80 text-[15px] leading-relaxed font-medium">
                                 {post.censored_content || post.content}
                               </div>
                               <div className="flex items-center gap-4 mt-3 opacity-0 group-hover:opacity-30 transition-opacity">
                                  <button onClick={() => handleReaction(post.id, 'like')} className="hover:text-white flex items-center gap-1.5 text-[10px] font-bold uppercase"><ThumbsUp size={12} /> {post.reaction_count || 0}</button>
                                  <button onClick={() => handleFlag(post.id)} className="hover:text-rose-500 transition-colors"><EyeOff size={14} /></button>
                               </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })
              ) : !loading && (
                <div className="h-full flex flex-col items-center justify-center py-32 opacity-10 space-y-6">
                   <div className="w-24 h-24 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                     <Hash size={40} />
                   </div>
                   <div className="text-center">
                     <h3 className="text-lg font-black uppercase tracking-[0.4em] text-white">No Posts</h3>
                     <p className="text-[10px] font-bold uppercase tracking-widest mt-2">No transmissions detected in {category}</p>
                   </div>
                </div>
              )}
              </AnimatePresence>
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none pb-8">
            <div className="max-w-4xl mx-auto px-6 pointer-events-auto">
              {quickActions.length > 0 && (
                <div className="flex items-center justify-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setNewContent(action.prompt)}
                      className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.01] border border-white/5 hover:bg-white/[0.1] hover:border-white/10 transition-all whitespace-nowrap group shadow-2xl"
                    >
                      <span className={`${zoneTheme.text} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all`}>{action.icon}</span>
                      <span className="text-[10px] font-black text-white/30 group-hover:text-white/70 uppercase tracking-[0.2em] transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative group">
                <div className="absolute inset-0 blur-2xl opacity-0 group-focus-within:opacity-20 transition-opacity rounded-full"
                  style={{ backgroundColor: `rgba(${themeRGB}, 0.2)` }} />
                
                <div className="relative flex items-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-full px-2 py-2 shadow-2xl focus-within:border-white/20 transition-all">
                  <button className="p-3 text-white/40 hover:text-white transition-colors">
                    <Plus size={22} />
                  </button>

                  <textarea
                    rows={1}
                    value={newContent}
                    onChange={(e) => {
                      setNewContent(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePost();
                        e.target.style.height = 'auto';
                      }
                    }}
                    placeholder={`How can I help you today?`}
                    className="flex-1 bg-transparent px-2 py-2 text-[16px] text-white placeholder-white/20 focus:outline-none resize-none overflow-y-auto max-h-40 font-medium leading-relaxed"
                  />

                  <div className="flex items-center gap-1 sm:gap-3 pr-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-white/40 hover:text-white border border-transparent hover:border-white/5">
                      <span className="text-[11px] font-bold tracking-tight uppercase">Fast</span>
                      <ChevronDown size={14} />
                    </div>

                    <button className="p-2.5 text-white/40 hover:text-white transition-colors">
                      <Mic size={20} />
                    </button>

                    <button
                      onClick={handlePost}
                      disabled={!newContent.trim()}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                        ${newContent.trim() 
                          ? 'bg-white text-black scale-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                          : 'bg-white/5 text-white/20 scale-95'}`}
                    >
                      {newContent.trim() ? (
                        <Send size={20} className="fill-current" />
                      ) : (
                        <AudioLines size={20} className="opacity-40" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  )
}
