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
  ThumbsDown
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
      <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto overflow-hidden bg-black text-white font-sans">

        {/* Sidebar */}
        <div className="w-80 border-r border-white/5 flex flex-col bg-[#0d0d0f] hidden lg:flex">
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
        <div className="flex-1 flex flex-col bg-[#111114] relative">

          <header className={`h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-gradient-to-r ${zoneTheme.bg} backdrop-blur-md sticky top-0 z-30 w-full`}>
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-white/90">{activeChannel.name}</h3>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] hidden sm:block">{activeChannel.desc}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse`} />
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Encryption Level: Institutional</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 rounded-lg transition-all duration-200 ${showMenu ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                >
                  <MoreVertical size={20} />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-60 bg-[#1a1a1e] border border-white/5 rounded-xl shadow-2xl p-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-white/5 mb-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Options</p>
                        </div>
                        <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                          <Download size={14} /> Export Transcript
                        </button>
                        <button onClick={handleClearChat} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                          <Trash2 size={14} /> Clear Local View
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 scrollbar-hide bg-[#09090b]/50 relative" ref={scrollContainerRef}>
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
                        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 shadow-2xl">
                          <div className="flex items-center gap-3 mb-8 opacity-60">
                             <div className="p-2 bg-white/10 rounded-lg">
                               <Zap size={16} className="text-white fill-white" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Forum Intelligence</span>
                               <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Dialogue Support Active</span>
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

                          <div className="flex items-center gap-6 mt-10 text-white/20 border-t border-white/5 pt-6">
                            <div className="flex items-center gap-5">
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><Search size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><Send size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><ThumbsUp size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><ThumbsDown size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><RotateCcw size={18} /></div>
                               <div className="cursor-pointer hover:text-white transition-colors p-1"><MoreHorizontal size={18} /></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isAI && (
                        <div className="group relative">
                          <div className={`border rounded-2xl p-6 transition-all ${post.is_mine || post.is_optimistic ? 'bg-indigo-600/10 border-indigo-500/30 ml-auto max-w-[85%]' : 'bg-[#111114] border-white/5 max-w-[85%]'}`}>
                            {post.is_optimistic && (
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Posting...</span>
                              </div>
                            )}
                            <div className={`text-white/70 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap font-medium ${post.is_optimistic ? 'opacity-40' : ''}`}>
                              {post.censored_content || post.content}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/[0.02]">
                              <div className="flex items-center gap-6">
                                <button 
                                  onClick={() => handleReaction(post.id, 'like')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest 
                                    ${post.reaction_count > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-white/20 hover:text-white'}`}
                                >
                                  <ThumbsUp size={12} />
                                  <span>{post.reaction_count || 0} Agree</span>
                                </button>
                                <button className="flex items-center gap-2 text-white/20 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                                  <MessageSquare size={12} />
                                  <span>{post.reply_count || 0} Replies</span>
                                </button>
                              </div>
                              <button 
                                onClick={() => handleFlag(post.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/10 hover:text-rose-500"
                              >
                                <EyeOff size={14} />
                              </button>
                            </div>
                          </div>
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
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 md:p-10 border-t border-white/5 bg-[#0d0d0f] z-20">
            <div className="max-w-4xl mx-auto">
              {quickActions.length > 0 && (
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap mr-2">Quick Actions:</span>
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setNewContent(action.prompt)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all whitespace-nowrap group"
                    >
                      <span className={`${zoneTheme.text} group-hover:scale-110 transition-transform`}>{action.icon}</span>
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-0 blur-2xl opacity-0 group-focus-within:opacity-30 transition-opacity rounded-full"
                  style={{ backgroundColor: `rgba(${themeRGB}, 0.2)` }} />
                <div className="relative flex flex-col bg-[#161619] border border-white/10 rounded-2xl overflow-hidden transition-all shadow-2xl focus-within:border-opacity-50"
                  style={{ borderColor: `rgba(${themeRGB}, 0.2)` }}>
                  <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: `rgb(${themeRGB})` }} />
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Dialogue Sector Active</span>
                    </div>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Category: {category}</span>
                  </div>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePost();
                      }
                    }}
                    placeholder={`Start a dialogue in ${category}...`}
                    className="w-full bg-transparent p-6 text-[15px] text-white placeholder-white/10 focus:outline-none resize-none min-h-[100px] font-medium leading-relaxed"
                  />
                  <div className="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                      <button className="text-white/40 hover:text-white"><Hash size={16} /></button>
                      <button className="text-white/40 hover:text-white"><Shield size={16} /></button>
                      <button className="text-white/40 hover:text-white"><Clock size={16} /></button>
                    </div>
                    <button
                      onClick={handlePost}
                      disabled={!newContent.trim()}
                      className={`group flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all
                          ${newContent.trim()
                          ? 'text-white shadow-lg'
                          : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                      style={newContent.trim() ? {
                        backgroundColor: `rgb(${themeRGB})`,
                        boxShadow: `0 4px 20px rgba(${themeRGB}, 0.3)`
                      } : {}}
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Post Dialogue</span>
                      <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">
                This is an open campus dialogue. Please maintain institutional decorum.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  )
}
