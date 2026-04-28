import { useState, useEffect } from 'react';
import { fetchFaculty } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { Users, Mail, Phone, BookOpen, Search, Filter, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      const data = await fetchFaculty();
      setFacultyList(data?.faculty || []);
    } catch (err) {
      console.error("Failed to load faculty", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = facultyList.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ErpLayout 
      title="Faculty Directory" 
      subtitle="Connect with Distinguished Academic Leaders & Research Mentors"
    >
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Search & Stats Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
             <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
               <Users size={32} className="text-primary animate-pulse" />
             </div>
             <div>
               <h2 className="text-3xl font-black text-white tracking-tight">Academic Council</h2>
               <div className="flex items-center gap-2 text-on-surface-variant/60 text-sm font-medium mt-1">
                 <span className="text-tertiary font-bold">{facultyList.length}</span>
                 <span>Faculty Members Across 12 Departments</span>
               </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative group flex-grow lg:min-w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, department, or research area..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-on-surface-variant/30 focus:border-primary/50 focus:bg-white/10 outline-none transition-all"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-on-surface-variant/60 hover:bg-white/10 transition-colors">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[420px] glass-panel rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : filteredFaculty.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 glass-panel rounded-[40px] flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <Users size={40} className="text-white/10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Faculty Found</h3>
            <p className="text-on-surface-variant/40 max-w-sm text-sm leading-relaxed">
              We couldn't find any members matching "{search}". Try searching for a specific department or last name.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredFaculty.map((person, index) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group relative flex flex-col glass-panel rounded-[32px] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500"
                >
                  {/* Card Header/Profile */}
                  <div className="p-8 pb-4 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                      {person.image_url ? (
                         <img 
                            src={person.image_url} 
                            alt={person.name} 
                            className="w-28 h-28 rounded-[36px] object-cover border-4 border-white/5 group-hover:border-primary/40 transition-all duration-500 relative z-10" 
                         />
                      ) : (
                         <div className="w-28 h-28 rounded-[36px] bg-white/5 border-2 border-white/10 flex items-center justify-center text-4xl font-black text-primary/40 group-hover:text-primary transition-all duration-500 relative z-10">
                           {person.name.charAt(0)}
                         </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-primary transition-colors">
                        {person.name}
                      </h3>
                      <p className="text-sm font-bold text-primary/80 uppercase tracking-widest mt-1">
                        {person.designation}
                      </p>
                    </div>
                  </div>

                  {/* Department & Meta */}
                  <div className="px-8 py-4">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-on-surface-variant/60">
                      <BookOpen size={14} className="text-secondary" />
                      {person.department}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-8 pt-4 space-y-4 flex-grow">
                    <div className="space-y-3 bg-white/2 rounded-2xl p-6 border border-white/5 group-hover:bg-white/5 transition-colors">
                      <a 
                        href={`mailto:${person.email}`} 
                        className="flex items-center gap-3 text-sm text-on-surface-variant/50 hover:text-white transition-colors truncate"
                      >
                        <div className="p-2 rounded-lg bg-white/5"><Mail size={14} /></div>
                        {person.email || 'faculty@university.edu'}
                      </a>
                      <div className="flex items-center gap-3 text-sm text-on-surface-variant/50">
                        <div className="p-2 rounded-lg bg-white/5"><Phone size={14} /></div>
                        {person.phone || '+1 (555) 000-0000'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                         <MessageSquare size={14} /> Chat
                       </button>
                       <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:bg-white/10 transition-all">
                         Profile <ExternalLink size={12} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ErpLayout>
  );
}

