import { useState, useEffect } from 'react'
import { fetchAttendanceReport, fetchMoodAnalytics } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { BarChart3, Activity, Heart, Users, TrendingUp, Filter, Calendar } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, AreaChart, Area 
} from 'recharts'
import { motion } from 'framer-motion'

const CHART_COLORS = {
  primary: '#7c3aed',
  secondary: '#ec4899',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
}

export default function AdminAnalytics() {
  const [attReport, setAttReport] = useState([])
  const [moodTrends, setMoodTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAttendanceReport().catch(() => ({ report: [] })),
      fetchMoodAnalytics().catch(() => ({ trends: [] })),
    ]).then(([att, mood]) => {
      setAttReport(att?.report || [])
      setMoodTrends(mood?.trends || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <ErpLayout title="Operational Intel" subtitle="Aggregating cross-departmental telemetry...">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SkeletonLoader variant="chart" count={2} />
       </div>
    </ErpLayout>
  )

  return (
    <ErpLayout title="Operational Intel" subtitle="Institution-wide performance and engagement matrix">
      
      {/* ── Top Level KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="glass-panel p-6 rounded-3xl border-primary/10 bg-primary/[0.02]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Avg Attendance</span>
               <Activity size={16} className="text-primary" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
               {attReport.length ? (attReport.reduce((a, b) => a + b.pct, 0) / attReport.length).toFixed(1) : 0}%
            </div>
            <div className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1">
               <TrendingUp size={10} /> Optimal Threshold
            </div>
         </div>

         <div className="glass-panel p-6 rounded-3xl border-success/10 bg-success/[0.02]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Sentiment Score</span>
               <Heart size={16} className="text-success" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
               {moodTrends.length ? moodTrends[0].avg_score : '0.0'}
            </div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Scale 1.0 - 5.0</div>
         </div>

         <div className="glass-panel p-6 rounded-3xl border-info/10 bg-info/[0.02]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Data Nodes</span>
               <Users size={16} className="text-info" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{attReport.length}</div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Departments</div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Attendance Matrix */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-7 glass-panel p-8 rounded-3xl border-white/5 bg-white/[0.01]"
        >
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <BarChart3 size={20} className="text-primary" />
                   Departmental Attendance
                </h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Relative performance across academic nodes</p>
             </div>
             <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-all">
                <Filter size={16} />
             </button>
          </div>

          <div className="h-[320px] w-full">
            {attReport.length === 0 ? <EmptyState title="No data" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attReport} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="pct" fill="url(#attGradient)" radius={[6, 6, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Sentiment Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-5 glass-panel p-8 rounded-3xl border-white/5 bg-white/[0.01]"
        >
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Heart size={20} className="text-success" />
                   Mood Sentiment
                </h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Cross-sectional wellness audit</p>
             </div>
             <div className="flex gap-2">
                <div className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[8px] font-black uppercase tracking-widest">WEEKLY</div>
             </div>
          </div>

          <div className="h-[320px] w-full">
            {moodTrends.length === 0 ? <EmptyState title="No mood data" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodTrends.slice().reverse()}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} domain={[0, 5]} />
                  <Tooltip 
                    contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="avg_score" stroke={CHART_COLORS.success} strokeWidth={3} fill="url(#moodGradient)" />
                  <Line type="monotone" dataKey="at_risk_count" stroke={CHART_COLORS.error} strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Operational Timeline / Recent Events */}
        <div className="col-span-12 glass-panel p-8 rounded-3xl border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Calendar size={16} className="text-info" />
               Institution Audit Trail
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {attReport.slice(0, 4).map((r, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 group hover:bg-white/10 transition-all">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{r.department}</span>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-white">{r.pct}% Attendance</span>
                       <div className={`w-2 h-2 rounded-full ${r.pct > 75 ? 'bg-success' : 'bg-warning'} shadow-[0_0_10px_currentColor]`}></div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                       <div className="h-full bg-info transition-all duration-1000" style={{ width: `${r.pct}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
        </div>

      </div>
    </ErpLayout>
  )
}
