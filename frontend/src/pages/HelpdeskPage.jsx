import React, { useState, useEffect } from 'react';
import ErpLayout from '../components/ErpLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Plus,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { fetchFaqs, fetchComplaints, createComplaint, fetchHelpdeskStats } from '../services/api';

export default function HelpdeskPage() {
  const [faqs, setFaqs] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ active_tickets: 0, resolved_tickets: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'General', urgency: 'Medium' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [faqData, complaintData, statsData] = await Promise.all([
        fetchFaqs(),
        fetchComplaints(),
        fetchHelpdeskStats()
      ]);
      setFaqs(faqData.faqs || []);
      setComplaints(complaintData.complaints || []);
      setStats(statsData);
    } catch (err) {
      console.error("Helpdesk data load error", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await createComplaint(newTicket);
      setShowNewTicket(false);
      setNewTicket({ title: '', description: '', category: 'General', urgency: 'Medium' });
      loadData();
    } catch (err) {
      alert("Failed to submit ticket. Please try again.");
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Initializing Support Matrix...</p>
        </div>
    </div>
  );

  return (
    <ErpLayout title="Helpdesk Terminal" subtitle="Unified support interface for academic and administrative inquiries">
      <div className="max-w-7xl mx-auto px-6 py-8 pb-32">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          <div className="glass-panel p-6 md:p-8 rounded-[32px] border border-border-color flex flex-col md:flex-row items-center md:items-start lg:items-center gap-4 md:gap-6">
            <div className="p-3 md:p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0 border border-primary/20">
              <Ticket size={28} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] md:text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-1">Active</p>
              <h3 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter">{stats.active_tickets}</h3>
            </div>
          </div>
          <div className="glass-panel p-6 md:p-8 rounded-[32px] border border-border-color flex flex-col md:flex-row items-center md:items-start lg:items-center gap-4 md:gap-6">
            <div className="p-3 md:p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 flex-shrink-0 border border-emerald-500/20">
              <CheckCircle2 size={28} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] md:text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-1">Resolved</p>
              <h3 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter">{stats.resolved_tickets}</h3>
            </div>
          </div>
          <div className="glass-panel p-6 md:p-8 rounded-[32px] flex flex-col md:flex-row items-center md:items-start lg:items-center gap-4 md:gap-6 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 col-span-2 md:col-span-1">
            <div className="p-3 md:p-4 bg-surface-container rounded-2xl text-on-surface-variant/60 flex-shrink-0 border border-border-color">
              <Clock size={28} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] md:text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-1">Avg Response</p>
              <h3 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter">~4h</h3>
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Bar */}
        <div className="md:hidden floating-action-bar border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => setShowNewTicket(true)}
                className="w-full py-3.5 flex items-center justify-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.2em]"
            >
              <Plus size={18} />
              Open Support Stream
            </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* FAQ Section */}
            <section>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-secondary/10 rounded-xl text-secondary border border-secondary/20">
                    <HelpCircle size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">Intelligence Base (FAQ)</h2>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/20" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search queries..."
                    className="bg-surface-container border border-border-color rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="glass-panel rounded-2xl overflow-hidden border border-border-color shadow-lg">
                    <button 
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full px-6 py-5 flex justify-between items-center hover:bg-surface-container transition-colors"
                    >
                      <span className="font-bold text-on-surface tracking-tight text-left">{faq.question}</span>
                      {expandedFaq === faq.id ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-on-surface-variant/20" />}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === faq.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="px-6 pb-6">
                            <div className="pt-4 text-sm text-on-surface-variant leading-relaxed border-t border-border-color">
                              {faq.answer}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>

            {/* Support Tickets Section */}
            <section>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                    <Ticket size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">Support Streams</h2>
                </div>
                <button 
                  onClick={() => setShowNewTicket(true)}
                  className="hidden md:flex bg-primary text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 items-center gap-2"
                >
                  <Plus size={16} /> New Ticket
                </button>
              </div>

               <div className="glass-panel rounded-[32px] overflow-hidden border border-border-color shadow-xl">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container/50">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Ticket Details</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Urgency</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Protocol ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {complaints.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-8 py-20 text-center text-on-surface-variant/20 text-sm font-bold uppercase tracking-widest italic">
                            No active support streams
                          </td>
                        </tr>
                      ) : (
                        complaints.map((c) => (
                          <tr key={c.id} className="hover:bg-surface-container/30 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-on-surface font-bold group-hover:text-primary transition-colors tracking-tight">{c.title}</span>
                                <span className="text-[10px] text-on-surface-variant/30 uppercase tracking-widest mt-1 font-black">{c.category}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                c.urgency === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                c.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {c.urgency}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex justify-center items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-400' : 'bg-primary animate-pulse'}`} />
                                <span className={`text-[10px] font-bold ${c.status === 'Resolved' ? 'text-emerald-400' : 'text-primary'}`}>
                                  {c.status || 'Active'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right font-mono text-[10px] text-on-surface-variant/30">
                              #STV-{c.id.toString().padStart(4, '0')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                 {/* Mobile View */}
                <div className="md:hidden divide-y divide-border-color">
                  {complaints.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant/20 text-[10px] font-black uppercase tracking-[0.2em] italic">No active support streams</div>
                  ) : (
                    complaints.map((c) => (
                      <div key={c.id} className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <span className="text-on-surface font-bold leading-tight tracking-tight">{c.title}</span>
                            <span className="text-[9px] text-on-surface-variant/30 uppercase font-black tracking-widest">{c.category}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                c.urgency === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                c.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                            {c.urgency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-surface-container/30 p-3 rounded-xl border border-border-color">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-400' : 'bg-primary animate-pulse'}`} />
                            <span className={`text-[10px] font-bold ${c.status === 'Resolved' ? 'text-emerald-400' : 'text-primary'}`}>
                              {c.status || 'Active'}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-on-surface-variant/30 uppercase tracking-tighter">#STV-{c.id.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Content - Right Side */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Contact Directory */}
            <div className="glass-panel p-8 rounded-[40px] border border-border-color relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
              <h3 className="text-xl font-black text-on-surface mb-8 tracking-tight">Emergency Contacts</h3>
              <div className="space-y-6">
                {[
                  { label: 'Admin Office', icon: Phone, value: '+91 800-456-7890', color: 'text-primary' },
                  { label: 'Technical Support', icon: Mail, value: 'support@studvisor.edu', color: 'text-secondary' },
                  { label: 'Medical Wing', icon: Phone, value: '+91 800-111-2222', color: 'text-red-400' },
                  { label: 'Security HQ', icon: MessageSquare, value: 'Intercom: 101', color: 'text-amber-400' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`p-2.5 bg-surface-container rounded-xl ${item.color} border border-border-color shadow-inner`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-bold text-on-surface tracking-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="glass-panel p-8 rounded-[40px] bg-gradient-to-br from-primary to-secondary border-none relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                <HelpCircle size={120} className="text-surface" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight relative z-10">Need Instant Help?</h3>
              <p className="text-xs text-white/70 mb-6 leading-relaxed relative z-10">Our AI Intelligence Core can solve 90% of academic queries instantly.</p>
              <button className="w-full py-4 rounded-2xl bg-white text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl relative z-10">
                Activate Nexus AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewTicket(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-panel w-full max-w-lg rounded-[40px] p-10 border border-border-color shadow-2xl"
            >
              <h2 className="text-2xl font-black text-on-surface mb-2 tracking-tight">Initiate Support Stream</h2>
              <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest mb-8 font-black">Protocol: Encrypted Support Request</p>
              
              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-2 block">Issue Title</label>
                  <input 
                    required
                    className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                    placeholder="Brief summary of the issue..."
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  />
                </div>
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-2 block">Category</label>
                    <select 
                      className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary/50 transition-colors appearance-none shadow-inner"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    >
                      <option className="bg-surface">General</option>
                      <option className="bg-surface">Academic</option>
                      <option className="bg-surface">Financial</option>
                      <option className="bg-surface">Technical</option>
                      <option className="bg-surface">Facility</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-2 block">Urgency</label>
                    <select 
                      className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary/50 transition-colors appearance-none shadow-inner"
                      value={newTicket.urgency}
                      onChange={(e) => setNewTicket({...newTicket, urgency: e.target.value})}
                    >
                      <option className="bg-surface">Low</option>
                      <option className="bg-surface">Medium</option>
                      <option className="bg-surface">High</option>
                      <option className="bg-surface">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest mb-2 block">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary/50 transition-colors resize-none shadow-inner"
                    placeholder="Please provide all relevant details..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 py-4 rounded-2xl border border-border-color text-on-surface-variant/40 font-black text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 py-4 px-8 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    Transmit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ErpLayout>
  );
}
