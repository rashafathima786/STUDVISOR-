import React, { useState, useEffect } from 'react'
import { Send, FileText, Link as LinkIcon, Image, MoreVertical, MessageSquare, Plus, Clock, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createFacultyAnnouncement, fetchAnnouncements } from '../../services/api'
import { useToast } from '../../stores/toastStore'

export default function ClassroomStream({ subjects = [], assignments = [] }) {
  const [announcement, setAnnouncement] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [activeSubject, setActiveSubject] = useState(null)
  const [localAnnouncements, setLocalAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (subjects.length > 0 && !activeSubject) {
      setActiveSubject(subjects[0])
    }
  }, [subjects])

  useEffect(() => {
    setLoadingAnnouncements(true)
    fetchAnnouncements()
      .then(res => {
        setLocalAnnouncements(res?.announcements || [])
      })
      .finally(() => setLoadingAnnouncements(false))
  }, [])

  const handlePost = async () => {
    if (!announcement.trim()) return
    setSubmitting(true)
    try {
      await createFacultyAnnouncement({
        title: `Announcement for ${activeSubject?.name || 'Class'}`,
        content: announcement,
        target_scope: activeSubject?.code || 'all'
      })
      toast.success('Announcement published to stream')
      setAnnouncement('')
      setIsPosting(false)
      // Refresh local announcements
      const res = await fetchAnnouncements()
      setLocalAnnouncements(res?.announcements || [])
    } catch (err) {
      toast.error('Failed to post announcement')
    } finally {
      setSubmitting(false)
    }
  }

  // Combine and sort feed items
  const feed = [
    ...localAnnouncements.map(a => ({
      id: `ann-${a.id}`,
      type: 'announcement',
      author: 'You',
      time: new Date(a.created_at).toLocaleDateString(),
      content: a.content,
      attachments: []
    })),
    ...assignments.filter(a => activeSubject ? true : true).map(a => ({
      id: `assn-${a.id}`,
      type: 'material',
      author: 'System',
      time: a.due || 'Recently',
      content: `New Assignment Posted: ${a.title}`,
      attachments: [{ type: 'pdf', name: 'Task_Brief.pdf' }]
    }))
  ].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)

  const upcoming = assignments.slice(0, 2).map(a => ({
    id: a.id,
    title: a.title,
    due: a.due
  }))

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Hero Banner */}
      <div 
        className="relative h-48 rounded-[32px] overflow-hidden flex flex-col justify-end p-8 border border-white/10 shadow-2xl transition-all"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{activeSubject?.name || 'Academic Stream'}</h1>
            <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">
              {activeSubject?.code || 'All Nodes'} • {subjects.length} Active Courses
            </p>
          </div>
          <div className="flex gap-2">
            {subjects.map(s => (
              <button 
                key={s.id}
                onClick={() => setActiveSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all
                  ${activeSubject?.id === s.id ? 'bg-white text-primary' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>
        <button className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-white">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Upcoming */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card glass-panel p-6 border-border-color bg-surface-container-low">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/40 mb-6 flex items-center gap-2">
              <Clock size={14} /> Critical Deadlines
            </h3>
            <div className="space-y-4">
              {upcoming.length > 0 ? upcoming.map(item => (
                <div key={item.id} className="group">
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer">{item.title}</p>
                  <p className="text-[10px] font-bold text-on-surface-variant/30 uppercase mt-1">Due {item.due}</p>
                </div>
              )) : (
                <p className="text-[10px] font-bold text-on-surface-variant/20 uppercase">No upcoming deadlines</p>
              )}
            </div>
            <button className="w-full mt-6 py-3 rounded-xl border border-border-color hover:bg-on-surface/5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 transition-all">View all</button>
          </div>
        </div>

        {/* Right Stream Feed */}
        <div className="flex-1 space-y-6">
          {/* Announce Box */}
          <div className="card glass-panel bg-surface-container border-border-color p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
                {activeSubject?.name?.[0] || 'F'}
              </div>
              <div className="flex-1">
                <textarea 
                  placeholder={`Announce something to ${activeSubject?.code || 'your class'}...`} 
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  onFocus={() => setIsPosting(true)}
                  className="w-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/20 resize-none py-2 text-sm"
                  rows={isPosting ? 3 : 1}
                />
                
                <AnimatePresence>
                  {isPosting && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between mt-4 pt-4 border-t border-border-color"
                    >
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant/40 hover:text-on-surface transition-colors"><FileText size={18} /></button>
                        <button className="p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant/40 hover:text-on-surface transition-colors"><LinkIcon size={18} /></button>
                        <button className="p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant/40 hover:text-on-surface transition-colors"><Image size={18} /></button>
                      </div>
                      <div className="flex gap-3">
                        <button className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest px-4 py-2" onClick={() => setIsPosting(false)}>Cancel</button>
                        <button 
                          className="bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg" 
                          onClick={handlePost}
                          disabled={submitting || !announcement.trim()}
                        >
                          {submitting ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Feed Items */}
          {feed.length > 0 ? feed.map(post => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card glass-panel p-6 border-border-color bg-surface-container-low hover:bg-surface-container transition-colors group"
            >
              <div className="flex gap-4 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${post.type === 'material' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                  {post.type === 'material' ? <FileText size={20} /> : <MessageSquare size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-surface leading-tight">
                    {post.author} <span className="text-on-surface-variant/40 font-medium">posted a new {post.type}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-widest">{post.time}</span>
                </div>
                <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant/40 hover:text-on-surface">
                  <MoreVertical size={18} />
                </button>
              </div>
              
              <div className="pl-14">
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
                
                {post.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-on-surface/5 border border-border-color hover:bg-on-surface/10 transition-colors cursor-pointer w-fit pr-12">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{att.name}</div>
                      <div className="text-[10px] font-bold text-on-surface-variant/30 uppercase">{att.type}</div>
                    </div>
                  </div>
                ))}

                <div className="mt-8 flex gap-4 items-center">
                   <div className="w-8 h-8 rounded-full bg-on-surface/5 border border-border-color flex items-center justify-center text-on-surface-variant/40 text-xs font-bold uppercase tracking-widest">
                    {activeSubject?.code?.[0]}
                   </div>
                   <input 
                    type="text" 
                    placeholder="Add class comment..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs text-on-surface-variant placeholder:text-on-surface-variant/20"
                   />
                   <button className="p-2 text-primary opacity-40 hover:opacity-100 transition-opacity"><Send size={16} /></button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/10">
              <BookOpen size={48} className="mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">No activity in this stream yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
