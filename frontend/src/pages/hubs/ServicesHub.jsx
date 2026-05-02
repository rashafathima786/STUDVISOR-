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
      
      {/* Navigation Tabs (App-Style Segmented Control) */}
      <div className="sticky top-0 z-40 bg-surface/60 backdrop-blur-3xl -mx-4 px-4 py-4 md:static md:bg-transparent md:backdrop-blur-none md:p-0 md:mb-12">
        <div className="flex gap-1 p-1 bg-surface-container rounded-2xl border border-border-color w-full overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 flex-1 min-w-[120px] ${
                activeTab === tab.id 
                  ? 'bg-on-surface text-surface shadow-xl scale-[1.02]' 
                  : 'text-on-surface-variant/30 hover:text-on-surface-variant/60'
              }`}
            >
              <tab.icon size={14} className={activeTab === tab.id ? 'text-surface' : tab.color} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col lg:grid lg:grid-cols-12 gap-8"
          >
            {/* Quick Metrics */}
            <div className="col-span-12 glass-panel p-8 rounded-[40px] border border-border-color flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto min-w-0">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 flex-shrink-0">
                  <Wallet size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest truncate">Financial Standing</p>
                  <h3 className="font-black text-on-surface tracking-tighter" style={{ fontSize: 'clamp(1.1rem, 1rem + 1vw, 1.75rem)' }}>₹{feeSummary?.total_balance?.toLocaleString() || '0'} Due</h3>
                </div>
              </div>
              <div className="w-px h-12 bg-border-color hidden md:block" />
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto min-w-0">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                  <Briefcase size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest truncate">Active Drives</p>
                  <h3 className="font-black text-on-surface tracking-tighter" style={{ fontSize: 'clamp(1.1rem, 1rem + 1vw, 1.75rem)' }}>{drives.length} Portfolios</h3>
                </div>
              </div>
              <div className="w-px h-12 bg-border-color hidden md:block" />
              <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto min-w-0">
                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400 flex-shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest truncate mb-1">Support Sync</p>
                  <h3 className="font-black text-on-surface tracking-tighter" style={{ fontSize: 'clamp(1.25rem, 1.15rem + 1vw, 1.85rem)' }}>{helpdeskStats.active_tickets} Open Tickets</h3>
                </div>
              </div>
              <button onClick={() => navigate('/helpdesk')} className="bg-on-surface text-surface px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Quick Action
              </button>
            </div>

            {/* Placement Preview */}
            <div className="lg:col-span-6 glass-panel bg-surface p-8 rounded-[40px] border border-border-color group hover:border-primary/40 transition-colors">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden min-w-0">
                   <div className="p-3 bg-secondary/10 rounded-2xl text-secondary flex-shrink-0">
                     <Briefcase size={24} />
                   </div>
                    <h3 className="text-lg md:text-xl font-black text-on-surface tracking-tight truncate flex-1 md:flex-none whitespace-normal md:whitespace-nowrap">Career Terminal</h3>
                </div>
                <button onClick={() => navigate('/placement')} className="p-2 bg-surface-container rounded-xl text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-high transition-all flex-shrink-0">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {drives.slice(0, 3).map(drive => (
                  <div key={drive.id} className="p-4 bg-surface-container rounded-2xl border border-border-color flex justify-between items-center group-hover:bg-surface-container-high transition-all">
                    <div>
                      <p className="text-sm font-bold text-on-surface-variant">{drive.company}</p>
                      <p className="text-[10px] text-on-surface-variant/20 font-black uppercase tracking-widest">{drive.role}</p>
                    </div>
                    <span className="text-emerald-400 font-black text-sm">₹{drive.package_lpa}L</span>
                  </div>
                ))}
                {drives.length === 0 && <p className="text-center py-8 text-on-surface-variant/20 text-xs italic font-bold">No active drives detected</p>}
              </div>
            </div>

            {/* Financials Preview */}
            <div className="lg:col-span-6 glass-panel bg-surface p-8 rounded-[40px] border border-border-color group hover:border-emerald-500/40 transition-colors">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden min-w-0">
                   <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 flex-shrink-0">
                     <CreditCard size={24} />
                   </div>
                    <h3 className="text-lg md:text-xl font-black text-on-surface tracking-tight truncate flex-1 md:flex-none whitespace-normal md:whitespace-nowrap">Financial Terminal</h3>
                </div>
                <button onClick={() => navigate('/fees')} className="p-2 bg-surface-container rounded-xl text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-high transition-all flex-shrink-0">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="p-8 bg-surface-container rounded-[32px] border border-border-color text-center">
                 <p className="text-[10px] font-black text-on-surface-variant/20 uppercase tracking-widest mb-2">Aggregate Balance</p>
                 <h2 className="text-3xl font-black text-on-surface tracking-tighter mb-6">₹{feeSummary?.total_balance?.toLocaleString() || '0'}</h2>
                 <div className="h-2 bg-on-surface/5 rounded-full overflow-hidden mb-4">
                   <div 
                    className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                    style={{ width: `${(feeSummary?.total_paid / (feeSummary?.total_due || 1)) * 100}%` }}
                   />
                 </div>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Portfolio Sync</p>
              </div>
            </div>

            {/* Quick Links Grid */}
            <div className="col-span-12 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
            {[
              { label: 'Leave & OD', icon: Clock, path: '/leave', color: 'text-amber-400', desc: 'Absence Protocols' },
              { label: 'Library HQ', icon: ArrowRight, path: '/library', color: 'text-secondary', desc: 'Resource Access' },
              { label: 'Announcements', icon: ShieldCheck, path: '/announcements', color: 'text-primary', desc: 'Global Broadcasts' },
              { label: 'Help Center', icon: HelpCircle, path: '/helpdesk', color: 'text-on-surface', desc: 'Support Streams' }
            ].map((link, i) => (
              <div 
                key={i} 
                onClick={() => navigate(link.path)}
                className="glass-panel p-6 rounded-[32px] border border-border-color cursor-pointer hover:scale-105 hover:bg-surface-container transition-all group"
              >
                <div className={`p-3 bg-surface-container rounded-2xl w-fit mb-4 ${link.color} group-hover:scale-110 transition-transform`}>
                  <link.icon size={20} />
                </div>
                <p className="text-[10px] font-black text-on-surface-variant/20 uppercase tracking-widest mb-1">{link.desc}</p>
                <p className="text-on-surface font-bold">{link.label}</p>
              </div>
            ))}
            </div>
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
            <div className="glass-panel p-12 rounded-[48px] text-center bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/20">
              <Briefcase size={80} className="mx-auto mb-8 text-secondary" />
              <h2 className="font-black text-on-surface tracking-tighter mb-4" style={{ fontSize: 'clamp(2rem, 1.5rem + 3vw, 3.5rem)' }}>Strategic Career Intelligence</h2>
              <p className="text-on-surface-variant/40 max-w-2xl mx-auto mb-12">Access premium corporate drives, track real-time application streams, and manage your professional academic portfolio.</p>
              <button onClick={() => navigate('/placement')} className="bg-secondary text-surface px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
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
            <div className="glass-panel p-12 rounded-[48px] text-center bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20">
              <CreditCard size={80} className="mx-auto mb-8 text-emerald-400" />
              <h2 className="text-4xl font-black text-on-surface tracking-tighter mb-4">Financial Command Center</h2>
              <p className="text-on-surface-variant/40 max-w-2xl mx-auto mb-12">Securely manage tuition protocols, verify payment history, and maintain your academic fiscal integrity.</p>
              <button onClick={() => navigate('/fees')} className="bg-emerald-500 text-surface px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
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
            <div className="glass-panel p-12 rounded-[48px] text-center bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/20">
              <HelpCircle size={80} className="mx-auto mb-8 text-amber-400" />
              <h2 className="text-4xl font-black text-on-surface tracking-tighter mb-4">Unified Support Terminal</h2>
              <p className="text-on-surface-variant/40 max-w-2xl mx-auto mb-12">Resolve academic inquiries, initiate support tickets, and access the institutional knowledge base instantly.</p>
              <button onClick={() => navigate('/helpdesk')} className="bg-amber-500 text-surface px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Access Support HQ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-32 md:hidden" /> {/* Mobile bottom spacer */}
    </ErpLayout>
  )
}
