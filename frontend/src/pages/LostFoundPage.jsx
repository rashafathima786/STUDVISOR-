import { useState, useEffect } from 'react';
import { fetchLostFound, createLostFoundItem } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Plus, 
  Package, 
  ArrowRight,
  Info,
  X,
  PlusCircle,
  Filter,
  CheckCircle
} from 'lucide-react';

export default function LostFoundPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('lost');
  const [location, setLocation] = useState('');
  const [contactedId, setContactedId] = useState(null);

  useEffect(() => {
    loadItems();
  }, [filter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchLostFound(filter === 'all' ? null : filter);
      setItems(data?.items || []);
    } catch (err) {
      console.error("Failed to load lost & found", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostItem = async (e) => {
    e.preventDefault();
    if (!title || !description || !location) return;

    try {
      await createLostFoundItem({
        title,
        description,
        item_type: itemType,
        location,
        date: new Date().toISOString().split('T')[0]
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setLocation('');
      await loadItems();
    } catch (err) {
      console.error("Failed to post item.", err);
    }
  };

  const handleContact = (itemId) => {
    setContactedId(itemId);
    // Auto-reset after animation
    setTimeout(() => setContactedId(null), 3000);
  };

  return (
    <ErpLayout title="Lost & Found" subtitle="Community-driven item recovery portal">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
            {['all', 'lost', 'found'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Plus size={18} />
            Report Entry
          </button>
        </div>

        {/* Content Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Search size={32} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Entries Found</h3>
              <p className="text-white/40 text-sm max-w-xs">There are no {filter !== 'all' ? filter : ''} items reported in this sector.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-surface-container/40 backdrop-blur-xl rounded-[32px] p-6 border border-white/5 hover:border-primary/30 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${item.item_type === 'lost' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <Package size={20} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        item.item_type === 'lost' 
                          ? 'border-red-500/20 text-red-400 bg-red-500/5' 
                          : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                      }`}>
                        {item.item_type}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-3 tracking-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-white/50 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                      {item.description}
                    </p>
                    
                    <div className="space-y-3 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3 text-white/40 text-[11px] font-bold uppercase tracking-wider">
                        <MapPin size={14} className="text-primary/60" />
                        {item.location}
                      </div>
                      <div className="flex items-center gap-3 text-white/40 text-[11px] font-bold uppercase tracking-wider">
                        <CalendarIcon size={14} className="text-primary/60" />
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleContact(item.id)}
                      className={`mt-6 w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${
                        contactedId === item.id 
                          ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-white/5 hover:bg-primary text-white'
                      }`}
                    >
                      {contactedId === item.id ? (
                        <>
                          Request Sent
                          <CheckCircle size={14} />
                        </>
                      ) : (
                        <>
                          Contact Authority
                          <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Modal Portal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl bg-surface-container rounded-[40px] p-10 border border-white/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Report Entry</h2>
                    <p className="text-white/40 text-sm">Synchronizing item details with the central node.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePostItem} className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {['lost', 'found'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setItemType(t)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                          itemType === t 
                            ? 'bg-white text-black' 
                            : 'text-white/30 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Object Identifier</label>
                    <input 
                      required 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="e.g. BLUE SONIC EARBUDS" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/10" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Object Description</label>
                    <textarea 
                      required 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      placeholder="Provide high-fidelity details..." 
                      rows="3" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/10 resize-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Last Known Coordinates</label>
                    <input 
                      required 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)} 
                      placeholder="e.g. SECTOR-4 CAFE" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/10" 
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                      Submit Entry
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ErpLayout>
  );
}
