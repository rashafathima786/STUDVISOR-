import { useEffect, useMemo, useState } from 'react'
import ErpLayout from '../components/ErpLayout'
import { fetchMarks, API_BASE_URL } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Trophy, 
  Target, 
  AlertTriangle, 
  FileText,
  ChevronRight,
  ExternalLink,
  Award,
  BarChart3
} from 'lucide-react'

export default function ResultsPage() {
  const [marks, setMarks] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMarks() {
      try {
        const res = await fetchMarks()
        setMarks(Array.isArray(res) ? res : (res?.marks || []))
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to load results.')
      } finally {
        setLoading(false)
      }
    }
    loadMarks()
  }, [])

  const processedMarks = useMemo(() => {
    return marks.map((item) => ({
      ...item,
      percentage: Number(item.max_marks) ? (Number(item.marks_obtained || item.obtained) / Number(item.max_marks)) * 100 : 0,
    }))
  }, [marks])

  const summary = useMemo(() => {
    if (!processedMarks.length) {
      return { average: '0', best: '-', weakest: '-' }
    }
    const sorted = [...processedMarks].sort((a, b) => b.percentage - a.percentage)
    const total = processedMarks.reduce((sum, item) => sum + item.percentage, 0)
    return {
      average: (total / processedMarks.length).toFixed(1),
      best: sorted[0]?.subject_name || sorted[0]?.subject || '-',
      weakest: sorted[sorted.length - 1]?.subject_name || sorted[sorted.length - 1]?.subject || '-',
    }
  }, [processedMarks])

  const getScoreColor = (pct) => {
    if (pct >= 80) return 'text-emerald-400'
    if (pct >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <ErpLayout title="Performance Terminal" subtitle="High-fidelity academic evaluation and analytics">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl">
               <BarChart3 className="text-primary" size={32} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Analytics Core</h2>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Status: Marks Published</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.open(`${API_BASE_URL}/reports/marksheet`, '_blank')}
              className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-3 text-xs font-bold uppercase tracking-widest shadow-xl"
            >
              <FileText size={18} />
              Marksheet
            </button>
            <button 
              onClick={() => window.open(`${API_BASE_URL}/reports/bonafide`, '_blank')}
              className="px-8 py-3.5 rounded-2xl bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-xs font-bold uppercase tracking-widest shadow-2xl"
            >
              <Award size={18} />
              Certificate
            </button>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Aggregate Average', value: `${summary.average}%`, icon: Target, subtitle: 'Across all assessments', color: 'primary' },
            { title: 'Peak Performance', value: summary.best, icon: Trophy, subtitle: 'Highest relative score', color: 'emerald-400' },
            { title: 'Critical Focus', value: summary.weakest, icon: AlertTriangle, subtitle: 'Lowest relative score', color: 'red-400' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="p-5 bg-white/5 rounded-3xl">
                <stat.icon className={i === 0 ? 'text-primary' : i === 1 ? 'text-emerald-400' : 'text-red-400'} size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                <h3 className="text-xl font-bold text-white tracking-tight truncate max-w-[180px]">{stat.value}</h3>
                <p className="text-[10px] text-white/20 font-medium">{stat.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Marks Table */}
        <div className="bg-[#0d0d10]/40 backdrop-blur-2xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 md:p-10 flex justify-between items-center border-b border-white/5">
            <h3 className="text-xl font-bold text-white tracking-tight">Academic Record</h3>
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Semester {processedMarks[0]?.semester || '--'} Baseline</span>
            </div>
          </div>

          <div className="flex flex-col">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Code</th>
                    <th className="px-6 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Assessment</th>
                    <th className="px-6 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Score</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedMarks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-10 py-20 text-center text-white/20 font-bold uppercase tracking-widest italic">
                        No data synchronized with core system
                      </td>
                    </tr>
                  ) : (
                    processedMarks.map((item, idx) => (
                      <motion.tr 
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="text-white font-bold group-hover:text-primary transition-colors">{item.subject_name || item.subject}</span>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-1 italic">Confirmed</span>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <span className="text-xs font-black text-white/40 tracking-tighter">{item.subject_code}</span>
                        </td>
                        <td className="px-6 py-8 text-center">
                          <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest">
                            {item.assessment_type}
                          </span>
                        </td>
                        <td className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-bold text-white">{item.marks_obtained || item.obtained}</span>
                            <span className="text-xs text-white/20 font-medium">/ {item.max_marks}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex flex-col items-end">
                             <span className={`text-lg font-black tracking-tighter ${getScoreColor(item.percentage)}`}>
                               {item.percentage.toFixed(1)}%
                             </span>
                             <div className="w-24 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${item.percentage}%` }}
                                 className={`h-full ${item.percentage >= 80 ? 'bg-emerald-400' : item.percentage >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                               />
                             </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="md:hidden p-4 space-y-4">
              {processedMarks.length === 0 ? (
                <div className="px-6 py-12 text-center text-white/20 font-bold uppercase tracking-widest italic text-xs">
                  No data synchronized
                </div>
              ) : (
                processedMarks.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-panel p-6 rounded-3xl border border-white/5"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{item.subject_code}</span>
                        <h4 className="text-md font-bold text-white mt-1 leading-tight">{item.subject_name || item.subject}</h4>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-white/5 rounded-md border border-white/5 text-[8px] font-black text-white/40 uppercase tracking-widest">
                          {item.assessment_type}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-black ${getScoreColor(item.percentage)}`}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center mb-4">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Obtained Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">{item.marks_obtained || item.obtained}</span>
                        <span className="text-xs text-white/20">/ {item.max_marks}</span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        className={`h-full ${item.percentage >= 80 ? 'bg-emerald-400' : item.percentage >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </ErpLayout>
  )
}
