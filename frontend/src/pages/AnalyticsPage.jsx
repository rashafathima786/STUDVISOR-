import { useState, useEffect } from 'react';
import ErpLayout from '../components/ErpLayout';
import { fetchPerformanceAnalytics, predictCgpa } from '../services/api';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart2, Target, GraduationCap } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictMode, setPredictMode] = useState(false);
  const [expectedMarks, setExpectedMarks] = useState({});
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    fetchPerformanceAnalytics().then(res => {
      setData(res);
      setLoading(false);
      
      const defaultMarks = {};
      if (res && res.subjects) {
        res.subjects.forEach(s => defaultMarks[s.subject_id] = s.total_marks);
      }
      setExpectedMarks(defaultMarks);
    }).catch(() => null);
  }, []);

  const handlePredict = async () => {
    try {
      const res = await predictCgpa(expectedMarks);
      setSimResult(res);
      setPredictMode(false);
    } catch (e) { alert("Failed to simulate"); }
  };

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Accessing Performance Core...</p>
        </div>
    </div>
  );

  const { metrics, risk_flags, cgpa_trend, subjects } = data;

  const maxCgpa = 10;
  const chartHeight = 240;
  const chartWidth = 800;

  const normalizeY = (val) => chartHeight - ((val / maxCgpa) * chartHeight);
  const stepX = cgpa_trend.length > 1 ? chartWidth / (cgpa_trend.length - 1) : 0;

  const sgpaPoints = cgpa_trend.map((d, i) => `${i * stepX},${normalizeY(d.sgpa)}`).join(' ');
  const cgpaPoints = cgpa_trend.map((d, i) => `${i * stepX},${normalizeY(d.cgpa)}`).join(' ');

  return (
    <ErpLayout title="Performance Analytics" subtitle="AI-driven academic metrics and predictive models">
      
      {/* ── Top Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group hover:bg-surface-container transition-all border border-border-color hover:border-primary/30">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <GraduationCap size={64} className="text-primary" />
          </div>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Cumulative GPA</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-on-surface tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {metrics.current_cgpa}
            </span>
            <span className="text-on-surface-variant font-bold text-sm">/ {maxCgpa}.0</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group hover:bg-surface-container transition-all border border-border-color hover:border-secondary/30">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <BarChart2 size={64} className="text-secondary" />
          </div>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Completed Credits</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-on-surface tracking-tighter" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {metrics.total_credits_earned}
            </span>
            <span className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">Across {cgpa_trend.length} Sems</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group hover:bg-surface-container transition-all border border-border-color hover:border-tertiary/30">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Target size={64} className="text-tertiary" />
          </div>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Current Standing</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-bold tracking-tight ${metrics.standing.includes('Good') ? 'text-tertiary' : 'text-error'}`} style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                {metrics.standing}
            </span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4">Academic Status</p>
        </div>
      </div>

      {/* ── Main Dashboard Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Chart & Intelligence Flags */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
            
            {/* Trajectory Chart */}
            <div className="glass-panel rounded-3xl p-8 border border-border-color relative overflow-hidden">
                <div className="inner-light-catch" />
                <h3 className="text-lg font-bold text-on-surface tracking-tight mb-8" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>SGPA & CGPA Trajectory</h3>
                
                <div className="w-full overflow-x-auto scrollbar-hide">
                    <div className="min-w-[600px]">
                        <svg viewBox={`0 -20 ${chartWidth} ${chartHeight + 40}`} className="w-full h-full drop-shadow-2xl">
                            {/* Grid Lines */}
                            {[0, 2, 4, 6, 8, 10].map(y => (
                                <line key={`grid-${y}`} x1="0" y1={normalizeY(y)} x2={chartWidth} y2={normalizeY(y)} stroke="var(--border-color)" strokeWidth="1" opacity="0.3" />
                            ))}
                            
                            {/* Trend Lines */}
                            <polyline points={sgpaPoints} fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points={cgpaPoints} fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeDasharray="6,6" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {/* Data Points */}
                            {cgpa_trend.map((d, i) => (
                                <g key={i}>
                                <circle cx={i * stepX} cy={normalizeY(d.sgpa)} r="6" fill="var(--surface)" stroke="var(--color-primary)" strokeWidth="3" />
                                <circle cx={i * stepX} cy={normalizeY(d.cgpa)} r="5" fill="var(--surface)" stroke="var(--color-secondary)" strokeWidth="3" />
                                <text x={i * stepX} y={chartHeight + 25} fill="var(--on-surface-variant)" fontSize="12" textAnchor="middle" fontWeight="bold" opacity="0.6">Sem {d.semester}</text>
                                <text x={i * stepX} y={normalizeY(d.sgpa) - 15} fill="var(--on-surface)" fontSize="11" textAnchor="middle" fontWeight="bold">{d.sgpa}</text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-6 mt-8 justify-center border-t border-border-color pt-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        <span className="w-4 h-1 rounded-full bg-primary" />
                        SGPA (Term)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        <span className="w-4 h-0 border-t-2 border-dashed border-secondary" />
                        CGPA (Cumulative)
                    </div>
                </div>
            </div>

            {/* Intelligence Flags */}
            <div className="glass-panel rounded-3xl p-8 border border-border-color">
                <h3 className="text-lg font-bold text-on-surface tracking-tight mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                    <AlertTriangle size={20} className="text-warning" /> 
                    Intelligence Flags
                </h3>
                <div className="flex flex-col gap-3">
                    {risk_flags.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-start gap-3">
                            <CheckCircle size={18} className="text-tertiary mt-0.5 shrink-0" />
                            <p className="text-sm font-medium text-tertiary">All academic metrics are nominal. No intervention required.</p>
                        </div>
                    ) : (
                        risk_flags.map((flag, i) => (
                            <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 ${flag.severity === 'Danger' ? 'bg-error/10 border-error/20 text-error' : 'bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#f59e0b]'}`}>
                                <BarChart2 size={18} className="mt-0.5 shrink-0" />
                                <div>
                                    <strong className="text-xs uppercase tracking-widest">{flag.type}: </strong> 
                                    <span className="text-sm font-medium">{flag.message}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>

        {/* Right Column: Mastery & Predictor */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
            
            {/* Predictor Engine */}
            <div className="glass-panel rounded-3xl p-8 border border-primary/20 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-lg font-bold text-on-surface tracking-tight flex items-center gap-3" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
                        <Target size={20} className="text-primary" /> 
                        CGPA Predictor
                    </h3>
                    {!predictMode ? (
                        <button onClick={() => setPredictMode(true)} className="px-3 py-1.5 rounded-lg border border-border-color hover:border-primary/50 hover:bg-primary/10 transition-all text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
                            Set Targets
                        </button>
                    ) : (
                        <button onClick={handlePredict} className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container transition-colors text-[10px] font-bold uppercase tracking-widest text-surface shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                            Simulate
                        </button>
                    )}
                </div>
                
                <div className="relative z-10">
                    {predictMode ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-xs text-on-surface-variant mb-2">Input projected marks for current active modules to simulate final CGPA impact.</p>
                            {subjects.map(s => (
                                <div key={s.subject_id} className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest truncate">{s.subject_name}</label>
                                    <div className="relative flex items-center">
                                        <input 
                                            type="number" 
                                            max={s.max_marks} 
                                            min={s.total_marks} 
                                            value={expectedMarks[s.subject_id] || ''} 
                                            onChange={e => setExpectedMarks({...expectedMarks, [s.subject_id]: parseInt(e.target.value) || 0})}
                                            className="autofill-override w-full bg-surface-container-high border border-border-color hover:border-on-surface-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl py-3 pl-4 pr-12 text-on-surface text-sm outline-none transition-all duration-300"
                                        />
                                        <span className="absolute right-4 text-xs font-bold text-on-surface-variant">/ {s.max_marks}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : simResult ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-6 bg-surface-container border border-border-color rounded-2xl">
                                <div>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Baseline</p>
                                    <p className="text-3xl font-bold text-on-surface" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{simResult.current_cgpa.toFixed(2)}</p>
                                </div>
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Projected</p>
                                    <p className="text-3xl font-bold text-tertiary shadow-tertiary drop-shadow-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{simResult.projected_cgpa.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary text-center">
                                Net Academic Yield: +{simResult.target_points_gained.toFixed(1)} Points
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border-color rounded-2xl opacity-60">
                            <Target size={32} className="mb-3 text-on-surface-variant" />
                            <p className="text-sm font-medium text-on-surface-variant">Click "Set Targets" to run simulation.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Subject Mastery */}
            <div className="glass-panel rounded-3xl p-8 border border-border-color">
                <h3 className="text-lg font-bold text-on-surface tracking-tight mb-8" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>Subject Mastery</h3>
                
                <div className="flex flex-col gap-6">
                    {subjects.map(sub => {
                        const pct = (sub.total_marks / sub.max_marks) * 100;
                        const isHigh = pct >= 80;
                        const isMid = pct >= 60 && pct < 80;
                        
                        return (
                            <div key={sub.subject_name} className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-on-surface truncate max-w-[200px]" title={sub.subject_name}>{sub.subject_name}</span>
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{sub.total_marks} / {sub.max_marks} Pts</span>
                                    </div>
                                    <span className="text-sm font-bold text-on-surface" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{pct.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${isHigh ? 'bg-tertiary shadow-[0_0_10px_rgba(78,222,163,0.5)]' : isMid ? 'bg-primary shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'bg-[#f59e0b]'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>

      </div>
    </ErpLayout>
  );
}
