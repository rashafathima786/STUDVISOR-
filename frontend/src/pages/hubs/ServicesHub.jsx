import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  CreditCard, 
  HelpCircle, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { fetchPlacementDrives, fetchFeeSummary, fetchHelpdeskStats } from '../../services/api'

export default function ServicesHub() {
  const [activeTab, setActiveTab] = useState('overview')
  const [drives, setDrives] = useState([])
  const [feeSummary, setFeeSummary] = useState(null)
  const [helpdeskStats, setHelpdeskStats] = useState({ active_tickets: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadHubData() {
      setLoading(true)
      try {
        const [drivesRes, feesRes, helpRes] = await Promise.all([
          fetchPlacementDrives().catch(() => ({ drives: [] })),
          fetchFeeSummary().catch(() => null),
          fetchHelpdeskStats().catch(() => ({ active_tickets: 0 }))
        ])
        setDrives(drivesRes.drives || [])
        setFeeSummary(feesRes)
        setHelpdeskStats(helpRes)
      } catch (err) {
        console.error("Hub data load error", err)
      } finally {
        setLoading(false)
      }
    }
    loadHubData()
  }, [])

  const tabs = [
    { id: 'overview', label: 'Services HQ', icon: Zap, color: 'text-primary' },
    { id: 'placements', label: 'Placements', icon: Briefcase, color: 'text-secondary' },
    { id: 'financials', label: 'Financials', icon: CreditCard, color: 'text-emerald-400' },
    { id: 'helpdesk', label: 'Helpdesk', icon: HelpCircle, color: 'text-amber-400' }
  ]

  return (
    <ErpLayout title="Service Terminal" subtitle="Strategic management of administrative, financial, and career protocols">
      
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-12 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit backdrop-blur-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : tab.color} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            {/* Quick Metrics */}
            <div className="col-span-12 glass-panel p-8 rounded-[40px] border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
                  <Wallet size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Financial Standing</p>
                  <h3 className="text-2xl font-black text-white tracking-tighter">₹{feeSummary?.total_balance?.toLocaleString() || '0'} Due</h3>
                </div>
              </div>
              <div className="w-px h-12 bg-white/5 hidden md:block" />
              <div className="flex items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                  <Briefcase size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Active Drives</p>
                  <h3 className="text-2xl font-black text-white tracking-tighter">{drives.length} Portfolios</h3>
                </div>
              </div>
              <div className="w-px h-12 bg-white/5 hidden md:block" />
              <div className="flex items-center gap-6">
                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Support Sync</p>
                  <h3 className="text-2xl font-black text-white tracking-tighter">{helpdeskStats.active_tickets} Open Tickets</h3>
                </div>
              </div>
              <button onClick={() => navigate('/helpdesk')} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Quick Action
              </button>
            </div>

            {/* Placement Preview */}
            <div className="md:col-span-6 glass-panel p-8 rounded-[40px] border-white/5 group hover:border-primary/40 transition-colors">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                     <Briefcase size={24} />
                   </div>
                   <h3 className="text-xl font-black text-white tracking-tight">Career Terminal</h3>
                </div>
                <button onClick={() => navigate('/placement')} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {drives.slice(0, 3).map(drive => (
                  <div key={drive.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group-hover:bg-white/[0.08] transition-all">
                    <div>
                      <p className="text-sm font-bold text-white/80">{drive.company}</p>
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{drive.role}</p>
                    </div>
                    <span className="text-emerald-400 font-black text-sm">₹{drive.package_lpa}L</span>
                  </div>
                ))}
                {drives.length === 0 && <p className="text-center py-8 text-white/20 text-xs italic font-bold">No active drives detected</p>}
              </div>
            </div>

            {/* Financials Preview */}
            <div className="md:col-span-6 glass-panel p-8 rounded-[40px] border-white/5 group hover:border-emerald-500/40 transition-colors">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                     <CreditCard size={24} />
                   </div>
                   <h3 className="text-xl font-black text-white tracking-tight">Financial Terminal</h3>
                </div>
                <button onClick={() => navigate('/fees')} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 text-center">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Aggregate Balance</p>
                 <h2 className="text-4xl font-black text-white tracking-tighter mb-6">₹{feeSummary?.total_balance?.toLocaleString() || '0'}</h2>
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                   <div 
                    className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                    style={{ width: `${(feeSummary?.total_paid / (feeSummary?.total_due || 1)) * 100}%` }}
                   />
                 </div>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Portfolio Sync</p>
              </div>
            </div>

            {/* Quick Links Grid */}
            {[
              { label: 'Leave & OD', icon: Clock, path: '/leave', color: 'text-amber-400', desc: 'Absence Protocols' },
              { label: 'Library HQ', icon: ArrowRight, path: '/library', color: 'text-secondary', desc: 'Resource Access' },
              { label: 'Announcements', icon: ShieldCheck, path: '/announcements', color: 'text-primary', desc: 'Global Broadcasts' },
              { label: 'Help Center', icon: HelpCircle, path: '/helpdesk', color: 'text-white', desc: 'Support Streams' }
            ].map((link, i) => (
              <div 
                key={i} 
                onClick={() => navigate(link.path)}
                className="col-span-12 md:col-span-3 glass-panel p-6 rounded-[32px] border-white/5 cursor-pointer hover:scale-105 hover:bg-white/5 transition-all group"
              >
                <div className={`p-3 bg-white/5 rounded-2xl w-fit mb-4 ${link.color} group-hover:scale-110 transition-transform`}>
                  <link.icon size={20} />
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{link.desc}</p>
                <p className="text-white font-bold">{link.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'placements' && (
          <motion.div 
            key="placements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="glass-panel p-12 rounded-[48px] text-center bg-gradient-to-br from-secondary/20 to-transparent border-secondary/20">
              <Briefcase size={80} className="mx-auto mb-8 text-secondary" />
              <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Strategic Career Intelligence</h2>
              <p className="text-white/40 max-w-2xl mx-auto mb-12">Access premium corporate drives, track real-time application streams, and manage your professional academic portfolio.</p>
              <button onClick={() => navigate('/placement')} className="bg-secondary text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Enter Placement Portal
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'financials' && (
          <motion.div 
            key="financials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="glass-panel p-12 rounded-[48px] text-center bg-gradient-to-br from-emerald-500/20 to-transparent border-emerald-500/20">
              <CreditCard size={80} className="mx-auto mb-8 text-emerald-400" />
              <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Financial Command Center</h2>
              <p className="text-white/40 max-w-2xl mx-auto mb-12">Securely manage tuition protocols, verify payment history, and maintain your academic fiscal integrity.</p>
              <button onClick={() => navigate('/fees')} className="bg-emerald-500 text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Open Financial Terminal
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'helpdesk' && (
          <motion.div 
            key="helpdesk"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="glass-panel p-12 rounded-[48px] text-center bg-gradient-to-br from-amber-500/20 to-transparent border-amber-500/20">
              <HelpCircle size={80} className="mx-auto mb-8 text-amber-400" />
              <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Unified Support Terminal</h2>
              <p className="text-white/40 max-w-2xl mx-auto mb-12">Resolve academic inquiries, initiate support tickets, and access the institutional knowledge base instantly.</p>
              <button onClick={() => navigate('/helpdesk')} className="bg-amber-500 text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Access Support HQ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ErpLayout>
  )
}
