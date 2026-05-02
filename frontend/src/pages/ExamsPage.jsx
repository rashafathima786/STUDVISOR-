import { useState, useEffect } from 'react';
import { fetchExams } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarRange, 
  Clock, 
  MapPin, 
  AlertCircle, 
  BookOpen,
  ChevronRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await fetchExams();
      setExams(data?.exams || []);
    } catch (err) {
      console.error("Failed to load exams", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateString);
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ErpLayout title="Examination Terminal" subtitle="Synchronized schedule for upcoming evaluations">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <CalendarRange className="text-primary" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Live Schedule
            </h2>
            <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Verification Status: Verified</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-[40px] bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <CheckCircle2 size={32} className="text-emerald-500/50" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">No Active Evaluations</h3>
              <p className="text-on-surface-variant/40 text-sm max-w-xs">The examination terminal is clear. All protocols have been successfully concluded.</p>
            </motion.div>
          ) : (
            <div className="grid gap-8">
              <AnimatePresence mode="popLayout">
                {exams.map((exam, idx) => {
                  const daysUntil = getDaysUntil(exam.date);
                  const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                  const isPast = daysUntil < 0;

                  return (
                    <motion.div
                      key={exam.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`group relative overflow-hidden rounded-[40px] border transition-all ${
                        isPast 
                          ? 'bg-surface-container/20 border-border-color opacity-60' 
                          : isUrgent 
                            ? 'bg-red-500/[0.03] border-red-500/30 shadow-2xl shadow-red-500/10' 
                            : 'glass-panel border-border-color'
                      }`}
                    >
                      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
                        
                        {/* Status Icon */}
                        <div className="relative">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                            isPast ? 'border-on-surface/10' : isUrgent ? 'border-red-500/20' : 'border-primary/20'
                          }`}>
                             <BookOpen size={32} className={isPast ? 'text-on-surface-variant/20' : isUrgent ? 'text-red-400' : 'text-primary'} />
                          </div>
                          {isUrgent && !isPast && (
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute -top-1 -right-1"
                            >
                              <ShieldAlert className="text-red-500" size={24} />
                            </motion.div>
                          )}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
                            <h3 className="text-2xl font-bold text-on-surface tracking-tight">
                              {exam.subject}
                            </h3>
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                               isPast ? 'border-border-color text-on-surface-variant/40' : isUrgent ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-primary/20 text-primary bg-primary/5'
                             }`}>
                               {exam.type} PHASE
                             </span>
                          </div>
                          
                          <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                            <div className="flex items-center gap-3">
                              <CalendarRange size={16} className="text-on-surface-variant/20" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-tighter">Evaluation Date</span>
                                <span className="text-sm font-bold text-on-surface/80">{exam.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock size={16} className="text-on-surface-variant/20" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-tighter">Clock Sync</span>
                                <span className="text-sm font-bold text-on-surface/80">{exam.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPin size={16} className="text-on-surface-variant/20" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-tighter">Sector / Room</span>
                                <span className="text-sm font-bold text-on-surface/80">{exam.room || 'TBA'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Countdown / Status Badge */}
                        <div className="min-w-[160px] flex flex-col items-center justify-center p-6 bg-surface-container/50 rounded-[32px] border border-border-color">
                           {isPast ? (
                             <span className="text-xs font-black text-on-surface-variant/30 uppercase tracking-widest">Completed</span>
                           ) : (
                             <>
                               <span className={`text-3xl font-black ${isUrgent ? 'text-red-400' : 'text-on-surface'}`}>
                                 {daysUntil === 0 ? '0' : daysUntil}
                               </span>
                               <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mt-1">Days Rem</span>
                             </>
                           )}
                        </div>

                      </div>

                      {/* Accent Bar */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${
                        isPast ? 'bg-white/10' : isUrgent ? 'bg-gradient-to-r from-red-500 to-transparent' : 'bg-gradient-to-r from-primary to-transparent'
                      }`} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </ErpLayout>
  );
}
