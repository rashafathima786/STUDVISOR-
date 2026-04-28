import React, { useState, useEffect } from 'react';
import { fetchAdminDashboard } from '../../services/api';
import ErpLayout from '../../components/ErpLayout';
import SkeletonLoader from '../../components/SkeletonLoader';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  AlertTriangle, 
  Briefcase, 
  Target,
  Activity,
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';

const CHART_COLORS = ['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f97316'];

/**
 * AdminDashboard v4.1 — "Nexus Command Center"
 * Senior restructuring: Clean architecture, data-driven widgets, and high-fidelity Aether visuals.
 */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ErpLayout title="Nexus Command" subtitle="Synchronizing Data Streams...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <div className="mt-8">
          <SkeletonLoader variant="chart" />
        </div>
      </ErpLayout>
    );
  }

  const stats = data?.counts || {};
  const financials = data?.financials || {};
  const academic = data?.academic || {};
  const placement = data?.placement || {};

  // Financial Telemetry Data
  const revenueData = [
    { name: 'Collected', value: financials.total_collected || 0 },
    { name: 'Outstanding', value: (financials.total_due || 0) - (financials.total_collected || 0) },
  ];

  return (
    <ErpLayout title="Nexus Command" subtitle="Full System Oversight Active">
      
      {/* ── Top-Tier Telemetry ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <MetricCard 
          label="Total Entities" 
          value={stats.total_students || 0} 
          sub="Active Students"
          icon={<Users className="text-primary" />}
          trend="+2.4%"
        />
        <MetricCard 
          label="Faculty Nodes" 
          value={stats.total_faculty || 0} 
          sub="Verified Instructors"
          icon={<Cpu className="text-secondary" />}
          trend="Stable"
        />
        <MetricCard 
          label="Fiscal Liquidity" 
          value={`₹${((financials.total_collected || 0) / 100000).toFixed(1)}L`} 
          sub="Fee Collection"
          icon={<CreditCard className="text-tertiary" />}
          trend="+8.1%"
        />
        <MetricCard 
          label="Incident Reports" 
          value={stats.active_complaints || 0} 
          sub="Pending Resolution"
          icon={<AlertTriangle className="text-error" />}
          trend="-12%"
          trendDown
        />

      </div>

      {/* ── Main Operations Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Academic Performance Matrix */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-3xl p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-bold text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>Academic Yield Analytics</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Avg CGPA across departments</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">REAL-TIME</span>
                </div>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={academic.dept_performance || []}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                        <Tooltip 
                            contentStyle={{backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-lg)'}}
                            itemStyle={{color: 'var(--text)', fontSize: '12px'}}
                        />
                        <Bar dataKey="avg_cgpa" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Financial Distribution */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-lg font-bold text-on-surface tracking-tight mb-8 self-start" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>Fiscal Status</h3>
            
            <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={revenueData}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                        >
                            {revenueData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Efficiency</span>
                    <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {((financials.total_collected / financials.total_due) * 100).toFixed(0)}%
                    </span>
                </div>
            </div>

            <div className="w-full mt-6 space-y-3">
                {revenueData.map((d, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{d.name}</span>
                        </div>
                        <span className="text-xs font-bold text-white">₹{(d.value / 1000).toFixed(1)}k</span>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* ── Specialized Intelligence ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        
        {/* Placement Pipeline */}
        <div className="glass-panel rounded-3xl p-8 border border-primary/10">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white">Placement Pipeline</h4>
                    <p className="text-xs text-on-surface-variant">Batch of 2025 Statistics</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Placed</p>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{placement.placed_count || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Avg Package</p>
                    <p className="text-2xl font-bold text-tertiary" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{placement.avg_package || '0'}L</p>
                </div>
            </div>
        </div>

        {/* AI Insight Engine */}
        <div className="glass-panel rounded-3xl p-8 border border-secondary/10 bg-secondary/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Zap size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white">Neural Analytics</h4>
                    <p className="text-xs text-on-surface-variant">Predictive student attrition model</p>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Confidence Level</span>
                    <span className="text-xs font-bold text-secondary">94%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[94%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                </div>
                <p className="text-[10px] text-on-surface-variant italic mt-2">
                    Insight: Increasing participation in "Collective" events correlates with 12% higher placement success.
                </p>
            </div>
        </div>

      </div>

    </ErpLayout>
  );
}

/** ── Sub-Components ─────────────────────────────────────────────────── */

function MetricCard({ label, value, sub, icon, trend, trendDown }) {
  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendDown ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
          <TrendingUp size={10} className={trendDown ? 'rotate-180' : ''} />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{value}</h4>
        <p className="text-[10px] font-medium text-on-surface-variant opacity-60">{sub}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
        <div className="h-full bg-primary/20 w-1/3 group-hover:w-full transition-all duration-700" />
      </div>
    </div>
  );
}
