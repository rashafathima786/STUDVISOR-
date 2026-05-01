import { useState, useEffect } from 'react';
import { fetchAssignments, submitAssignment } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { BookOpen, CheckCircle, Clock, Send, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await fetchAssignments();
      setAssignments(data?.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (submittingId) return;
    setSubmittingId(assignmentId);
    try {
      await submitAssignment(assignmentId);
      await loadAssignments(); // Reload to show updated status
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit assignment.";
      alert(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <ErpLayout title="Assignments" subtitle="Track your pending tasks and academic submissions">
      <div className="space-y-8 max-w-5xl mx-auto">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <BookOpen size={24} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Deliverables</h2>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-4 py-2 border border-primary/20 rounded-full bg-primary/5">
            {assignments.length} Total Tasks
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 glass-panel rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 glass-panel rounded-3xl text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-tertiary/20" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Backlog</h3>
            <p className="text-sm text-on-surface-variant/50 max-w-xs mx-auto">
              All assignments are current. You're fully caught up with your curriculum.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {assignments.map((assignment, index) => {
                const isSubmitted = assignment.status === "Submitted";
                const isOverdue = new Date(assignment.due_date) < new Date() && !isSubmitted;

                return (
                  <motion.div 
                    key={assignment.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative overflow-hidden glass-panel rounded-2xl transition-all duration-300 hover:border-primary/40 ${isSubmitted ? 'opacity-70' : ''}`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${isSubmitted ? 'bg-tertiary/30' : isOverdue ? 'bg-error/60' : 'bg-primary/40'}`} />
                    
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isSubmitted ? 'bg-tertiary/10 border-tertiary/20' : 'bg-white/5 border-white/10 group-hover:border-primary/30'}`}>
                          <FileText size={28} className={isSubmitted ? 'text-tertiary' : 'text-on-surface-variant'} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-xl font-bold tracking-tight transition-colors ${isSubmitted ? 'text-white/40 line-through' : 'text-white group-hover:text-primary'}`}>
                              {assignment.title}
                            </h3>
                            {isOverdue && <span className="px-2 py-0.5 rounded-md bg-error/10 text-error text-[10px] font-black uppercase tracking-tighter border border-error/20">Critical</span>}
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant/60">
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {assignment.subject}</span>
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-error' : ''}`}>
                              <Clock size={12} /> Due: {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          isSubmitted ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 
                          isOverdue ? 'bg-error/10 text-error border-error/20' : 
                          'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {isSubmitted ? 'Verified' : isOverdue ? 'Overdue' : 'Pending Submission'}
                        </span>

                        <button 
                          onClick={() => !isSubmitted && !submittingId && handleSubmit(assignment.id)}
                          disabled={isSubmitted || (submittingId === assignment.id)}
                          className={`
                            flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300
                            ${isSubmitted 
                              ? 'bg-transparent text-tertiary cursor-default' 
                              : submittingId === assignment.id
                                ? 'bg-primary/50 text-white/50 cursor-not-allowed'
                                : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20 active:scale-95 cursor-pointer'}
                          `}
                        >
                          {isSubmitted ? (
                            <><CheckCircle size={18} /> Complete</>
                          ) : submittingId === assignment.id ? (
                            <><Clock size={18} className="animate-spin" /> Submitting...</>
                          ) : (
                            <><Send size={18} /> Submit Now</>
                          )}
                        </button>
                      </div>
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
