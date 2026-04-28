import { useState, useEffect } from 'react';
import { fetchSyllabus, toggleSyllabusTopic } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { BookMarked, CheckCircle2, Circle, TrendingUp, BookOpen, ChevronRight, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyllabusPage() {
  const [syllabusData, setSyllabusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyllabus();
  }, []);

  const loadSyllabus = async () => {
    try {
      const data = await fetchSyllabus();
      setSyllabusData(data?.syllabus || []);
    } catch (err) {
      console.error("Failed to load syllabus", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (topicId) => {
    try {
      setSyllabusData(prev => prev.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic => 
          topic.id === topicId ? { ...topic, completed: !topic.completed } : topic
        )
      })));
      
      await toggleSyllabusTopic(topicId);
    } catch (err) {
      await loadSyllabus();
      alert("Failed to update topic status.");
    }
  };

  const overallProgress = syllabusData.length === 0 ? 0 : Math.round(
    syllabusData.reduce((acc, sub) => acc + (sub.topics.filter(t => t.completed).length / sub.topics.length), 0) / syllabusData.length * 100
  );

  return (
    <ErpLayout 
      title="Syllabus Tracker" 
      subtitle="Optimize Your Academic Journey: Monitor Real-time Course Progress"
    >
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        
        {/* Global Progress Section */}
        <div className="glass-panel rounded-[40px] p-8 sm:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={120} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <TrendingUp size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Curriculum Mastery</h2>
              </div>
              <p className="text-on-surface-variant/50 max-w-md text-sm leading-relaxed">
                You have successfully completed <span className="text-white font-bold">{overallProgress}%</span> of your total course objectives for the current semester.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2">
               <div className="text-5xl font-black text-white tracking-tighter">
                 {overallProgress}<span className="text-2xl text-primary">%</span>
               </div>
               <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Overall Completion</div>
            </div>
          </div>
          
          <div className="mt-10 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-gradient-to-r from-primary to-secondary relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
        </div>

        {/* Subject Grid */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <BookOpen size={24} className="text-secondary" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Subjects</h2>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 glass-panel rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : syllabusData.length === 0 ? (
            <div className="py-20 glass-panel rounded-3xl flex flex-col items-center justify-center text-center">
              <BookMarked size={48} className="text-white/10 mb-4" />
              <h3 className="text-xl font-bold text-white">No Syllabus Data</h3>
              <p className="text-on-surface-variant/40 max-w-xs mt-2 text-sm">Curriculum details for your current courses haven't been uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence>
                {syllabusData.map((subject, index) => {
                  const completedCount = subject.topics.filter(t => t.completed).length;
                  const totalCount = subject.topics.length;
                  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

                  return (
                    <motion.div
                      key={subject.subject_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel rounded-[32px] overflow-hidden border border-white/5 group hover:border-white/10 transition-all duration-500"
                    >
                      <div className="p-8 sm:p-10 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl border transition-colors ${progress === 100 ? 'bg-tertiary/10 border-tertiary/20 text-tertiary' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                              <BookMarked size={28} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-primary transition-colors">
                                {subject.subject_name}
                              </h3>
                              <p className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1">
                                {totalCount} Total Learning Objectives
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-3xl font-black tracking-tighter ${progress === 100 ? 'text-tertiary' : 'text-white'}`}>
                               {progress}%
                             </div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30">Subject Progress</div>
                          </div>
                        </div>

                        {/* Segmented Progress Bar */}
                        <div className="flex gap-1.5 h-2">
                           {subject.topics.map((topic, i) => (
                             <div 
                               key={topic.id} 
                               className={`flex-grow rounded-full transition-all duration-500 ${topic.completed ? (progress === 100 ? 'bg-tertiary shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-primary') : 'bg-white/5'}`}
                             />
                           ))}
                        </div>

                        {/* Topic Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                          {subject.topics.map((topic) => (
                            <motion.div 
                              key={topic.id} 
                              whileHover={{ x: 4 }}
                              onClick={() => handleToggle(topic.id)}
                              className={`
                                flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300
                                ${topic.completed 
                                  ? 'bg-white/5 border-white/5 opacity-60' 
                                  : 'bg-white/2 border-white/10 hover:border-primary/40 hover:bg-white/5'}
                              `}
                            >
                              <div className={`transition-colors ${topic.completed ? 'text-tertiary' : 'text-on-surface-variant/20'}`}>
                                {topic.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                              </div>
                              <span className={`text-sm font-medium transition-all ${topic.completed ? 'text-on-surface-variant/40 line-through' : 'text-white'}`}>
                                {topic.name}
                              </span>
                              {!topic.completed && (
                                <ChevronRight size={14} className="ml-auto text-on-surface-variant/10 group-hover:text-primary transition-colors" />
                              )}
                            </motion.div>
                          ))}
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

