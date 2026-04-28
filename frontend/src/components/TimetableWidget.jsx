import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Clock, 
  Calendar as CalendarIcon,
  Trash2,
  Check,
  Zap,
  MoreVertical
} from 'lucide-react'

// ── Constants & Helpers ──────────────────────────────────────────────
const START_HOUR = 8
const END_HOUR = 18
const ROW_HEIGHT = 80
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const getMonday = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const addWeeks = (date, n) => addDays(date, n * 7)

const monthYear = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const dayLabel = (date) => {
  const wd = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  return { day: wd, date: date.getDate() }
}

const HOUR_LABELS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
  const h = START_HOUR + i
  const ampm = h < 12 ? 'AM' : 'PM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:00 ${ampm}`
})

const CATEGORY_STYLES = {
  Lecture: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30', accent: 'bg-primary' },
  Lab: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', accent: 'bg-emerald-500' },
  Seminar: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', accent: 'bg-amber-500' },
  Workshop: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', accent: 'bg-rose-500' }
}

const DEFAULT_EVENTS = [
  { id: 1, title: 'Data Structures & Algo', type: 'Lecture', dayIndex: 0, startHour: 10, duration: 2, room: 'L-402', faculty: 'Dr. Sarah J.' },
  { id: 2, title: 'Operating Systems Lab', type: 'Lab', dayIndex: 1, startHour: 9, duration: 3, room: 'LAB-2', faculty: 'Prof. Miller' },
  { id: 3, title: 'System Design Sync', type: 'Seminar', dayIndex: 2, startHour: 11.5, duration: 1.5, room: 'CONF-A', faculty: 'Dr. Kevin M.' },
  { id: 4, title: 'AI Workshop', type: 'Workshop', dayIndex: 4, startHour: 14, duration: 2, room: 'AUD-1', faculty: 'James Bond' },
]

// ── Sub-components ───────────────────────────────────────────────────

function EventPill({ ev, onClick }) {
  const style = CATEGORY_STYLES[ev.type] || CATEGORY_STYLES.Lecture
  const topPx = (ev.startHour - START_HOUR) * ROW_HEIGHT
  const heightPx = ev.duration * ROW_HEIGHT

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01, zIndex: 30 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute left-2 right-2 p-4 rounded-[24px] cursor-pointer shadow-xl border-l-4 transition-all ${style.bg} ${style.border} ${style.text} group`}
      style={{ 
        top: topPx + 6, 
        height: heightPx - 12,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="flex flex-col h-full justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-1">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
               {ev.startHour % 1 === 0.5 ? `${Math.floor(ev.startHour)}:30` : `${ev.startHour}:00`}
             </span>
             <Zap size={10} className="opacity-40" />
          </div>
          <h4 className="text-xs font-black leading-tight uppercase tracking-wide truncate">
            {ev.title}
          </h4>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <span className="text-[9px] font-bold opacity-50 truncate">{ev.room}</span>
          <span className="text-[9px] font-bold opacity-50 truncate">{ev.type}</span>
        </div>
      </div>
      
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent} rounded-full`} />
    </motion.div>
  )
}

function EventDialog({ event, onSave, onDelete, onClose }) {
  const isNew = !event?.id
  const [title, setTitle] = useState(event?.title || '')
  const [day, setDay] = useState(event?.dayIndex ?? 0)
  const [start, setStart] = useState(event?.startHour ?? 9)
  const [dur, setDur] = useState(event?.duration ?? 1)
  const [type, setType] = useState(event?.type || 'Lecture')
  const [room, setRoom] = useState(event?.room || '')

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0d0d10] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{isNew ? 'New Entry' : 'Edit Entry'}</h3>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Academic Protocol v4.1</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
              <X size={20} className="text-white/40" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Module Identifier</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                placeholder="e.g. QUANTUM COMPUTING"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Weekday</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 transition-all appearance-none"
                  value={day}
                  onChange={e => setDay(Number(e.target.value))}
                >
                  {DAYS.map((d, i) => <option key={i} value={i} className="bg-[#0d0d10]">{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Category</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 transition-all appearance-none"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  {Object.keys(CATEGORY_STYLES).map(t => <option key={t} value={t} className="bg-[#0d0d10]">{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Start Time</label>
                <input 
                  type="number" step="0.5" min={START_HOUR} max={END_HOUR}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 transition-all"
                  value={start}
                  onChange={e => setStart(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Location</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-primary/50 transition-all"
                  placeholder="e.g. HALL-3"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-12">
            <button 
              onClick={() => onSave({ ...event, title, dayIndex: day, startHour: start, duration: dur, type, room, id: event?.id || Date.now() })}
              className="flex-1 bg-primary text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
            >
              Commit Entry
            </button>
            {!isNew && (
              <button 
                onClick={() => onDelete(event.id)}
                className="w-20 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all"
              >
                <Trash2 size={24} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export default function TimetableWidget() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState(DEFAULT_EVENTS)
  const [dialog, setDialog] = useState(null)
  
  const monday = getMonday(currentDate)
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const handleCellClick = (dayIndex, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const py = e.clientY - rect.top
    const snapped = Math.floor((py / ROW_HEIGHT + START_HOUR) * 2) / 2
    setDialog({ event: { dayIndex, startHour: Math.min(snapped, END_HOUR - 1), duration: 1 } })
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 select-none">
      
      {/* Dynamic Header System */}
      <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Real-time Schedule Sync</span>
           </div>
           <h2 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: 'var(--font-jakarta)' }}>
             {monthYear(monday)}
           </h2>
        </div>

        <div className="flex items-center gap-4 bg-[#121214]/60 backdrop-blur-2xl p-2 rounded-[32px] border border-white/5 shadow-2xl">
          <button 
            onClick={() => setCurrentDate(addWeeks(currentDate, -1))}
            className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-10 py-3 bg-white/5 rounded-2xl flex flex-col items-center">
             <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Navigation</span>
             <span className="text-xs font-black text-white uppercase tracking-widest">Active Week</span>
          </div>
          <button 
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Grid Architecture */}
      <div className="relative bg-[#0a0a0c]/80 backdrop-blur-3xl rounded-[48px] border border-white/10 overflow-hidden shadow-2xl">
        <div className="flex">
          
          {/* Timeline Sidebar */}
          <div className="w-24 pt-20 border-r border-white/5 bg-black/40">
            {HOUR_LABELS.map((label, i) => (
              <div 
                key={i} 
                className="flex items-start justify-center text-[9px] font-black text-white/20 uppercase tracking-tighter"
                style={{ height: ROW_HEIGHT }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Core Grid Matrix */}
          <div className="flex-1 grid grid-cols-7 min-w-[1000px] overflow-x-auto scrollbar-hide">
            {week.map((day, dIdx) => {
              const { day: label, date } = dayLabel(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const dayEvs = events.filter(e => e.dayIndex === dIdx)

              return (
                <div key={dIdx} className={`relative flex flex-col border-r border-white/5 last:border-0 ${isToday ? 'bg-primary/[0.04]' : ''}`}>
                  
                  {/* Vertical Column Header */}
                  <div className="h-20 flex flex-col items-center justify-center border-b border-white/5 relative">
                    <span className={`text-[10px] font-black tracking-[0.3em] uppercase mb-1.5 ${isToday ? 'text-primary' : 'text-white/20'}`}>
                      {label}
                    </span>
                    <span className={`text-lg font-black ${isToday ? 'text-white' : 'text-white/60'}`}>
                      {date}
                    </span>
                    {isToday && <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary shadow-[0_0_15px_rgba(124,58,237,0.5)]" />}
                  </div>

                  {/* Operational Cell Matrix */}
                  <div 
                    className="relative cursor-crosshair group/grid" 
                    style={{ height: (END_HOUR - START_HOUR + 1) * ROW_HEIGHT }}
                    onClick={(e) => handleCellClick(dIdx, e)}
                  >
                    {/* Horizontal Synchronization Lines */}
                    {HOUR_LABELS.map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute left-0 right-0 border-b border-white/[0.03] transition-colors group-hover/grid:border-white/[0.05]" 
                        style={{ top: i * ROW_HEIGHT }} 
                      />
                    ))}

                    {/* Active Event Nodes */}
                    <AnimatePresence>
                      {dayEvs.map(ev => (
                        <EventPill 
                          key={ev.id} 
                          ev={ev} 
                          onClick={() => setDialog({ event: ev })} 
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Primary Action Node */}
      <motion.button 
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setDialog({ event: {} })}
        className="fixed bottom-12 right-12 w-20 h-20 rounded-[32px] bg-primary text-white shadow-[0_20px_50px_rgba(124,58,237,0.3)] flex items-center justify-center z-50 border border-white/20 group"
      >
        <Plus size={32} className="group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Interaction Modal */}
      <AnimatePresence>
        {dialog && (
          <EventDialog 
            event={dialog.event}
            onClose={() => setDialog(null)}
            onSave={(ev) => {
              setEvents(prev => prev.some(e => e.id === ev.id) ? prev.map(e => e.id === ev.id ? ev : e) : [...prev, ev])
              setDialog(null)
            }}
            onDelete={(id) => {
              setEvents(prev => prev.filter(e => e.id !== id))
              setDialog(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}