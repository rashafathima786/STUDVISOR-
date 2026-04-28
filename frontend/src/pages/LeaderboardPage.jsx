import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { Trophy, Medal, Star, TrendingUp, Award, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await fetchLeaderboard('merit');
      setLeaderboard(data?.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyles = (index) => {
    switch(index) {
      case 0: return {
        icon: <Crown size={28} className="text-[#FFD700]" />,
        glow: "shadow-[0_0_30px_rgba(255,215,0,0.15)]",
        border: "border-[#FFD700]/30",
        bg: "bg-gradient-to-br from-[#FFD700]/10 to-transparent",
        label: "Gold"
      };
      case 1: return {
        icon: <Medal size={28} className="text-[#C0C0C0]" />,
        glow: "shadow-[0_0_30px_rgba(192,192,192,0.1)]",
        border: "border-[#C0C0C0]/30",
        bg: "bg-gradient-to-br from-[#C0C0C0]/10 to-transparent",
        label: "Silver"
      };
      case 2: return {
        icon: <Award size={28} className="text-[#CD7F32]" />,
        glow: "shadow-[0_0_30px_rgba(205,127,50,0.1)]",
        border: "border-[#CD7F32]/30",
        bg: "bg-gradient-to-br from-[#CD7F32]/10 to-transparent",
        label: "Bronze"
      };
      default: return {
        icon: <span className="text-lg font-black text-on-surface-variant/40">{index + 1}</span>,
        glow: "",
        border: "border-white/5",
        bg: "bg-white/2",
        label: null
      };
    }
  };

  return (
    <ErpLayout 
      title="Leaderboard" 
      subtitle="Excellence Recognition & Academic Standing"
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Trophy size={32} className="text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Campus Rankings</h2>
              <div className="flex items-center gap-2 text-on-surface-variant/60 text-sm font-medium">
                <TrendingUp size={14} className="text-tertiary" />
                <span>Updated in real-time based on cumulative performance</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest">
               Batch 2024-28
             </div>
             <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest">
               Merit List
             </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 glass-panel rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-20 glass-panel rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-white/20">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">No Rankings Yet</h3>
              <p className="text-on-surface-variant/50 max-w-xs mt-2">Data is being aggregated. Check back shortly for the latest standings.</p>
            </div>
          ) : (
            <AnimatePresence>
              {leaderboard.map((student, index) => {
                const styles = getRankStyles(index);
                const isTop3 = index < 3;

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                    className={`
                      group relative overflow-hidden glass-panel rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-8
                      transition-all duration-300 border ${styles.border} ${styles.glow} ${styles.bg}
                      ${isTop3 ? 'py-8' : ''}
                    `}
                  >
                    {/* Rank Number / Icon */}
                    <div className="w-12 sm:w-16 flex justify-center flex-shrink-0 relative">
                      {styles.icon}
                      {isTop3 && (
                        <div className="absolute -top-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                          {styles.label}
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {student.avatar_url ? (
                        <img 
                          src={student.avatar_url} 
                          alt={student.name} 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/10 group-hover:border-primary/40 transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-primary/40 group-hover:text-primary transition-colors">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      {index === 0 && (
                         <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center shadow-lg shadow-black/40">
                            <Star size={12} fill="black" stroke="black" />
                         </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors truncate">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-on-surface-variant/50 text-xs sm:text-sm font-medium">
                        <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{student.department}</span>
                        <span className="hidden sm:inline opacity-30">•</span>
                        <span>Year {student.year}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl sm:text-3xl font-black tracking-tighter ${isTop3 ? 'text-white' : 'text-primary'}`}>
                        {student.score}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                        Points
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </ErpLayout>
  );
}

