import { useState, useEffect } from 'react';
import { fetchPolls, votePoll } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { PieChart, CheckCircle2, Users, Calendar, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const data = await fetchPolls();
      setPolls(data?.polls || []);
    } catch (err) {
      console.error("Failed to load polls", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await votePoll(pollId, optionId);
      await loadPolls();
    } catch (err) {
      alert("Failed to cast vote. You might have already voted.");
    }
  };

  return (
    <ErpLayout 
      title="Campus Polls" 
      subtitle="Shape the Campus Experience: Cast Your Vote on Key Initiatives"
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
              <PieChart size={32} className="text-secondary animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Active Consultations</h2>
              <div className="flex items-center gap-2 text-on-surface-variant/60 text-sm font-medium mt-1">
                <Users size={14} className="text-primary" />
                <span>Your voice directly impacts campus policy and events</span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <BarChart3 size={16} className="text-on-surface-variant/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Live Analytics</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 glass-panel rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 glass-panel rounded-[40px] flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <PieChart size={40} className="text-white/10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Active Polls</h3>
            <p className="text-on-surface-variant/40 max-w-sm text-sm">
              The consensus is clear for now. Check back soon for new campus initiatives and surveys.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence>
              {polls.map((poll, index) => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                const hasVoted = poll.user_voted;

                return (
                  <motion.div
                    key={poll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-panel rounded-[32px] p-8 sm:p-10 border border-white/5 hover:border-white/10 transition-all duration-500"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                      <div className="space-y-3 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">
                            {poll.category || 'General'}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                            <Calendar size={12} /> Ends in 3 days
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tight">
                          {poll.question}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-black text-white">{totalVotes}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30">Total Responses</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {poll.options.map((opt, i) => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                        
                        return (
                          <motion.div 
                            key={opt.id} 
                            whileHover={!hasVoted ? { x: 8 } : {}}
                            onClick={() => !hasVoted && handleVote(poll.id, opt.id)}
                            className={`
                              group relative cursor-pointer select-none
                              ${hasVoted ? 'cursor-default' : 'active:scale-[0.98] transition-transform'}
                            `}
                          >
                            <div className={`
                              relative h-16 rounded-2xl border transition-all duration-300 overflow-hidden flex items-center px-6
                              ${hasVoted 
                                ? 'bg-white/5 border-white/5' 
                                : 'bg-white/2 border-white/10 hover:border-primary/40 group-hover:bg-white/5'}
                            `}>
                              {/* Background Progress Fill */}
                              {hasVoted && (
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, ease: "circOut" }}
                                  className="absolute left-0 top-0 h-full bg-primary/10 border-r border-primary/20"
                                />
                              )}

                              <div className="flex items-center justify-between w-full relative z-10">
                                <div className="flex items-center gap-4">
                                   {!hasVoted && (
                                     <div className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-primary/60 transition-colors" />
                                   )}
                                   {hasVoted && (
                                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${percentage === Math.max(...poll.options.map(o => (o.votes / totalVotes) * 100)) ? 'bg-primary text-white' : 'bg-white/10 text-white/40'}`}>
                                       <CheckCircle2 size={12} />
                                     </div>
                                   )}
                                   <span className={`font-bold transition-colors ${hasVoted ? 'text-white' : 'text-on-surface-variant/80 group-hover:text-white'}`}>
                                     {opt.text}
                                   </span>
                                </div>
                                
                                {hasVoted && (
                                  <div className="flex flex-col items-end">
                                    <span className="text-xl font-black text-white">{percentage}%</span>
                                    <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">{opt.votes} Votes</span>
                                  </div>
                                )}
                                
                                {!hasVoted && (
                                  <ChevronRight size={18} className="text-on-surface-variant/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex items-center justify-between px-2">
                       <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant/40">
                         <TrendingUp size={14} className="text-tertiary" />
                         <span>Consensus is trending towards "{poll.options.sort((a,b) => b.votes - a.votes)[0].text}"</span>
                       </div>
                       {hasVoted && (
                         <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                           Vote Recorded Successfully
                         </div>
                       )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ErpLayout>
  );
}

