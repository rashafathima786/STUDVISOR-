import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'
import { fetchAnonPosts, fetchEvents, fetchPolls, fetchAnnouncements, fetchLostFound } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Shield, 
  MessageSquare, 
  TrendingUp, 
  ChevronRight,
  Clock,
  ThumbsUp,
  UserCheck,
  Zap,
  Calendar,
  BarChart3,
  Search,
  Megaphone, Hash
} from 'lucide-react'

export default function CampusHub() {
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [polls, setPolls] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [lostFound, setLostFound] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsData, eventsData, pollsData, announcementsData, lostFoundData] = await Promise.all([
          fetchAnonPosts(),
          fetchEvents(),
          fetchPolls(),
          fetchAnnouncements(),
          fetchLostFound()
        ])
        setPosts(Array.isArray(postsData?.posts) ? postsData.posts.slice(0, 3) : [])
        setEvents(Array.isArray(eventsData?.events) ? eventsData.events.slice(0, 1) : [])
        setPolls(Array.isArray(pollsData?.polls) ? pollsData.polls.slice(0, 1) : [])
        setAnnouncements(Array.isArray(announcementsData?.announcements) ? announcementsData.announcements.slice(0, 1) : [])
        setLostFound(Array.isArray(lostFoundData?.items) ? lostFoundData.items.slice(0, 3) : [])
      } catch (err) {
        console.error('Error fetching campus data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <ErpLayout title="Campus Connect" subtitle="Stay connected with your campus community">
      <motion.div 
        className="bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Community - General Forum Bento Tile */}
        <motion.div variants={itemVariants} className="bento-tile bento-span-2 bento-row-span-2 overflow-hidden flex flex-col" style={{ cursor: 'default' }}>
          <div className="p-6 flex items-center justify-between border-b border-border-color">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Globe size={20} className="text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface uppercase tracking-wider">General Forum</span>
                <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Open Campus Dialogue</span>
              </div>
            </div>
            <Link to="/forum" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container border border-border-color text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest hover:bg-surface-container-high hover:text-on-surface transition-all">
              Open Forum <ChevronRight size={12} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {posts.length > 0 ? (
                posts.map((post, idx) => {
                  const isAI = post.session_hash === "NEXUS_AI_BOT" || post.content.startsWith("### 🟢") || post.content.includes("STATUS");
                  const isAcademic = post.content.includes("STATUS") || post.content.includes("CGPA");
                  
                  return (
                    <motion.div 
                      key={post.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border border-border-color ${isAI ? 'bg-indigo-500/5' : 'bg-surface-container'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           {isAI ? (
                             <Shield size={10} className="text-emerald-400" />
                           ) : (
                             <UserCheck size={10} className="text-indigo-400" />
                           )}
                           <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                             {isAI ? 'Verified Intel' : 'Verified Node'}
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-40">
                          <Clock size={10} className="text-on-surface" />
                          <span className="text-[9px] font-bold text-on-surface uppercase tracking-widest">
                            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {isAcademic ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-4">
                            <div className="flex-1 bg-surface-container-high p-2.5 rounded-lg border border-border-color">
                              <span className="text-[8px] font-bold text-on-surface-variant/50 uppercase block mb-0.5">Attendance</span>
                              <span className="text-sm font-black text-on-surface">{post.content.match(/Att\s+([\d.]+)%/)?.[1] || "77.8"}%</span>
                            </div>
                            <div className="flex-1 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
                              <span className="text-[8px] font-bold text-indigo-400/60 uppercase block mb-0.5">CGPA</span>
                              <span className="text-sm font-black text-indigo-400">{post.content.match(/CGPA\s+([\d.]+)/)?.[1] || "8.82"}</span>
                            </div>
                          </div>
                          <div className="bg-surface-container-high p-2 rounded-lg border border-border-color flex items-center gap-2">
                            <TrendingUp size={10} className="text-on-surface-variant/40" />
                            <span className="text-[9px] font-bold text-on-surface-variant/60 truncate">
                              Next: {post.content.split("ACTION:")[1]?.split("*")[1]?.trim() || "Review Curriculum"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-on-surface font-medium leading-relaxed mb-3 line-clamp-2">
                          {post.content.replace(/### 🟢\s*/, '')}
                        </p>
                      )}
                      
                      {!isAcademic && (
                        <div className="flex items-center gap-4 text-[9px] font-bold text-on-surface-variant/30 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><MessageSquare size={10} /> {post.reply_count || 0} Replies</span>
                          <span className="flex items-center gap-1.5"><ThumbsUp size={10} /> {post.reaction_count || 0} Reactions</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Globe size={48} className="mb-4 text-on-surface" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface">No recent transmissions</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="p-6 bg-surface-container/40 border-t border-border-color flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
             <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">Institutional Encryption Active</span>
          </div>
        </motion.div>

        {/* Events - Wide Bento Tile */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/events" className="bento-tile overflow-hidden flex flex-col group" style={{ height: '100%' }}>
            <div className="p-6 flex items-center justify-between border-b border-border-color bg-surface-container/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                  <Calendar size={22} className="text-rose-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em] mb-0.5">Campus Schedule</span>
                  <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Upcoming Events</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-rose-500/20 transition-all">
                <ChevronRight size={16} className="text-on-surface-variant/30 group-hover:text-on-surface group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
            
            <div className="flex-1 p-6 flex flex-col justify-center space-y-4">
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <div key={event.id || idx} className="flex items-center gap-6 p-5 rounded-2xl bg-surface-container border border-border-color hover:bg-surface-container-high transition-all group/item">
                    <div className="flex flex-col items-center justify-center bg-surface-container-high border border-border-color rounded-xl w-16 h-16 shadow-lg group-hover/item:border-rose-500/30 transition-colors">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">
                        {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-black text-on-surface leading-none mt-1">
                        {new Date(event.event_date).getDate()}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[8px] font-black text-rose-400 uppercase tracking-widest">
                          {event.category || 'Institutional'}
                        </span>
                        <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest italic">{event.time || '10:00 AM'}</span>
                      </div>
                      <span className="text-base font-bold text-on-surface mb-1 group-hover/item:text-primary transition-colors">{event.title}</span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                        <Globe size={10} />
                        <span>{event.venue}</span>
                      </div>
                    </div>
                    {event.user_rsvped ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Shield size={14} className="text-emerald-400" />
                        </div>
                        <span className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest">RSVP'd</span>
                      </div>
                    ) : (
                      <button className="px-4 py-2 rounded-lg bg-surface-container border border-border-color text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest hover:bg-surface-container-high hover:text-on-surface transition-all">RSVP</button>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-20 space-y-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-on-surface flex items-center justify-center">
                    <Calendar size={24} className="text-on-surface" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface">Sector Clear: No Events</p>
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* Polls */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/polls" className="bento-tile overflow-hidden flex flex-col group" style={{ height: '100%' }}>
            <div className="p-6 flex items-center justify-between border-b border-border-color bg-surface-container/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <BarChart3 size={22} className="text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.2em] mb-0.5">Campus Voice</span>
                  <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Active Polls</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                <ChevronRight size={16} className="text-on-surface-variant/30 group-hover:text-on-surface group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
            
            <div className="flex-1 p-8 flex flex-col justify-center">
              {polls.length > 0 ? (
                <div className="p-6 rounded-2xl bg-surface-container border border-border-color shadow-2xl relative overflow-hidden group/poll">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/poll:opacity-10 transition-opacity">
                    <Zap size={64} className="text-emerald-500" />
                  </div>
                  <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Trending Opinion
                  </p>
                  <p className="text-base font-bold text-on-surface mb-8 leading-relaxed tracking-tight">"{polls[0].question}"</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">
                        <span>Major Consensus</span>
                        <span className="text-emerald-400">60% Agree</span>
                      </div>
                      <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden border border-border-color">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-color">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-highest" />
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-surface bg-emerald-500/20 flex items-center justify-center text-[8px] font-black text-emerald-400">
                          +42
                        </div>
                     </div>
                     <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest italic">Ends in 18 hours</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-20 space-y-4">
                  <BarChart3 size={32} className="text-on-surface" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface">No active ballots</p>
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* Lost & Found */}
        <motion.div variants={itemVariants} className="bento-span-1">
          <Link to="/lost-found" className="bento-tile overflow-hidden flex flex-col group" style={{ height: '100%' }}>
            <div className="p-6 flex items-center justify-between border-b border-border-color">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Search size={20} className="text-amber-400" />
                </div>
                <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Lost & Found</span>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30 group-hover:text-on-surface group-hover:translate-x-1 transition-all" />
            </div>
            
            <div className="flex-1 p-6 space-y-3">
              {lostFound.length > 0 ? (
                lostFound.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-border-color hover:bg-surface-container-high transition-all">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Hash size={14} className="text-amber-400/60" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-on-surface truncate">{item.item_name || item.item}</span>
                      <span className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{item.location}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-20 space-y-3">
                  <Search size={24} className="text-on-surface" />
                  <p className="text-[8px] font-bold uppercase tracking-widest text-center text-on-surface">Protocol Clean: No items</p>
                </div>
              )}
            </div>
          </Link>
        </motion.div>

        {/* Announcements */}
        <motion.div variants={itemVariants} className="bento-span-1">
          <Link to="/announcements" className="bento-tile overflow-hidden flex flex-col group" style={{ height: '100%' }}>
            <div className="p-6 flex items-center justify-between border-b border-border-color">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Megaphone size={20} className="text-primary" />
                </div>
                <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Bulletins</span>
              </div>
              <ChevronRight size={16} className="text-on-surface-variant/30 group-hover:text-on-surface group-hover:translate-x-1 transition-all" />
            </div>
            
            <div className="flex-1 p-6 flex flex-col justify-center">
               <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-primary/10 blur-xl rounded-full" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Latest Broadcast</span>
                  <p className="text-[11px] font-bold text-on-surface-variant leading-relaxed line-clamp-3">
                    {announcements[0]?.content || "Institutional semester registrations are now open for all departments. Verify your credentials."}
                  </p>
               </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </ErpLayout>
  )
}
