import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, 
  Zap, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Globe, 
  Search, 
  Maximize, 
  Minimize,
  RefreshCw,
  Layers,
  Database,
  CloudLightning,
  ChevronRight,
  Info
} from 'lucide-react'

export default function ModelRegistryPage() {
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const models = [
    { name: "Gemini 2.5 Flash", category: "Text-out", rpm: 5, tpm: "250K", rpd: 20, status: "Active", latency: "240ms" },
    { name: "Gemini 2.5 Pro", category: "Text-out", rpm: 0, tpm: "0", rpd: 0, status: "Standby", latency: "---" },
    { name: "Gemini 2 Flash", category: "Text-out", rpm: 0, tpm: "0", rpd: 0, status: "Standby", latency: "---" },
    { name: "Gemini 3 Flash", category: "Text-out", rpm: 5, tpm: "250K", rpd: 20, status: "Active", latency: "180ms" },
    { name: "Gemini 3.1 Flash Lite", category: "Text-out", rpm: 15, tpm: "250K", rpd: 500, status: "Active", latency: "110ms" },
    { name: "Gemini 2.5 Flash TTS", category: "Multi-modal", rpm: 3, tpm: "10K", rpd: 10, status: "Active", latency: "450ms" },
    { name: "Gemma 3 12B", category: "Other", rpm: 30, tpm: "15K", rpd: "14.4K", status: "Operational", latency: "85ms" },
    { name: "Gemma 4 31B", category: "Other", rpm: 15, tpm: "Unlimited", rpd: "1.5K", status: "Operational", latency: "130ms" },
    { name: "Imagen 4 Generate", category: "Multi-modal", rpm: 0, tpm: "0", rpd: 25, status: "Active", latency: "2.4s" },
    { name: "Deep Research Pro", category: "Agents", rpm: 0, tpm: "0", rpd: 0, status: "Testing", latency: "---" },
    { name: "Gemini 2.5 Flash Native Audio", category: "Live API", rpm: "Unl", tpm: "1M", rpd: "Unl", status: "Live", latency: "15ms" },
    { name: "Gemini 3 Flash Live", category: "Live API", rpm: "Unl", tpm: "65K", rpd: "Unl", status: "Live", latency: "12ms" },
    { name: "Search Grounding (Gemini 2.5)", category: "Grounding", rpm: 0, tpm: "0", rpd: "1.5K", status: "Active", latency: "800ms" }
  ]

  const categories = ["All", "Text-out", "Multi-modal", "Live API", "Grounding", "Other"]

  useEffect(() => {
    setTimeout(() => setLoading(false), 1200)
  }, [])

  const filteredModels = models.filter(m => 
    (filter === "All" || m.category === filter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()))
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <ErpLayout title="Nexus AI Core" subtitle="Institutional Model Fleet & Infrastructure Control">
      <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">
        
        {/* Fleet Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Active Nodes", val: "8 / 13", icon: <Zap className="text-emerald-400" />, trend: "Optimal" },
            { label: "Total Capacity", val: "1.4M TPM", icon: <Activity className="text-indigo-400" />, trend: "+12% Load" },
            { label: "Avg Latency", val: "142ms", icon: <CloudLightning className="text-amber-400" />, trend: "-5ms (Fast)" },
            { label: "Security Protocol", val: "v4.2 Pro", icon: <ShieldCheck className="text-blue-400" />, trend: "Verified" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                {stat.icon}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  {stat.icon}
                </div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-white tracking-tighter">{stat.val}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest ${stat.trend.includes('+') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stat.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fleet Controller Interface */}
        <div className="bg-[#0d0d0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Layers size={24} className="text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Model Inventory</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Institutional Intelligence Fleet</p>
                </div>
             </div>

             <div className="flex items-center gap-4 bg-[#161619] p-1.5 rounded-xl border border-white/5">
                {categories.map(c => (
                  <button 
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                      ${filter === c ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                  >
                    {c}
                  </button>
                ))}
             </div>

             <div className="relative group flex-1 md:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search fleet nodes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#161619] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder-white/10 focus:outline-none focus:border-indigo-500/30 transition-all"
                />
             </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-6 opacity-20">
                <RefreshCw size={48} className="animate-spin text-indigo-400" />
                <p className="text-sm font-black uppercase tracking-[0.5em]">Synchronizing Intelligence Fleet...</p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredModels.map((model, idx) => (
                  <motion.div 
                    key={idx}
                    variants={itemVariants}
                    className="group bg-[#161619]/40 border border-white/5 rounded-2xl p-6 hover:bg-[#161619] hover:border-white/10 transition-all cursor-default relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-2 h-2 rounded-full ${model.status === 'Active' || model.status === 'Live' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-white/10'}`} />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{model.name}</span>
                      </div>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{model.category}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-8">
                      {[
                        { label: "RPM", val: model.rpm, max: 100 },
                        { label: "TPM", val: model.tpm, max: "1M" },
                        { label: "RPD", val: model.rpd, max: "20K" }
                      ].map((m, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{m.label}</span>
                          <span className="text-xs font-black text-white tracking-tighter">{m.val}</span>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: model.status === 'Active' || model.status === 'Live' ? '45%' : '0%' }}
                              className="h-full bg-indigo-500" 
                             />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-white/40 uppercase tracking-widest">
                            {model.latency}
                          </div>
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{model.status}</span>
                       </div>
                       <button className="text-white/10 group-hover:text-white transition-colors">
                         <ChevronRight size={14} />
                       </button>
                    </div>

                    {/* Background Detail */}
                    <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                       <Database size={100} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          <div className="p-8 bg-[#09090b] border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                   <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Global Sync: Active</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500/40" />
                   <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Encryption: RSA-4096</span>
                </div>
             </div>
             <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
               Authorized Fleet Command Only • Nexus Intelligence V4
             </p>
          </div>
        </div>

        {/* Deployment Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-[#0d0d0f] border border-white/5 rounded-3xl p-10 flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Globe size={120} className="text-indigo-400" />
              </div>
              <h4 className="text-lg font-black text-white uppercase tracking-wider">Cloud Deployment</h4>
              <p className="text-sm text-white/40 leading-relaxed font-medium">
                Distributed nodes across multiple regional clusters. High-availability synchronization ensures zero-latency handovers for institutional agents.
              </p>
              <div className="flex items-center gap-6 mt-4">
                 <div className="flex flex-col gap-1">
                    <span className="text-2xl font-black text-white">42</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Edge Nodes</span>
                 </div>
                 <div className="w-px h-10 bg-white/5" />
                 <div className="flex flex-col gap-1">
                    <span className="text-2xl font-black text-white">99.99%</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Uptime SLA</span>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-3xl p-10 flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={120} className="text-indigo-400" />
              </div>
              <h4 className="text-lg font-black text-indigo-400 uppercase tracking-wider">Ensemble Scaling</h4>
              <p className="text-sm text-white/40 leading-relaxed font-medium">
                Automatic vertical scaling protocols triggered by Institutional Matrix demands. Real-time reallocation of TPM based on priority academic sectors.
              </p>
              <button className="w-fit px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all mt-4">
                Modify Scaling Rules
              </button>
           </div>
        </div>
      </div>
    </ErpLayout>
  )
}
