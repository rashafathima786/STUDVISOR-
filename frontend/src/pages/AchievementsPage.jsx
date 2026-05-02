import { useState, useEffect } from 'react';
import { fetchAchievements } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { Award, Star, Zap, BookOpen, Trophy, Target, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await fetchAchievements();
      setAchievements(data?.achievements || []);
    } catch (err) {
      console.error("Failed to load achievements", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStyles = (category) => {
    switch(category?.toLowerCase()) {
      case 'sports': return {
        icon: <Zap size={24} className="text-secondary" />,
        accent: "border-secondary/30 bg-secondary/5",
        badge: "bg-secondary/10 text-secondary"
      };
      case 'academic': return {
        icon: <BookOpen size={24} className="text-primary" />,
        accent: "border-primary/30 bg-primary/5",
        badge: "bg-primary/10 text-primary"
      };
      case 'cultural': return {
        icon: <Sparkles size={24} className="text-tertiary" />,
        accent: "border-tertiary/30 bg-tertiary/5",
        badge: "bg-tertiary/10 text-tertiary"
      };
      default: return {
        icon: <Star size={24} className="text-on-surface-variant/40" />,
        accent: "border-border-color bg-surface-container",
        badge: "bg-surface-container-high text-on-surface-variant/60"
      };
    }
  };

  const stats = [
    { label: "Total Recognitions", value: "128", icon: <Trophy size={20} />, color: "text-primary" },
    { label: "Categories", value: "8 Active", icon: <Target size={20} />, color: "text-secondary" },
    { label: "Recent Wins", value: "+12 This Month", icon: <Sparkles size={20} />, color: "text-tertiary" },
  ];

  return (
    <ErpLayout 
      title="Achievements" 
      subtitle="Celebrating Campus Excellence & Distinguished Milestones"
    >
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        
        {/* Recognition Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel rounded-3xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-500">
                {stat.icon}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl bg-surface-container border border-border-color ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant/40">
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-black text-on-surface tracking-tight">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Award size={22} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">Hall of Fame</h2>
            </div>
            <div className="flex gap-2">
               <button className="px-4 py-2 rounded-xl bg-surface-container border border-border-color text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:bg-surface-container-high transition-colors">
                 Filter By Category
               </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 glass-panel rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 glass-panel rounded-[40px] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl" />
              
              <div className="w-24 h-24 rounded-3xl bg-surface-container border border-border-color flex items-center justify-center mb-8 relative">
                <Award size={48} className="text-on-surface-variant/10" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-primary/20">
                   <Sparkles size={16} className="text-surface" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-on-surface tracking-tight mb-3">Awaiting Excellence</h3>
              <p className="text-on-surface-variant/40 max-w-sm text-sm leading-relaxed mb-10">
                The Hall of Fame is currently preparing to spotlight new milestones. Stay tuned as we celebrate the next wave of campus distinction.
              </p>
              
              <button className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-surface-container border border-border-color hover:border-primary/40 transition-all duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 group-hover:text-on-surface transition-colors">Nominate for Achievement</span>
                <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {achievements.map((item, index) => {
                  const styles = getCategoryStyles(item.category);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -8 }}
                      className={`
                        group relative flex flex-col glass-panel rounded-3xl overflow-hidden
                        border-b-4 transition-all duration-300 ${styles.accent}
                      `}
                    >
                      <div className="p-8 space-y-6 flex-grow">
                        <div className="flex items-center justify-between">
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${styles.badge}`}>
                            {item.category}
                          </div>
                          <div className="text-on-surface-variant/20 group-hover:text-primary/40 transition-colors">
                            {styles.icon}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-on-surface-variant/50 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-surface-container border-t border-border-color">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                            {item.winner_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-on-surface">{item.winner_name}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30">
                              Awarded {new Date(item.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
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

