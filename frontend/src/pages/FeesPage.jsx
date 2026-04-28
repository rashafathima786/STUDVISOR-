import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { fetchMyFees, fetchFeeSummary, fetchPaymentHistory } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Download,
  Search
} from 'lucide-react'

export default function FeesPage() {
  const [fees, setFees] = useState([])
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [tab, setTab] = useState('fees')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchMyFees().catch(() => ({ fees: [] })),
      fetchFeeSummary().catch(() => null),
      fetchPaymentHistory().catch(() => ({ payments: [] })),
    ]).then(([feesRes, summaryRes, paymentsRes]) => {
      setFees(feesRes?.fees || [])
      setSummary(summaryRes)
      setPayments(paymentsRes?.payments || [])
      setLoading(false)
    })
  }, [])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
      case 'Overdue': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
      case 'Partial': return { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
      default: return { icon: Clock, color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' }
    }
  }

  return (
    <ErpLayout title="Financial Terminal" subtitle="Secure management of academic dues and transaction history">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl">
               <ShieldCheck className="text-primary" size={32} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Ledger Overview</h2>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Protocol: Secure Encrypted</p>
             </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 shadow-2xl">
            {['fees', 'payments'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'fees' ? 'Dues Ledger' : 'Pay History'}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Aggregate Due', value: `₹${summary?.total_due?.toLocaleString() || 0}`, icon: Wallet, color: 'text-red-400' },
            { label: 'Synchronized Paid', value: `₹${summary?.total_paid?.toLocaleString() || 0}`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Current Balance', value: `₹${summary?.total_balance?.toLocaleString() || 0}`, icon: Wallet, color: 'text-amber-400' },
            { label: 'Overdue Cycles', value: summary?.overdue_count || 0, icon: AlertTriangle, color: 'text-red-500' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-container/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 shadow-xl group hover:border-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                  <stat.icon className={stat.color} size={24} />
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                   <span className="text-[8px] font-black text-white/30 tracking-widest uppercase">Verified</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Content Section */}
        <div className="bg-[#0d0d10]/40 backdrop-blur-2xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Synchronizing Encrypted Data...</p>
              </motion.div>
            ) : tab === 'fees' ? (
              <motion.div 
                key="fees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="overflow-x-auto"
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Paid</th>
                      <th className="px-10 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {fees.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-10 py-32 text-center">
                          <p className="text-white/20 text-sm font-bold uppercase tracking-widest italic">Clear Financial Record</p>
                        </td>
                      </tr>
                    ) : (
                      fees.map((fee, idx) => {
                        const style = getStatusStyle(fee.status);
                        return (
                          <tr key={fee.id || idx} className="hover:bg-white/[0.03] transition-colors group">
                            <td className="px-10 py-8">
                              <div className="flex flex-col">
                                <span className="text-white font-bold group-hover:text-primary transition-colors tracking-tight">{fee.fee_name}</span>
                                <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter mt-1 italic">Due: {fee.due_date || '--'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-8">
                               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{fee.category}</span>
                            </td>
                            <td className="px-6 py-8 text-right font-bold text-white">₹{fee.amount_due?.toLocaleString()}</td>
                            <td className="px-6 py-8 text-right font-bold text-emerald-400">₹{fee.amount_paid?.toLocaleString()}</td>
                            <td className="px-10 py-8">
                              <div className="flex justify-center">
                                <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.color} ${style.border}`}>
                                  <style.icon size={12} /> {fee.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div 
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="overflow-x-auto"
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-10 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Receipt #</th>
                      <th className="px-6 py-6 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Gateway</th>
                      <th className="px-6 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-6 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Txn ID</th>
                      <th className="px-10 py-6 text-right text-[10px] font-black text-white/30 uppercase tracking-widest">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-10 py-32 text-center">
                          <p className="text-white/20 text-sm font-bold uppercase tracking-widest italic">No External Transactions Found</p>
                        </td>
                      </tr>
                    ) : (
                      payments.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-3">
                               <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                 <Receipt size={16} />
                               </div>
                               <span className="font-mono text-xs text-white/80">{p.receipt_number}</span>
                             </div>
                          </td>
                          <td className="px-6 py-8">
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{p.payment_method}</span>
                          </td>
                          <td className="px-6 py-8 text-right font-black text-white tracking-tighter text-lg">
                            ₹{p.amount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-8 text-center">
                             <span className="text-[10px] font-bold text-white/20 italic">{p.transaction_id || 'INTERNAL_SYNC'}</span>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-white/60">{new Date(p.paid_at).toLocaleDateString()}</span>
                               <span className="text-[10px] text-white/20 font-medium">Verified Gateway</span>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex justify-between items-center px-8 py-6 bg-white/5 rounded-[32px] border border-white/5">
           <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500/50" size={18} />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Integrity Verified</p>
           </div>
           <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
              Support Center <ArrowUpRight size={14} />
           </button>
        </div>

      </div>
    </ErpLayout>
  )
}
