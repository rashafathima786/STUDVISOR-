import { useState, useEffect } from 'react';
import { fetchEvents, rsvpEvent } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { CalendarDays, MapPin, Users, CheckCircle, ChevronRight, Filter, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data?.events || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      await rsvpEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert("Failed to RSVP. Please try again later.");
    }
  };

  const getCategoryStyles = (category) => {
    switch(category?.toLowerCase()) {
      case 'workshop': return "bg-primary/10 text-primary border-primary/20";
      case 'seminar': return "bg-secondary/10 text-secondary border-secondary/20";
      case 'sports': return "bg-tertiary/10 text-tertiary border-tertiary/20";
      case 'cultural': return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-surface-container text-on-surface-variant/60 border-border-color";
    }
  };

  return (
    <ErpLayout 
      title="Campus Events" 
      subtitle="Discover, Participate & Connect with Upcoming Campus Activities"
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
               <CalendarDays size={24} className="text-primary" />
             </div>
             <h2 className="text-2xl font-bold text-on-surface tracking-tight">Upcoming Schedule</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container border border-border-color text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <Filter size={14} /> Filter
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">
              <Plus size={16} /> Suggest Event
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 glass-panel rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 glass-panel rounded-[40px] flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center mb-6 border border-border-color">
              <CalendarDays size={40} className="text-on-surface-variant/10" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">No Events Found</h3>
            <p className="text-on-surface-variant/40 max-w-sm text-sm">
              The campus calendar is quiet at the moment. Keep an eye out for future workshops and seminars.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {events.map((evt, index) => {
                const isRsvped = evt.user_rsvped;
                const eventDate = new Date(evt.date).toLocaleDateString(undefined, { 
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
                const catStyles = getCategoryStyles(evt.category);

                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -6 }}
                    className="group flex flex-col glass-panel rounded-3xl overflow-hidden border border-border-color hover:border-primary/30 transition-all duration-300"
                  >
                    {/* Event Banner */}
                    <div className="relative h-44 overflow-hidden">
                      {evt.image_url ? (
                        <img 
                          src={evt.image_url} 
                          alt={evt.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <CalendarDays size={48} className="text-on-surface-variant/10" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${catStyles}`}>
                          {evt.category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
                          {evt.title}
                        </h3>
                        <p className="text-sm text-on-surface-variant/50 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 py-4 border-y border-border-color">
                        <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant/60">
                          <CalendarDays size={14} className="text-primary/60" /> 
                          <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant/60">
                          <MapPin size={14} className="text-primary/60" /> 
                          <span className="truncate">{evt.location || 'Campus Auditorium'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant/60">
                          <Users size={14} className="text-primary/60" /> 
                          <span>{evt.rsvp_count || 0} Attending</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button 
                          onClick={() => !isRsvped && handleRsvp(evt.id)}
                          disabled={isRsvped}
                          className={`
                            w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300
                            ${isRsvped 
                              ? 'bg-tertiary/10 text-tertiary border border-tertiary/20 cursor-default' 
                              : 'bg-primary text-surface hover:shadow-lg hover:shadow-primary/20 active:scale-95 cursor-pointer'}
                          `}
                        >
                          {isRsvped ? (
                            <><CheckCircle size={14} /> RSVP Confirmed</>
                          ) : (
                            <><ChevronRight size={14} /> RSVP Now</>
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
