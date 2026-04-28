import { useState, useEffect } from 'react';
import { fetchNotes, createNote, rateNote } from '../services/api';
import ErpLayout from '../components/ErpLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  Plus, 
  FileText,
  Search,
  X,
  User,
  GraduationCap
} from 'lucide-react';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await fetchNotes();
      setNotes(data?.notes || []);
    } catch (err) {
      console.error("Failed to load notes", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostNote = async (e) => {
    e.preventDefault();
    if (!title || !subject || !link) return;

    try {
      await createNote({ title, subject, file_url: link });
      setShowModal(false);
      setTitle('');
      setSubject('');
      setLink('');
      await loadNotes();
    } catch (err) {
      console.error("Failed to upload note.", err);
    }
  };

  const handleRate = async (noteId, isHelpful) => {
    try {
      await rateNote(noteId, isHelpful);
      await loadNotes();
    } catch (err) {
      console.error("Failed to rate note.", err);
    }
  };

  return (
    <ErpLayout title="Nexus Repository" subtitle="Collaborate and share high-fidelity study materials">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-primary" size={24} />
              <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Study Resources</h2>
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">Knowledge Base Online</p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Plus size={18} />
            Upload Resource
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <BookOpen size={32} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Repository Empty</h3>
              <p className="text-white/40 text-sm max-w-xs">Be the first to synchronize study materials with your peers.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-surface-container/40 backdrop-blur-xl rounded-[32px] p-6 border border-white/5 hover:border-primary/30 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <GraduationCap size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 text-white/60 bg-white/5">
                        {note.subject}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4 tracking-tight leading-tight group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-8">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                        <User size={10} className="text-white/40" />
                      </div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {note.uploader_name || 'Anonymous Contributor'}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
                        <button 
                          onClick={() => handleRate(note.id, true)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 transition-all"
                        >
                          <ThumbsUp size={14} />
                          <span className="text-[10px] font-black">{note.helpful || 0}</span>
                        </button>
                        <div className="w-px h-3 bg-white/10" />
                        <button 
                          onClick={() => handleRate(note.id, false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
                        >
                          <ThumbsDown size={14} />
                          <span className="text-[10px] font-black">{note.not_helpful || 0}</span>
                        </button>
                      </div>
                      
                      <a 
                        href={note.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => {
                          if (!note.file_url) {
                            e.preventDefault();
                            alert("Resource link is unavailable.");
                          }
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-primary text-white/40 hover:text-white transition-all group/link"
                      >
                        <ExternalLink size={18} className="group-hover/link:scale-110 transition-transform" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Upload Modal Portal */}
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
                    <h2 className="text-2xl font-bold text-white mb-2">Upload Resource</h2>
                    <p className="text-white/40 text-sm">Contribute to the collective academic intelligence.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePostNote} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Topic / Title</label>
                    <input 
                      required 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value.toUpperCase())} 
                      placeholder="e.g. QUANTUM MECHANICS UNIT 1" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/10" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Subject Code / Name</label>
                    <input 
                      required 
                      type="text" 
                      value={subject} 
                      onChange={e => setSubject(e.target.value.toUpperCase())} 
                      placeholder="e.g. PHY101" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/10" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Secure Link (Drive/Cloud)</label>
                    <input 
                      required 
                      type="url" 
                      value={link} 
                      onChange={e => setLink(e.target.value)} 
                      placeholder="https://drive.google.com/..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/10" 
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                      Sync Material
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
