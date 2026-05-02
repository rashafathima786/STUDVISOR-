import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE_URL } from '../services/api'
import { 
  BookOpen, 
  Search, 
  BookMarked, 
  Clock, 
  AlertTriangle, 
  Library, 
  CheckCircle2, 
  XCircle,
  Hash,
  User,
  MapPin,
  ArrowRight,
  Zap
} from 'lucide-react'



export default function LibraryPage() {
  const [tab, setTab] = useState('catalog')
  const [books, setBooks] = useState([])
  const [myBooks, setMyBooks] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('erp_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/library/catalog`, { headers }).then(r => r.json()).catch(() => ({ books: [] })),
      fetch(`${API_BASE_URL}/library/my-books`, { headers }).then(r => r.json()).catch(() => ({ issued_books: [] })),
    ]).then(([catalogRes, myRes]) => {
      setBooks(catalogRes.books || [])
      setMyBooks(myRes.issued_books || [])
      setLoading(false)
    })
  }, [])

  const searchBooks = () => {
    fetch(`${API_BASE_URL}/library/catalog?q=${encodeURIComponent(query)}`, { headers })
      .then(r => r.json()).then(res => setBooks(res.books || []))
  }

  const issueBook = async (bookId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/library/issue/${bookId}`, { method: 'POST', headers })
      const data = await res.json()
      alert(data.message || data.detail)
    } catch (err) {
      alert("Protocol Error: Transaction failed.")
    }
  }

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Accessing Repository...</p>
        </div>
    </div>
  )

  return (
    <ErpLayout title="Resource Repository" subtitle="Centralized access to academic literature and technical documentation">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Library className="text-primary" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Knowledge Core</h2>
              <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Status: Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-surface-container rounded-2xl border border-border-color shadow-2xl">
            {['catalog', 'my-books'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t 
                    ? 'bg-primary text-surface shadow-lg' 
                    : 'text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t === 'catalog' ? 'Global Catalog' : 'Personal Stack'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {tab === 'catalog' ? (
            <motion.div 
              key="catalog"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Search Interface */}
              <div className="glass-panel rounded-[32px] p-4 flex flex-col md:flex-row gap-4 border border-border-color shadow-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/20" size={20} />
                  <input 
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchBooks()}
                    placeholder="Search by title, author, or ISBN identifier..."
                    className="w-full bg-surface-container border border-border-color rounded-2xl py-4 pl-14 pr-6 text-sm text-on-surface font-medium outline-none focus:border-primary/40 focus:bg-surface-container-high transition-all placeholder:text-on-surface-variant/10"
                  />
                </div>
                <button 
                  onClick={searchBooks}
                  className="px-10 py-4 md:py-0 rounded-2xl bg-primary text-surface font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Query Hub
                </button>
              </div>

              {/* Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((b, idx) => (
                  <motion.div 
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative glass-panel rounded-[32px] p-6 border border-border-color hover:border-primary/30 transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div className="p-3 bg-surface-container rounded-2xl text-on-surface-variant/40 group-hover:text-primary transition-colors">
                         <BookOpen size={24} />
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                         b.available_copies > 0 
                           ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' 
                           : 'border-red-500/20 text-red-400 bg-red-500/5'
                       }`}>
                         {b.available_copies > 0 ? `${b.available_copies} available` : 'DEPLETED'}
                       </span>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface mb-2 tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{b.title}</h3>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <User size={12} className="text-on-surface-variant/20" />
                      <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{b.author}</span>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-border-color">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/20">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} />
                          <span>{b.shelf_location || 'Archive Sector'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash size={12} />
                          <span>ID-{b.id.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                    </div>

                    {b.available_copies > 0 && (
                      <button 
                        onClick={() => issueBook(b.id)}
                        className="mt-6 w-full py-4 rounded-2xl bg-surface-container hover:bg-primary text-on-surface hover:text-surface font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-lg"
                      >
                        Initiate Borrowing
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </motion.div>
                ))}
                {books.length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-20 italic">No resources found in the global index.</div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="my-books"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl">
                   <BookMarked className="text-emerald-400" size={24} />
                 </div>
                 <h2 className="text-xl font-bold text-on-surface tracking-tight">Active Allocations</h2>
              </div>

              <div className="glass-panel rounded-[40px] overflow-hidden border border-border-color shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-container/50">
                        <th className="px-10 py-6 text-left text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Resource Title</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Allocation Date</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Deadline</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Status</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Penalty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {myBooks.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-10 py-32 text-center">
                            <p className="text-on-surface-variant/20 text-sm font-bold uppercase tracking-widest italic">Personal stack is currently empty</p>
                          </td>
                        </tr>
                      ) : (
                        myBooks.map((b, idx) => (
                          <motion.tr 
                            key={b.issue_id || idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="hover:bg-surface-container-high transition-colors group"
                          >
                             <td className="px-10 py-8">
                                <div className="flex flex-col">
                                  <span className="text-on-surface font-bold group-hover:text-primary transition-colors tracking-tight">{b.title}</span>
                                  <span className="text-[10px] text-on-surface-variant/20 font-bold uppercase tracking-tighter mt-1 italic">Verified Original</span>
                                </div>
                             </td>
                             <td className="px-6 py-8 text-center">
                                <span className="text-xs font-bold text-on-surface-variant/60">{b.issue_date}</span>
                             </td>
                             <td className="px-6 py-8 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Clock size={12} className="text-on-surface-variant/20" />
                                  <span className="text-xs font-black text-on-surface tracking-tighter">{b.due_date}</span>
                                </div>
                             </td>
                            <td className="px-6 py-8">
                              <div className="flex justify-center">
                                <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                  b.status === 'Overdue' 
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {b.status === 'Overdue' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                                  {b.status}
                                </span>
                              </div>
                            </td>
                             <td className="px-10 py-8 text-right">
                                <span className={`text-lg font-black tracking-tighter ${b.fine > 0 ? 'text-red-400' : 'text-on-surface-variant/20'}`}>
                                  ₹{b.fine}
                                </span>
                             </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

               {/* Action Note */}
               <div className="flex items-center gap-4 px-8 py-6 bg-surface-container rounded-[32px] border border-border-color">
                  <Zap className="text-primary/60" size={20} />
                  <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.3em]">Ensure all returns are synchronized before the deadline to avoid penalty accumulation.</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ErpLayout>
  )
}
