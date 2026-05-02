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
              <h2 className="text-2xl font-bold text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Study Resources</h2>
            </div>
            <p className="text-on-surface-variant/60 text-xs font-bold uppercase tracking-[0.3em]">Knowledge Base Online</p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
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
                <div key={i} className="h-48 rounded-3xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
                <BookOpen size={32} className="text-on-surface-variant/30" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Repository Empty</h3>
              <p className="text-on-surface-variant/60 text-sm max-w-xs">Be the first to synchronize study materials with your peers.</p>
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
                    className="group relative bg-surface-container backdrop-blur-xl rounded-[32px] p-6 border border-border-color hover:border-primary/30 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <GraduationCap size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-border-color text-on-surface-variant/60 bg-surface-container-high">
                        {note.subject}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface mb-4 tracking-tight leading-tight group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-8">
                      <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center">
                        <User size={10} className="text-on-surface-variant/40" />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                        {note.uploader_name || 'Anonymous Contributor'}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-border-color">
                      <div className="flex items-center gap-3 bg-surface-container p-1 rounded-xl border border-border-color">
                        <button 
                          onClick={() => handleRate(note.id, true)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 transition-all"
                        >
                          <ThumbsUp size={14} />
                          <span className="text-[10px] font-black">{note.helpful || 0}</span>
                        </button>
                        <div className="w-px h-3 bg-border-color" />
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
                        className="p-3 rounded-xl bg-surface-container hover:bg-primary text-on-surface-variant/50 hover:text-white transition-all group/link"
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
                className="relative w-full max-w-xl glass-panel rounded-[40px] p-10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Upload Resource</h2>
                    <p className="text-on-surface-variant/60 text-sm">Contribute to the collective academic intelligence.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-3 bg-surface-container hover:bg-surface-container-high rounded-2xl text-on-surface-variant/50 hover:text-on-surface transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePostNote} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest ml-1">Topic / Title</label>
                    <input 
                      required 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value.toUpperCase())} 
                      placeholder="e.g. QUANTUM MECHANICS UNIT 1" 
                      className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/30" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest ml-1">Subject Code / Name</label>
                    <input 
                      required 
                      type="text" 
                      value={subject} 
                      onChange={e => setSubject(e.target.value.toUpperCase())} 
                      placeholder="e.g. PHY101" 
                      className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/30" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest ml-1">Secure Link (Drive/Cloud)</label>
                    <input 
                      required 
                      type="url" 
                      value={link} 
                      onChange={e => setLink(e.target.value)} 
                      placeholder="https://drive.google.com/..." 
                      className="w-full bg-surface-container border border-border-color rounded-2xl p-4 text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/30" 
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-surface-container text-on-surface-variant/60 font-bold text-xs uppercase tracking-widest hover:bg-surface-container-high transition-all"
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
