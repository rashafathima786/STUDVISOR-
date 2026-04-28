import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'

export default function AcademicsHub() {
  return (
    <ErpLayout title="Academics" subtitle="Manage your academic journey">
      <div className="bento-grid">
        
        {/* Assignments - Large Bento Tile */}
        <div className="bento-tile bento-span-2 bento-row-span-2" style={{ cursor: 'default' }}>
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">📝</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Assignments</span>
              <span className="hub-tile-desc text-on-surface-variant/80">Submit & track work</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/assignments" className="bento-task-action primary px-4 py-2">View All</Link>
            </div>
          </div>
          <div className="bento-internal-scroll mt-4">
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title text-on-surface">OS Lab Report</span>
                <span className="bento-task-meta text-tertiary/70 font-semibold">Due: Tomorrow, 11:59 PM</span>
              </div>
              <button className="bento-task-action primary">Submit</button>
            </div>
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title text-on-surface">DB Systems Quiz 3</span>
                <span className="bento-task-meta text-primary/70 font-semibold">Due: Oct 15, 5:00 PM</span>
              </div>
              <button className="bento-task-action primary">Take Quiz</button>
            </div>
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title text-on-surface">Computer Networks Project</span>
                <span className="bento-task-meta text-on-surface-variant/60 font-semibold">Due: Oct 20, 11:59 PM</span>
              </div>
              <button className="bento-task-action">Details</button>
            </div>
            <div className="bento-task-item">
              <div className="bento-task-info">
                <span className="bento-task-title text-on-surface">Data Structures Assignment 4</span>
                <span className="bento-task-meta text-on-surface-variant/60 font-semibold">Due: Oct 25, 11:59 PM</span>
              </div>
              <button className="bento-task-action">Details</button>
            </div>
          </div>
        </div>

        {/* Timetable - Wide Bento Tile */}
        <Link to="/timetable" className="bento-tile bento-span-2 glass-panel-accent">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-primary/20">📅</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Today's Schedule</span>
              <span className="hub-tile-desc text-white/70">Your classes for today</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '8px' }}>
            <div className="mini-status-list space-y-3">
              <div className="mini-status-item p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <span className="mini-tag violet w-[80px] text-center shadow-[0_0_12px_rgba(124,58,237,0.3)]">10:00 AM</span>
                <span className="text-white font-bold ml-4">Data Structures</span>
                <span className="ml-auto text-xs font-bold text-on-surface-variant/40 tracking-widest uppercase">Room 402</span>
              </div>
              <div className="mini-status-item p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <span className="mini-tag blue w-[80px] text-center shadow-[0_0_12px_rgba(59,130,246,0.3)]">11:30 AM</span>
                <span className="text-white font-bold ml-4">Computer Networks</span>
                <span className="ml-auto text-xs font-bold text-on-surface-variant/40 tracking-widest uppercase">Room 305</span>
              </div>
              <div className="mini-status-item p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <span className="mini-tag teal w-[80px] text-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">02:00 PM</span>
                <span className="text-white font-bold ml-4">OS Lab</span>
                <span className="ml-auto text-xs font-bold text-on-surface-variant/40 tracking-widest uppercase">Lab 3</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Syllabus Tracker */}
        <Link to="/syllabus" className="bento-tile bento-span-2">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-tertiary/20">📊</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Syllabus Tracker</span>
              <span className="hub-tile-desc text-tertiary font-bold">Overall Progress: 65%</span>
            </div>
          </div>
          <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
             <div className="seg-progress" style={{ height: '10px', gap: '6px' }}>
              <div className="seg-block seg-block--filled green h-[10px] shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <div className="seg-block seg-block--filled green h-[10px] shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <div className="seg-block seg-block--filled green h-[10px] shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <div className="seg-block seg-block--filled green h-[10px] shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <div className="seg-block seg-block--filled green h-[10px] shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <div className="seg-block h-[10px] opacity-20"></div>
              <div className="seg-block h-[10px] opacity-20"></div>
              <div className="seg-block h-[10px] opacity-20"></div>
            </div>
            <div className="flex justify-between mt-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">DB Systems: <span className="text-tertiary">80%</span></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">OS: <span className="text-secondary">50%</span></span>
            </div>
          </div>
        </Link>

        {/* Exams */}
        <Link to="/exams" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-error/10">📖</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Exams</span>
              <span className="hub-tile-desc text-error/80 font-bold uppercase tracking-widest text-[10px]">Mid-Terms in 14 Days</span>
            </div>
          </div>
          <div className="hub-tile-preview mt-4">
            <div className="mini-status-list space-y-2">
              <div className="mini-status-item flex items-center gap-3">
                <div className="mini-dot warning shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span className="text-sm font-semibold text-on-surface">Starts Oct 24, 2026</span>
              </div>
              <div className="mini-status-item flex items-center gap-3">
                <div className="mini-dot bg-white/20"></div>
                <span className="text-sm text-on-surface-variant/60">5 subjects scheduled</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Study Resources */}
        <Link to="/notes" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-secondary/10">📄</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Resources</span>
              <span className="hub-tile-desc text-secondary/80 font-bold uppercase tracking-widest text-[10px]">2 New Materials</span>
            </div>
          </div>
          <div className="hub-tile-preview mt-4">
             <div className="mini-status-list space-y-2">
              <div className="mini-status-item flex items-center gap-3">
                <div className="mini-dot active shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-sm font-semibold text-on-surface">OS Chapter 4 (PDF)</span>
              </div>
              <div className="mini-status-item flex items-center gap-3">
                <div className="mini-dot active shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-sm font-semibold text-on-surface">DB Guidelines</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Lecture Logs */}
        <Link to="/lecture-logs" className="bento-tile">
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap bg-info/10">📓</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label text-lg">Lecture Logs</span>
              <span className="hub-tile-desc text-info/80 font-bold uppercase tracking-widest text-[10px]">Session Topics</span>
            </div>
          </div>
          <div className="hub-tile-preview mt-4">
             <div className="mini-status-list space-y-2">
              <div className="mini-status-item flex items-center gap-3">
                <div className="mini-dot active shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-sm font-semibold text-on-surface">Browse Session Data</span>
              </div>
            </div>
          </div>
        </Link>

      </div>
    </ErpLayout>
  )
}
