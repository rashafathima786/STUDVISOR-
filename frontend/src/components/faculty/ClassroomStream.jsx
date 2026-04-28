import React, { useState } from 'react'
import { Send, FileText, Link as LinkIcon, Image, MoreVertical, MessageSquare } from 'lucide-react'

export default function ClassroomStream() {
  const [announcement, setAnnouncement] = useState('')

  const classData = {
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    semester: 'Fall 2026',
    coverGradient: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
    upcoming: [
      { id: 1, title: 'Assignment 3: BST', due: 'Tomorrow, 11:59 PM' },
      { id: 2, title: 'Midterm Exam', due: 'Friday, 10:00 AM' }
    ],
    feed: [
      {
        id: 101,
        type: 'material',
        author: 'Dr. Menon',
        time: 'Yesterday',
        content: 'I have uploaded the lecture slides for Graph Algorithms. Please review them before tomorrow\'s lab session.',
        attachments: [{ type: 'pdf', name: 'Lec_12_Graphs.pdf' }]
      },
      {
        id: 102,
        type: 'announcement',
        author: 'Dr. Menon',
        time: 'Oct 15',
        content: 'Reminder: The hackathon registration closes tonight. I highly encourage all of you to participate to get hands-on experience.',
        attachments: []
      }
    ]
  }

  return (
    <div className="gc-wrapper">
      {/* Hero Banner */}
      <div className="gc-hero" style={{ background: classData.coverGradient }}>
        <div className="gc-hero-content">
          <h1>{classData.name}</h1>
          <p>{classData.semester} • {classData.code}</p>
        </div>
        <button className="gc-hero-settings"><MoreVertical size={20} color="#fff" /></button>
      </div>

      <div className="gc-main">
        {/* Left Sidebar: Upcoming */}
        <div className="gc-sidebar">
          <div className="gc-card gc-upcoming">
            <div className="gc-upcoming-header">
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Upcoming</h3>
            </div>
            <div className="gc-upcoming-list">
              {classData.upcoming.map(item => (
                <div key={item.id} className="gc-upcoming-item">
                  <p className="gc-due-title">{item.title}</p>
                  <p className="gc-due-time">Due {item.due}</p>
                </div>
              ))}
            </div>
            <button className="gc-view-all">View all</button>
          </div>
        </div>

        {/* Right Stream Feed */}
        <div className="gc-feed">
          {/* Announce Box */}
          <div className="gc-card gc-announce-box">
            <div className="gc-announce-header">
              <div className="gc-avatar">M</div>
              <input 
                type="text" 
                placeholder="Announce something to your class..." 
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                className="gc-announce-input"
              />
            </div>
            {announcement && (
              <div className="gc-announce-actions">
                <div className="gc-action-icons">
                  <button><FileText size={18} /></button>
                  <button><LinkIcon size={18} /></button>
                  <button><Image size={18} /></button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="gc-btn-secondary" onClick={() => setAnnouncement('')}>Cancel</button>
                  <button className="gc-btn-primary">Post</button>
                </div>
              </div>
            )}
          </div>

          {/* Feed Items */}
          {classData.feed.map(post => (
            <div key={post.id} className="gc-card gc-post">
              <div className="gc-post-header">
                <div className="gc-post-icon">
                  {post.type === 'material' ? <FileText size={20} color="#fff" /> : <MessageSquare size={20} color="#fff" />}
                </div>
                <div className="gc-post-meta">
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#111827' }}>
                    {post.author} posted a new {post.type}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{post.time}</span>
                </div>
                <button className="gc-post-more"><MoreVertical size={18} color="#6b7280" /></button>
              </div>
              
              <div className="gc-post-content">
                <p>{post.content}</p>
                {post.attachments.map((att, i) => (
                  <div key={i} className="gc-attachment">
                    <div className="gc-att-icon"><FileText size={24} color="#ef4444" /></div>
                    <div className="gc-att-info">
                      <span className="gc-att-name">{att.name}</span>
                      <span className="gc-att-type">{att.type.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="gc-post-footer">
                <input type="text" placeholder="Add class comment..." className="gc-comment-input" />
                <button className="gc-send-comment"><Send size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
