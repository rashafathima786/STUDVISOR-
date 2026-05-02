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
      default: return { icon: Clock, color: 'text-on-surface-variant/40', bg: 'bg-surface-container', border: 'border-border-color' }
    }
  }

  return (
    <ErpLayout title="Financial Terminal" subtitle="Secure management of academic dues and transaction history">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
               <ShieldCheck className="text-primary" size={32} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>Ledger Overview</h2>
               <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Protocol: Secure Encrypted</p>
             </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 glass-panel rounded-2xl">
            {['fees', 'payments'].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t 
                    ? 'bg-primary text-surface shadow-lg shadow-primary/20' 
                    : 'text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {t === 'fees' ? 'Dues Ledger' : 'Pay History'}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Summary Grid */}
        <div className="flex flex-col md:grid md:grid-cols-4 gap-6 mb-12">
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
              className="glass-panel rounded-[40px] p-8 shadow-xl group hover:border-primary/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-surface-container rounded-2xl group-hover:scale-110 transition-transform">
                  <stat.icon className={stat.color} size={24} />
                </div>
                <div className="px-3 py-1 bg-surface-container rounded-lg border border-border-color">
                   <span className="text-[8px] font-black text-on-surface-variant/30 tracking-widest uppercase">Verified</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-on-surface tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Content Section */}
        <div className="glass-panel rounded-[48px] overflow-hidden shadow-2xl min-h-[400px]">
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
                <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-widest">Synchronizing Encrypted Data...</p>
              </motion.div>
            ) : tab === 'fees' ? (
              <motion.div 
                key="fees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-container/50">
                        <th className="px-10 py-6 text-left text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Description</th>
                        <th className="px-6 py-6 text-left text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Category</th>
                        <th className="px-6 py-6 text-right text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-6 text-right text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Paid</th>
                        <th className="px-10 py-6 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {fees.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-10 py-32 text-center">
                            <p className="text-on-surface-variant/20 text-sm font-bold uppercase tracking-widest italic">Clear Financial Record</p>
                          </td>
                        </tr>
                      ) : (
                        fees.map((fee, idx) => {
                          const style = getStatusStyle(fee.status);
                          return (
                            <tr key={fee.id || idx} className="hover:bg-surface-container/30 transition-colors group">
                              <td className="px-10 py-8">
                                <div className="flex flex-col">
                                  <span className="text-on-surface font-bold group-hover:text-primary transition-colors tracking-tight">{fee.fee_name}</span>
                                  <span className="text-[10px] text-on-surface-variant/20 font-bold uppercase tracking-tighter mt-1 italic">Due: {fee.due_date || '--'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-8">
                                 <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">{fee.category}</span>
                              </td>
                              <td className="px-6 py-8 text-right font-bold text-on-surface">₹{fee.amount_due?.toLocaleString()}</td>
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
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-border-color">
                  {fees.length === 0 ? (
                    <div className="px-6 py-20 text-center">
                       <p className="text-on-surface-variant/20 text-xs font-black uppercase tracking-widest italic">Clear Financial Record</p>
                    </div>
                  ) : (
                    fees.map((fee, idx) => {
                      const style = getStatusStyle(fee.status);
                      return (
                        <div key={fee.id || idx} className="p-6 space-y-4">
                           <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                 <span className="text-on-surface font-bold tracking-tight">{fee.fee_name}</span>
                                 <span className="text-[10px] text-on-surface-variant/40 uppercase font-black mt-1">{fee.category}</span>
                              </div>
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${style.bg} ${style.color} ${style.border}`}>
                                 <style.icon size={10} /> {fee.status}
                              </span>
                           </div>
                           <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[8px] font-black text-on-surface-variant/20 uppercase tracking-widest">Amount Due</span>
                                 <span className="text-xs font-bold text-on-surface">₹{fee.amount_due?.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                 <span className="text-[8px] font-black text-on-surface-variant/20 uppercase tracking-widest">Amount Paid</span>
                                 <span className="text-xs font-bold text-emerald-400">₹{fee.amount_paid?.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="payments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-container/50">
                        <th className="px-10 py-6 text-left text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Receipt #</th>
                        <th className="px-6 py-6 text-left text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Gateway</th>
                        <th className="px-6 py-6 text-right text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Txn ID</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-on-surface-variant/30 uppercase tracking-widest">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-10 py-32 text-center">
                            <p className="text-on-surface-variant/20 text-sm font-bold uppercase tracking-widest italic">No External Transactions Found</p>
                          </td>
                        </tr>
                      ) : (
                        payments.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-surface-container/30 transition-colors group">
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                   <Receipt size={16} />
                                 </div>
                                 <span className="font-mono text-xs text-on-surface/80">{p.receipt_number}</span>
                               </div>
                            </td>
                            <td className="px-6 py-8">
                               <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{p.payment_method}</span>
                            </td>
                            <td className="px-6 py-8 text-right font-black text-on-surface tracking-tighter text-lg">
                              ₹{p.amount?.toLocaleString()}
                            </td>
                            <td className="px-6 py-8 text-center">
                               <span className="text-[10px] font-bold text-on-surface-variant/20 italic">{p.transaction_id || 'INTERNAL_SYNC'}</span>
                            </td>
                            <td className="px-10 py-8 text-right">
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-on-surface/60">{new Date(p.paid_at).toLocaleDateString()}</span>
                                 <span className="text-[10px] text-on-surface-variant/20 font-medium">Verified Gateway</span>
                               </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-border-color">
                   {payments.length === 0 ? (
                     <div className="px-6 py-20 text-center">
                        <p className="text-on-surface-variant/20 text-xs font-black uppercase tracking-widest italic">No transactions detected</p>
                     </div>
                   ) : (
                     payments.map((p, idx) => (
                       <div key={p.id || idx} className="p-6 space-y-4">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                  <Receipt size={16} />
                                </div>
                                <span className="font-mono text-xs text-on-surface/80">{p.receipt_number}</span>
                             </div>
                             <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">{p.payment_method}</span>
                          </div>
                          <div className="flex justify-between items-end">
                             <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-on-surface-variant/20 uppercase tracking-widest">Transaction ID</span>
                                <span className="text-[10px] font-bold text-on-surface-variant/40 italic">{p.transaction_id || 'INTERNAL_SYNC'}</span>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-on-surface tracking-tighter">₹{p.amount?.toLocaleString()}</span>
                                <span className="text-[10px] text-on-surface/40 font-bold">{new Date(p.paid_at).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex justify-between items-center px-8 py-6 glass-panel rounded-[32px] border border-border-color">
           <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500/50" size={18} />
              <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.3em]">Operational Integrity Verified</p>
           </div>
           <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-on-surface transition-colors uppercase tracking-widest">
              Support Center <ArrowUpRight size={14} />
           </button>
        </div>

      </div>
    </ErpLayout>
  )
}
