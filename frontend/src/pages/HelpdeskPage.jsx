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
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Grid */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 mb-12">
          <div className="glass-panel p-8 rounded-[32px] flex items-center gap-6">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Ticket size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Active Tickets</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">{stats.active_tickets}</h3>
            </div>
          </div>
          <div className="glass-panel p-8 rounded-[32px] flex items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Resolved</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">{stats.resolved_tickets}</h3>
            </div>
          </div>
          <div className="glass-panel p-8 rounded-[32px] flex items-center gap-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <div className="p-4 bg-white/5 rounded-2xl text-white">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Avg Response</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">~4h</h3>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* FAQ Section */}
            <section>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                    <HelpCircle size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Intelligence Base (FAQ)</h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search queries..."
                    className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <button 
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full px-6 py-5 flex justify-between items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="font-bold text-white/80 text-left">{faq.question}</span>
                      {expandedFaq === faq.id ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-white/20" />}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === faq.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-6"
                        >
                          <div className="pt-2 text-sm text-white/40 leading-relaxed border-t border-white/5">
                            {faq.answer}
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
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Ticket size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Support Streams</h2>
                </div>
                <button 
                  onClick={() => setShowNewTicket(true)}
                  className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Plus size={16} /> New Ticket
                </button>
              </div>

              <div className="glass-panel rounded-[32px] overflow-hidden border border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Ticket Details</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Urgency</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {complaints.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-8 py-20 text-center text-white/20 text-sm font-bold uppercase tracking-widest italic">
                          No active support streams
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-white font-bold group-hover:text-primary transition-colors">{c.title}</span>
                              <span className="text-[10px] text-white/20 uppercase tracking-tighter mt-1">{c.category}</span>
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
                          <td className="px-8 py-6 text-right font-mono text-[10px] text-white/20">
                            #STV-{c.id.toString().padStart(4, '0')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Content - Right Side */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Contact Directory */}
            <div className="glass-panel p-8 rounded-[40px] border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
              <h3 className="text-xl font-black text-white mb-8 tracking-tight">Emergency Contacts</h3>
              <div className="space-y-6">
                {[
                  { label: 'Admin Office', icon: Phone, value: '+91 800-456-7890', color: 'text-primary' },
                  { label: 'Technical Support', icon: Mail, value: 'support@studvisor.edu', color: 'text-secondary' },
                  { label: 'Medical Wing', icon: Phone, value: '+91 800-111-2222', color: 'text-red-400' },
                  { label: 'Security HQ', icon: MessageSquare, value: 'Intercom: 101', color: 'text-amber-400' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`p-2.5 bg-white/5 rounded-xl ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-bold text-white/80">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div className="glass-panel p-8 rounded-[40px] bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <HelpCircle size={120} />
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">Need Instant Help?</h3>
              <p className="text-xs text-white/60 mb-6 leading-relaxed">Our AI Intelligence Core can solve 90% of academic queries instantly.</p>
              <button className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
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
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-panel-light w-full max-w-lg rounded-[40px] p-10 border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Initiate Support Stream</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-8">Protocol: Encrypted Support Request</p>
              
              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Issue Title</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="Brief summary of the issue..."
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  />
                </div>
                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Category</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    >
                      <option className="bg-[#1a1a20]">General</option>
                      <option className="bg-[#1a1a20]">Academic</option>
                      <option className="bg-[#1a1a20]">Financial</option>
                      <option className="bg-[#1a1a20]">Technical</option>
                      <option className="bg-[#1a1a20]">Facility</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Urgency</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                      value={newTicket.urgency}
                      onChange={(e) => setNewTicket({...newTicket, urgency: e.target.value})}
                    >
                      <option className="bg-[#1a1a20]">Low</option>
                      <option className="bg-[#1a1a20]">Medium</option>
                      <option className="bg-[#1a1a20]">High</option>
                      <option className="bg-[#1a1a20]">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Detailed Description</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    placeholder="Please provide all relevant details..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-white/40 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
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
