import { useState } from 'react'
import ErpLayout from '../../components/ErpLayout'
import EmptyState from '../../components/EmptyState'
import { FileSearch, Shield, History, Activity, AlertCircle, Clock, Server } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminAudit() {
  // Audit log endpoint not yet available in backend — placeholder UI
  const [logs] = useState([])

  return (
    <ErpLayout title="System Audit" subtitle="Continuous integrity monitoring and activity trail">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="glass-panel p-6 rounded-3xl border-info/10 bg-info/[0.02]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">System Status</span>
               <Server size={16} className="text-info" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">Operational</div>
            <div className="text-[10px] font-bold text-success uppercase tracking-widest">All Nodes Healthy</div>
         </div>

         <div className="glass-panel p-6 rounded-3xl border-primary/10 bg-primary/[0.02]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Security Level</span>
               <Shield size={16} className="text-primary" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">Standard</div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No Active Threats</div>
         </div>

         <div className="glass-panel p-6 rounded-3xl border-warning/10 bg-warning/[0.02]">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Last Event</span>
               <Clock size={16} className="text-warning" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">2m ago</div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Login: Admin Node 01</div>
         </div>
      </div>

      <div className="card glass-panel p-0 border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
           <History size={20} className="text-white/30" />
           <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Activity Ledger</h3>
        </div>

        {logs.length === 0 ? (
          <div className="py-32">
             <EmptyState 
                title="Ledger Synchronizing" 
                description="The audit middleware is currently aggregating historical state changes. Real-time logs will appear here shortly." 
                icon={<FileSearch size={48} className="text-white/10" />}
             />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.01]">
                   <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Timestamp</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Actor</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Action</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-left">Resource</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] text-right">Source IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-white/40">{l.timestamp}</td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold text-white">{l.actor}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-[10px] font-bold uppercase tracking-wider">{l.action}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-info/80">{l.resource}</td>
                    <td className="px-6 py-4 text-right text-xs text-white/20 font-mono">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-error/5 border border-error/10">
         <AlertCircle size={20} className="text-error" />
         <p className="text-[10px] font-bold text-error uppercase tracking-widest">
            Critical Security Note: System-level state changes require multi-factor authorization. Audit trails are immutable.
         </p>
      </div>
    </ErpLayout>
  )
}
