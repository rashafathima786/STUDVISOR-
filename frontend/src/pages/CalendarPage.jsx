import { useEffect, useState } from 'react'
import ErpLayout from '../components/ErpLayout'
import { fetchCalendarMonth, fetchUpcomingHolidays } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CalendarDays, 
  Coffee, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ChevronRight,
  Zap,
  Calendar as CalendarIcon,
  MapPin,
  TrendingUp,
  History
} from 'lucide-react'

export default function CalendarPage() {
  const [calendarDays, setCalendarDays] = useState([])
  const [holidays, setHolidays] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCalendar() {
      try {
        const [monthData, holidayData] = await Promise.all([
          fetchCalendarMonth(2026, 4),
          fetchUpcomingHolidays(),
        ])
        setCalendarDays(Array.isArray(monthData) ? monthData : (monthData?.calendar || []))
        setHolidays(Array.isArray(holidayData) ? holidayData : (holidayData?.holidays || []))
      } catch (err) {
        setError('Temporal synchronization failure. Check system clock.')
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()
  }, [])

  const workingDays = calendarDays.filter((day) => day.is_working_day).length
  const totalHours = calendarDays.reduce((sum, day) => sum + Number(day.working_hours || 0), 0)

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Synchronizing Temporal Matrix...</p>
        </div>
    </div>
  )

  return (
    <ErpLayout title="Temporal Grid" subtitle="Operational academic scheduling and holiday synchronization">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Working Nodes', value: workingDays, icon: Zap, color: 'text-primary', subtitle: 'April 2026' },
            { label: 'Holiday Cycles', value: calendarDays.length - workingDays, icon: Coffee, color: 'text-amber-400', subtitle: 'Rest periods' },
            { label: 'Operational Hours', value: totalHours, icon: Clock, color: 'text-emerald-400', subtitle: 'Total capacity' },
            { label: 'Next Event', value: holidays[0]?.holiday_name || '-', icon: Sparkles, color: 'text-secondary', subtitle: holidays[0]?.date || 'None scheduled' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 flex flex-col justify-between min-h-[200px] group hover:border-white/10 transition-colors"
            >
              <div className="flex justify-between items-start">
                 <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                   <stat.icon className={stat.color} size={24} />
                 </div>
                 <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                   <span className="text-[8px] font-black text-white/30 tracking-widest uppercase">Verified</span>
                 </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-white tracking-tighter truncate">{stat.value}</h3>
                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">{stat.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid & Secondary List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Calendar Matrix - Column 8 */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-primary/10 rounded-2xl">
                   <CalendarDays className="text-primary" size={24} />
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight uppercase">April 2026</h2>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                 <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Working</span>
                 <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/10" /> Holiday</span>
              </div>
            </div>

            <div className="glass-panel rounded-[48px] p-8 border border-white/5 shadow-2xl overflow-hidden">
               <div className="grid grid-cols-7 gap-4">
                 {/* Weekday Labels */}
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(wd => (
                   <div key={wd} className="text-center py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{wd}</div>
                 ))}
                 
                 {/* Calendar Tiles */}
                 {calendarDays.map((day, idx) => (
                   <motion.div 
                     key={day.date}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.02 }}
                     className={`aspect-square rounded-3xl border flex flex-col items-center justify-center relative group transition-all cursor-default ${
                       day.is_working_day 
                         ? 'bg-white/5 border-white/5 hover:bg-primary/20 hover:border-primary/40' 
                         : 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10'
                     }`}
                   >
                     <span className={`text-lg font-black tracking-tighter ${day.is_working_day ? 'text-white' : 'text-red-400'}`}>
                       {day.date.slice(-2)}
                     </span>
                     <span className="text-[8px] font-black uppercase tracking-tighter opacity-20 mt-1">
                       {day.is_working_day ? `${day.working_hours}H` : 'REST'}
                     </span>
                     
                     {/* Tooltip-like Info */}
                     {!day.is_working_day && day.holiday_name && (
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 rounded-3xl p-2 text-center pointer-events-none">
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter leading-tight">{day.holiday_name}</span>
                       </div>
                     )}
                   </motion.div>
                 ))}
               </div>
            </div>
          </div>

          {/* Upcoming Protocol List - Column 4 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3 px-4">
               <div className="p-3 bg-secondary/10 rounded-2xl">
                 <History className="text-secondary" size={24} />
               </div>
               <h2 className="text-xl font-bold text-white tracking-tight uppercase">Upcoming Protocol</h2>
            </div>

            <div className="space-y-4">
              {holidays.map((h, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="glass-panel rounded-[32px] p-6 border border-white/5 flex items-center justify-between hover:border-secondary/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-secondary">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{h.holiday_name}</h4>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{h.date}</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 text-white/20 group-hover:text-secondary transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </motion.div>
              ))}
              {holidays.length === 0 && (
                <div className="py-12 glass-panel rounded-3xl text-center opacity-20 italic">No upcoming holidays synchronized.</div>
              )}
            </div>

            {/* Note Section */}
            <div className="mt-8 glass-panel rounded-[32px] p-6 border border-white/5 bg-primary/5">
               <div className="flex items-center gap-3 mb-3">
                 <AlertCircle className="text-primary" size={18} />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Administrative Note</span>
               </div>
               <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                 All temporal nodes are subject to localized revision. Synchronize your terminal daily for real-time schedule updates.
               </p>
            </div>
          </div>

        </div>
      </div>
    </ErpLayout>
  )
}
