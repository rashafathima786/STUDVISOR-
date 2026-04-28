import React, { useState } from 'react'
import { Send, FileText, Link as LinkIcon, Image, MoreVertical, MessageSquare, Plus, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ClassroomStream() {
  const [announcement, setAnnouncement] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const classData = {
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    semester: 'Fall 2026',
    coverGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    upcoming: [
      { id: 1, title: 'Assignment 3: BST', due: 'Tomorrow, 11:59 PM' },
      { id: 2, title: 'Midterm Exam', due: 'Friday, 10:00 AM' }
    ],
    feed: [
      {
        id: 101,
        type: 'material',
        author: 'Dr. Rajesh Kumar',
        time: 'Yesterday',
        content: 'I have uploaded the lecture slides for Graph Algorithms. Please review them before tomorrow\'s lab session.',
        attachments: [{ type: 'pdf', name: 'Lec_12_Graphs.pdf' }]
      },
      {
        id: 102,
        type: 'announcement',
        author: 'Dr. Rajesh Kumar',
        time: 'Oct 15',
        content: 'Reminder: The hackathon registration closes tonight. I highly encourage all of you to participate to get hands-on experience.',
        attachments: []
      }
    ]
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Hero Banner */}
      <div 
        className="relative h-48 rounded-[32px] overflow-hidden flex items-end p-8 border border-white/10 shadow-2xl"
        style={{ background: classData.coverGradient }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{classData.name}</h1>
          <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">{classData.semester} • {classData.code}</p>
        </div>
        <button className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-white">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Upcoming */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card glass-panel p-6 border-white/5 bg-white/[0.02]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
              <Clock size={14} /> Upcoming
            </h3>
            <div className="space-y-4">
              {classData.upcoming.map(item => (
                <div key={item.id} className="group">
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors cursor-pointer">{item.title}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase mt-1">Due {item.due}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-xl border border-white/5 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all">View all</button>
          </div>
        </div>

        {/* Right Stream Feed */}
        <div className="flex-1 space-y-6">
          {/* Announce Box */}
          <div className="card glass-panel bg-white/[0.03] border-white/10 p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0">
                R
              </div>
              <div className="flex-1">
                <textarea 
                  placeholder="Announce something to your class..." 
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  onFocus={() => setIsPosting(true)}
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 resize-none py-2 text-sm"
                  rows={isPosting ? 3 : 1}
                />
                
                <AnimatePresence>
                  {isPosting && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between mt-4 pt-4 border-t border-white/5"
                    >
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"><FileText size={18} /></button>
                        <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"><LinkIcon size={18} /></button>
                        <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"><Image size={18} /></button>
                      </div>
                      <div className="flex gap-3">
                        <button className="text-xs font-bold text-white/40 uppercase tracking-widest px-4 py-2" onClick={() => setIsPosting(false)}>Cancel</button>
                        <button className="primary-btn compact-btn">Post</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Feed Items */}
          {classData.feed.map(post => (
            <motion.div 
              key={post.id} 
              className="card glass-panel p-6 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex gap-4 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${post.type === 'material' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                  {post.type === 'material' ? <FileText size={20} /> : <MessageSquare size={20} />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {post.author} <span className="text-white/40 font-medium">posted a new {post.type}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{post.time}</span>
                </div>
                <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white">
                  <MoreVertical size={18} />
                </button>
              </div>
              
              <div className="pl-14">
                <p className="text-sm text-white/80 leading-relaxed mb-6">{post.content}</p>
                
                {post.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer w-fit pr-12">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{att.name}</div>
                      <div className="text-[10px] font-bold text-white/30 uppercase">{att.type}</div>
                    </div>
                  </div>
                ))}

                <div className="mt-8 flex gap-4 items-center">
                   <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-xs">R</div>
                   <input 
                    type="text" 
                    placeholder="Add class comment..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white/60 placeholder:text-white/20"
                   />
                   <button className="p-2 text-primary opacity-40 hover:opacity-100 transition-opacity"><Send size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
