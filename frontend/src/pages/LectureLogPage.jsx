import { useState, useEffect } from 'react'
import { fetchStudentLectureLogs } from '../services/api'
import ErpLayout from '../components/ErpLayout'
import SkeletonLoader from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import { BookOpen, Calendar, Clock, User, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LectureLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchStudentLectureLogs()
      .then(res => {
        setLogs(res?.logs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const uniqueSubjects = ['all', ...new Set(logs.map(l => l.code))]
  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.code === filter)

  return (
    <ErpLayout title="Lecture Logs" subtitle="Track what's being covered in your classes">
      
      {/* Premium Subject Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {uniqueSubjects.map(subj => (
          <button
            key={subj}
            onClick={() => setFilter(subj)}
            className={`pill-badge cursor-pointer transition-all ${filter === subj ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white/5 text-muted hover:bg-white/10'}`}
            style={{ padding: '8px 20px', border: 'none', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}
          >
            {subj}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader variant="card" count={4} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState 
          title="No logs recorded" 
          description="Your instructors haven't logged any session topics yet." 
          icon={<BookOpen size={48} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card glass-panel group hover:border-primary/30 transition-all duration-300"
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={48} />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-[0.2em]">{log.code}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{log.subject}</h3>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/60">HOUR {log.hour}</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                <p className="text-sm leading-relaxed text-white/80" style={{ minHeight: '60px' }}>
                  {log.topic_covered}
                </p>
                {log.remarks && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 items-start">
                    <Info size={14} className="text-secondary shrink-0 mt-0.5" />
                    <span className="text-xs text-muted italic">{log.remarks}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted">
                  <Calendar size={14} className="text-primary" />
                  <span className="text-xs font-semibold">{log.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <User size={14} className="text-secondary" />
                  <span className="text-xs font-semibold truncate">{log.faculty}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-success">Completed</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {log.methodology}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </ErpLayout>
  )
}
