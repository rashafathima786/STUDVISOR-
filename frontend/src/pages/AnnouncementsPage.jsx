import { useState, useEffect } from 'react';
import { fetchAnnouncements } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { 
  Megaphone, 
  AlertCircle, 
  Info, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Building2,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data?.announcements || []);
    } catch (err) {
      console.error("Failed to load announcements", err);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'All Notices', icon: BellRing },
    { id: 'all_scope', label: 'General', icon: Info },
    { id: 'department', label: 'Departmental', icon: Building2 },
    { id: 'urgent', label: 'Important', icon: AlertCircle },
  ];

  const filteredAnnouncements = announcements.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'all_scope') return item.scope === 'all';
    if (activeFilter === 'department') return item.scope !== 'all';
    // Urgency heuristic: check if title or content contains "urgent", "important", "alert"
    if (activeFilter === 'urgent') {
      const text = `${item.title} ${item.content}`.toLowerCase();
      return text.includes('urgent') || text.includes('important') || text.includes('alert') || text.includes('mandatory');
    }
    return true;
  });

  const getIconForScope = (scope) => {
    if (scope === 'all') return <BellRing className="text-primary" size={20} />;
    return <Building2 className="text-secondary" size={20} />;
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <ErpLayout 
      title="Announcements" 
      subtitle="Official notices and institutional updates"
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 p-1 glass-panel rounded-2xl overflow-x-auto scrollbar-hide max-w-full">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300
                  ${activeFilter === filter.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-on-surface/50 hover:text-white hover:bg-white/5'}
                `}
              >
                <filter.icon size={14} />
                {filter.label}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-4 py-2 border border-primary/20 rounded-full bg-primary/5">
            Real-time Feed Active
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 glass-panel rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 glass-panel rounded-3xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Megaphone size={32} className="text-on-surface/20" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Clear Skies</h3>
              <p className="text-sm text-on-surface/50 max-w-xs mx-auto">
                No recent announcements found for the selected filter. Check back later for updates.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredAnnouncements.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden glass-panel rounded-2xl hover:border-primary/40 transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors" />
                  
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                    {/* Date/Scope Sidebar */}
                    <div className="flex sm:flex-col items-start sm:items-center justify-between sm:justify-start gap-4 min-w-[100px]">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        {getIconForScope(item.scope)}
                      </div>
                      <div className="flex flex-col sm:items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-on-surface/40 mb-1">
                          Posted
                        </span>
                        <span className="text-xs font-bold text-white">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <div className={`
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                          ${item.scope === 'all' 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-secondary/10 text-secondary border border-secondary/20'}
                        `}>
                          {item.scope === 'all' ? 'Institutional' : item.scope}
                        </div>
                      </div>

                      <p className="text-on-surface/70 text-sm leading-relaxed mb-6">
                        {item.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-on-surface/40">
                          <Clock size={14} />
                          <span>Expires in 7 days</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface/40">
                          <Building2 size={14} />
                          <span>{item.scope === 'all' ? 'General Administration' : `${item.scope} Department`}</span>
                        </div>
                        
                        <button className="ml-auto flex items-center gap-1 text-xs font-bold text-primary hover:text-white transition-colors">
                          View Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </ErpLayout>
  );
}

