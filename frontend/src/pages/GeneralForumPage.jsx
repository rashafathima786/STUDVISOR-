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
  Globe, 
  Activity, 
  Cpu, 
  Calendar, 
  Users,
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
  AudioLines,
  Menu,
  X
} from 'lucide-react'

export default function GeneralForumPage() {
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState("General")
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [isSending, setIsSending] = useState(false) 
  const [postCache, setPostCache] = useState({}) 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isFirstLoad = useRef(true)
  const shouldScrollRef = useRef(false)

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

      setPosts(current => {
        const currentIds = current.map(p => p.id).join(',')
        const newIds = filtered.map(p => p.id).join(',')
        if (currentIds === newIds) return current
        return filtered
      })
      
      setPostCache(prev => ({ ...prev, [category]: filtered }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
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
      // Calculate if user was near bottom BEFORE the update
      const threshold = 300
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
      
      if (isFirstLoad.current || shouldScrollRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: isFirstLoad.current ? 'auto' : 'smooth' })
          isFirstLoad.current = false
          shouldScrollRef.current = false
        }, 100)
      } else if (isAtBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
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
    shouldScrollRef.current = true // Force scroll on next render

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
      <div className="wrapper flex flex-col lg:flex-row h-[calc(100vh-160px)] lg:h-[calc(100vh-140px)] overflow-hidden bg-transparent backdrop-blur-3xl rounded-[2.5rem] border border-border-color text-on-surface font-sans relative">

        {/* Sidebar (Desktop) */}
        <div className="w-80 flex flex-col bg-surface-container/30 backdrop-blur-md hidden lg:flex border-r border-border-color">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield size={18} className="text-primary" />
              </div>
              <span className="text-xs font-black tracking-[0.2em] text-on-surface-variant uppercase">Campus Feed</span>
            </div>

            <nav className="space-y-2">
              {channels.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${category === c.id
                      ? 'bg-primary/10 text-on-surface shadow-lg border-primary/20'
                      : 'text-on-surface-variant/40 border-transparent hover:bg-surface-container hover:text-on-surface'
                    }`}
                >
                  <div className={`transition-colors duration-200 ${category === c.id ? 'text-primary' : 'opacity-40'}`}>
                    {c.icon}
                  </div>
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="text-sm font-black truncate tracking-tight">{c.name}</span>
                    <span className="text-[10px] opacity-40 truncate font-bold uppercase tracking-wider">{c.desc}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-border-color">
            <div className="flex items-center gap-3 text-on-surface-variant/20">
              <Info size={14} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Privacy Protocols Active</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-transparent relative">
          
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-surface-container/50 backdrop-blur-2xl border-b border-border-color sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-surface-container rounded-xl border border-border-color text-on-surface"
              >
                <Menu size={20} />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-on-surface">{activeChannel.name}</span>
                <span className="text-[9px] font-bold uppercase text-primary/60 tracking-tighter">Campus Feed Matrix</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[9px] font-black text-on-surface-variant/30 uppercase tracking-widest">Live</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide bg-transparent relative" ref={scrollContainerRef}>
            <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
            <AnimatePresence initial={false}>
              {posts.length > 0 ? (
                posts.map((post, idx) => {
                  const isAI = post.session_hash === "NEXUS_AI_BOT" || post.content.startsWith("### \ud83d\udfe2");
                    return (
                      <motion.div 
                        key={post.id || idx}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="mb-10"
                      >
                        <div className="flex items-center justify-between mb-3 px-2">
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${isAI ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-primary/60 shadow-[0_0_12px_rgba(124,58,237,0.3)]'} animate-pulse`} />
                             <span className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.3em]">
                               {isAI ? 'Forum Intelligence' : 'Verified Student'}
                             </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-30">
                            <Clock size={12} className="text-on-surface" />
                            <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">
                              {new Date(post.date || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {isAI && (
                          <div className="w-full py-4 px-6 rounded-[32px] bg-surface-container/20 border border-border-color">
                            <div className="flex items-center gap-2 mb-6 opacity-40">
                               <AudioLines size={14} className="text-on-surface" />
                               <span className="text-[11px] font-bold text-on-surface tracking-tight uppercase tracking-widest">AI Thought Stream</span>
                            </div>

                            <div className="text-on-surface/90">
                              <div className="prose dark:prose-invert prose-p:leading-relaxed prose-p:mb-6 max-w-none 
                                  prose-headings:text-on-surface prose-headings:font-black prose-headings:text-lg prose-headings:mb-4
                                  prose-strong:text-on-surface prose-strong:font-black
                                  prose-ul:list-disc prose-ul:pl-5 prose-li:mb-2 prose-li:text-on-surface/80
                                  text-on-surface">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {(post.censored_content || post.content || "").replace(/\\n/g, '\n')}
                                </ReactMarkdown>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 mt-8 opacity-20 hover:opacity-100 transition-opacity">
                               <div className="flex items-center gap-4">
                                  <button className="hover:text-primary transition-colors"><Search size={16} /></button>
                                  <button className="hover:text-primary transition-colors"><ThumbsUp size={16} /></button>
                                  <button className="hover:text-primary transition-colors"><ThumbsDown size={16} /></button>
                                  <button className="hover:text-primary transition-colors"><RotateCcw size={16} /></button>
                               </div>
                            </div>
                          </div>
                        )}

                        {!isAI && (
                          <div className={`group relative w-full flex ${post.is_mine || post.is_optimistic ? 'justify-end' : 'justify-start'}`}>
                            {post.is_mine || post.is_optimistic ? (
                              <div className="bg-primary text-surface rounded-3xl px-6 py-3.5 max-w-[85%] shadow-xl shadow-primary/10 border border-primary/20">
                                 <div className="text-surface font-bold text-[15px] leading-relaxed">
                                   {post.censored_content || post.content}
                                 </div>
                              </div>
                            ) : (
                              <div className="max-w-[85%] py-2">
                                 <div className="bg-surface-container/50 border border-border-color rounded-3xl px-6 py-3.5 text-on-surface leading-relaxed font-bold text-[15px] shadow-sm">
                                   {post.censored_content || post.content}
                                 </div>
                                 <div className="flex items-center gap-4 mt-3 opacity-0 group-hover:opacity-40 transition-opacity ml-2">
                                    <button onClick={() => handleReaction(post.id, 'like')} className="hover:text-primary flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"><ThumbsUp size={12} /> {post.reaction_count || 0}</button>
                                    <button onClick={() => handleFlag(post.id)} className="hover:text-red-400 transition-colors"><EyeOff size={14} /></button>
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
                     <div className="w-24 h-24 rounded-full border-2 border-dashed border-on-surface flex items-center justify-center">
                       <Hash size={40} />
                     </div>
                     <div className="text-center">
                       <h3 className="text-lg font-black uppercase tracking-[0.4em] text-on-surface">No Posts</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest mt-2">No transmissions detected in {category}</p>
                     </div>
                  </div>
                )}
              </AnimatePresence>
              <div className="h-48 lg:h-64" />
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none pb-4 lg:pb-8 bg-gradient-to-t from-surface via-surface/80 to-transparent pt-20">
            <div className="max-w-4xl mx-auto px-4 lg:px-6 pointer-events-auto">
              {quickActions.length > 0 && (
                <div className="flex items-center lg:justify-center gap-3 mb-4 lg:mb-6 overflow-x-auto pb-2 scrollbar-hide no-scrollbar w-full px-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setNewContent(action.prompt)}
                      className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-surface-container border border-border-color hover:bg-surface-container-high hover:border-primary/30 transition-all whitespace-nowrap group shadow-lg"
                    >
                      <span className={`${zoneTheme.text} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all`}>{action.icon}</span>
                      <span className="text-[10px] font-black text-on-surface-variant/40 group-hover:text-on-surface uppercase tracking-[0.2em] transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative group">
                <div className="absolute inset-0 blur-2xl opacity-0 group-focus-within:opacity-20 transition-opacity rounded-full bg-primary" />
                
                <div className="relative flex items-center bg-surface-container border border-border-color rounded-[32px] px-2 py-2 shadow-2xl focus-within:border-primary/40 transition-all">
                  <button className="p-3 text-on-surface-variant/20 hover:text-primary transition-colors">
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
                    placeholder={`Transmit to ${activeChannel.name}...`}
                    className="flex-1 bg-transparent px-2 py-2 text-[16px] text-on-surface placeholder-on-surface-variant/20 focus:outline-none resize-none overflow-y-auto max-h-40 font-bold leading-relaxed"
                  />

                  <div className="flex items-center gap-1 sm:gap-3 pr-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors text-on-surface-variant/20 hover:text-on-surface border border-transparent hover:border-border-color">
                      <span className="text-[11px] font-black tracking-tight uppercase">Turbo</span>
                      <ChevronDown size={14} />
                    </div>

                    <button className="p-2.5 text-on-surface-variant/20 hover:text-primary transition-colors">
                      <Mic size={20} />
                    </button>

                    <button
                      onClick={handlePost}
                      disabled={!newContent.trim()}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                        ${newContent.trim() 
                          ? 'bg-primary text-surface scale-100 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' 
                          : 'bg-surface-container-high text-on-surface-variant/20 scale-95'}`}
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
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-surface z-[101] lg:hidden flex flex-col p-8 border-r border-border-color shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Shield size={22} />
                   </div>
                   <span className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Campus Feed</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 bg-surface-container rounded-xl text-on-surface-variant/40 hover:text-on-surface"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-3">
                {channels.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCategory(c.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-5 rounded-[24px] transition-all duration-300 border ${category === c.id
                        ? 'bg-primary text-surface shadow-xl shadow-primary/20 border-primary/20 scale-[1.02]'
                        : 'text-on-surface-variant/60 border-transparent hover:bg-surface-container'
                      }`}
                  >
                    <div className={`${category === c.id ? 'text-surface' : 'text-primary'}`}>
                      {c.icon}
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-black tracking-tight">{c.name}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${category === c.id ? 'text-surface/60' : 'text-on-surface-variant/30'}`}>{c.desc}</span>
                    </div>
                  </button>
                ))}
              </nav>

              <div className="mt-auto pt-8 border-t border-border-color">
                 <div className="flex items-center gap-4 p-5 bg-surface-container/50 rounded-2xl border border-border-color">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Secure Node Connected</p>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ErpLayout>
  )
}
