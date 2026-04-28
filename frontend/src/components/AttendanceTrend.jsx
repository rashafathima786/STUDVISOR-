import { useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ─── helpers ─────────────────────────────────── */
function getMonthWeeks(year, month) {
  const first = new Date(year, month, 1);
  const dow = first.getDay();
  const startMon = new Date(first);
  startMon.setDate(1 - ((dow + 6) % 7));
  return Array.from({ length: 4 }, (_, w) =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(startMon);
      d.setDate(startMon.getDate() + w * 7 + i);
      return d;
    })
  );
}

function isSatWorking(satDate) {
  const firstDay = new Date(satDate.getFullYear(), satDate.getMonth(), 1);
  const dayOfFirst = firstDay.getDay();
  const firstSat = new Date(firstDay);
  firstSat.setDate(1 + ((6 - dayOfFirst + 7) % 7));
  const weekNum = Math.round((satDate - firstSat) / (7 * 86400000));
  return weekNum === 0 || weekNum === 2; // 1st or 3rd Saturday = working
}

const TODAY  = new Date();
const WEEKS  = getMonthWeeks(TODAY.getFullYear(), TODAY.getMonth());
const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIMETABLE = {
  Mon: [{ sub: "MATH", t: "9:00 AM" }, { sub: "PHY",  t: "11:00 AM" }, { sub: "CS",   t: "2:00 PM" }],
  Tue: [{ sub: "CHEM", t: "9:00 AM" }, { sub: "ENG",  t: "11:00 AM" }, { sub: "MATH", t: "3:00 PM" }],
  Wed: [{ sub: "CS",   t: "9:00 AM" }, { sub: "PHY",  t: "11:00 AM" }, { sub: "ENG",  t: "2:00 PM" }],
  Thu: [{ sub: "MATH", t: "9:00 AM" }, { sub: "CHEM", t: "11:00 AM" }, { sub: "CS",   t: "3:00 PM" }],
  Fri: [{ sub: "ENG",  t: "9:00 AM" }, { sub: "MATH", t: "11:00 AM" }, { sub: "PHY",  t: "2:00 PM" }],
  Sat: [{ sub: "LAB",  t: "9:00 AM" }, { sub: "MATH", t: "11:00 AM" }],
};

function getStatus(wIdx, dayLabel, subIdx) {
  const seed = (wIdx * 37 + LABELS.indexOf(dayLabel) * 11 + subIdx * 7) % 10;
  return seed < 6 ? "Present" : seed < 8 ? "Absent" : "Duty Leave";
}

const WEEK_PCT = [
  { your: [80, 75, 100, 60, 100, 100], avg: [72, 68, 80, 65, 78, 72] },
  { your: [80, 40, 80, 100, 60, null], avg: [70, 72, 75, 80, 68, null] },
  { your: [100,100, 80, 100, 100, 80], avg: [75, 80, 82, 79, 81, 76] },
  { your: [40,  40, 80,  40,  80, null],avg:[68, 65, 72, 70, 74, null] },
];

const TREND = WEEKS.map((_, i) => {
  const d    = WEEK_PCT[i];
  const vals = d.your.filter(v => v !== null);
  const avgs = d.avg.filter(v => v !== null);
  return {
    week:     "W" + (i + 1),
    overall:  Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    classAvg: Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length),
  };
});

/* ─── styles ───────────────────────────────────── */
const CSS = `
  @keyframes morphIn  { from{opacity:0;transform:translateY(10px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes morphOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-10px) scale(.97)} }
  @keyframes tipIn    { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
  .morph-in  { animation: morphIn  .4s cubic-bezier(.22,1,.36,1); }
  .morph-out { animation: morphOut .25s cubic-bezier(.22,1,.36,1) forwards; }
`;

/* ─── Day hover card ───────────────────────────── */
function DayCard({ data }) {
  const classes = TIMETABLE[data.dayLabel] || [];
  const sc = s => s === "Present" ? "#16a34a" : s === "Absent" ? "#dc2626" : "#ea580c";
  const sb = s => s === "Present" ? "#f0fdf4" : s === "Absent" ? "#fef2f2" : "#fff7ed";
  const cnt = s => classes.filter((_, i) => getStatus(data.wIdx, data.dayLabel, i) === s).length;

  return (
    <div style={{
      position: "fixed", left: data.x + 16, top: Math.max(8, data.y - 60),
      zIndex: 9999, background: "#fff", borderRadius: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,.12),0 1px 4px rgba(0,0,0,.06)",
      border: "1px solid #ede9fe", minWidth: 228, pointerEvents: "none",
      animation: "tipIn .18s cubic-bezier(.34,1.4,.64,1)", fontSize: 12,
    }}>
      <div style={{ padding: "11px 14px 9px", borderBottom: "1px solid #f5f3ff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{data.dayLabel} </span>
            <span style={{ fontSize: 11, color: "#aaa" }}>
              {data.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.4px", color: data.your >= 75 ? "#6d28d9" : "#dc2626" }}>
            {data.your}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
          {cnt("Present")    > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", borderRadius: 5, padding: "2px 6px" }}>{cnt("Present")} Present</span>}
          {cnt("Absent")     > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626", borderRadius: 5, padding: "2px 6px" }}>{cnt("Absent")} Absent</span>}
          {cnt("Duty Leave") > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#fff7ed", color: "#ea580c", borderRadius: 5, padding: "2px 6px" }}>{cnt("Duty Leave")} Duty</span>}
        </div>
      </div>
      <div style={{ padding: "4px 0 2px" }}>
        {classes.map((cls, i) => {
          const st = getStatus(data.wIdx, data.dayLabel, i);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc(st), flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#333", minWidth: 38, fontFamily: "monospace" }}>{cls.sub}</span>
              <span style={{ fontSize: 11, color: "#bbb", flex: 1 }}>{cls.t}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: sc(st), background: sb(st), borderRadius: 4, padding: "1px 6px" }}>{st}</span>
            </div>
          );
        })}
      </div>
      {data.avg !== null && (
        <div style={{ margin: "2px 10px 10px", padding: "6px 10px", background: "#faf8ff", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#bbb", fontWeight: 600 }}>vs Class avg</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>{data.avg}%</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: data.your >= data.avg ? "#16a34a" : "#dc2626" }}>
              {data.your >= data.avg ? "▲ " : "▼ "}{Math.abs(data.your - data.avg)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Week detail view ────────────────────────── */
function WeekView({ wIdx, onBack }) {
  const [tip, setTip] = useState(null);
  const weekDays   = WEEKS[wIdx];
  const wd         = WEEK_PCT[wIdx];
  const weekLabel  = "W" + (wIdx + 1);
  const satWorking = isSatWorking(weekDays[5]);

  const chartData = weekDays.map((date, i) => {
    const label     = LABELS[i];
    const isSat     = i === 5;
    const isHoliday = isSat && !satWorking;
    const isFuture  = date > TODAY;
    return {
      label,
      dateStr:   date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      your:      (isHoliday || isFuture) ? null : (wd.your[i] ?? null),
      avg:       (isHoliday || isFuture) ? null : (wd.avg[i]  ?? null),
      isFuture, isHoliday, date,
    };
  });

  const filledVals = chartData.filter(d => d.your !== null).map(d => d.your);
  const weekAvg    = filledVals.length ? Math.round(filledVals.reduce((a, b) => a + b, 0) / filledVals.length) : null;
  const startDate  = weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const endDate    = weekDays[5].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const DualTick = ({ x, y, index }) => {
    const d = chartData[index];
    if (!d) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={14} textAnchor="middle" fontSize={11} fontWeight={600} fill={d.isHoliday ? "#e0d4ff" : "#555"}>{d.label}</text>
        <text x={0} y={27} textAnchor="middle" fontSize={10} fill="#bbb">{d.dateStr}</text>
        {d.isHoliday && <text x={0} y={40} textAnchor="middle" fontSize={9} fill="#e0d4ff">holiday</text>}
      </g>
    );
  };

  return (
    <div>
      {/* Header row 1: back + week badge + range */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          onClick={onBack}
          style={{ background: "#f3f0ff", border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 13px", fontSize: 12, fontWeight: 700, color: "#6d28d9", whiteSpace: "nowrap" }}
        >← All weeks</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: "#6d28d9", color: "#fff", fontSize: 13, fontWeight: 800, borderRadius: 8, padding: "4px 12px" }}>{weekLabel}</span>
          <span style={{ fontSize: 12, color: "#aaa" }}>{startDate} – {endDate}</span>
        </div>
      </div>

      {/* Header row 2: week avg + legend */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {weekAvg !== null && (
          <div>
            <p style={{ fontSize: 10, color: "#aaa", margin: 0, fontWeight: 500 }}>Week average</p>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-.7px", color: weekAvg >= 75 ? "#6d28d9" : "#dc2626" }}>
              {weekAvg}%
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {[
            { color: "#6d28d9", label: "You" },
            { color: "#ddd6fe", label: "Class avg" },
            { color: "#f3f0ff", label: "Holiday", dashed: true },
          ].map(({ color, label, dashed }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#666" }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: "inline-block", border: dashed ? "1px dashed #c4b5fd" : "none" }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative" }} onMouseLeave={() => setTip(null)}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 52 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 0" stroke="rgba(109,40,217,.05)" vertical={false} />
            <XAxis dataKey="label" tick={<DualTick />} axisLine={false} tickLine={false} height={58} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#ccc" }} axisLine={false} tickLine={false} />
            <Tooltip content={() => null} cursor={{ fill: "rgba(109,40,217,.04)" }} />
            <Bar dataKey="avg" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {chartData.map((d, i) => <Cell key={i} fill={d.isHoliday ? "#f8f6ff" : d.isFuture ? "#f5f3ff" : "#ddd6fe"} />)}
            </Bar>
            <Bar dataKey="your" radius={[5, 5, 0, 0]} maxBarSize={32}>
              {chartData.map((d, i) => {
                const v = d.your;
                const fill = d.isHoliday ? "#f3f0ff" : d.isFuture ? "#f0eeff" : v === null ? "transparent" : v >= 80 ? "#6d28d9" : v >= 60 ? "#f97316" : "#ef4444";
                return <Cell key={i} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Hover detection zones */}
        <div style={{ position: "absolute", top: 6, left: 30, right: 8, bottom: 58, display: "flex", pointerEvents: "none" }}>
          {chartData.map((d, i) => (
            <div key={i}
              style={{ flex: 1, height: "100%", pointerEvents: (!d.isHoliday && !d.isFuture && d.your !== null) ? "all" : "none", cursor: "crosshair" }}
              onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, dayLabel: d.label, wIdx, your: d.your, avg: d.avg, date: d.date })}
              onMouseLeave={() => setTip(null)}
            />
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#c4b5fd", textAlign: "center", margin: "4px 0 0" }}>
        Hover a bar to see subject-wise breakdown
      </p>
      {tip && <DayCard data={tip} />}
    </div>
  );
}

/* ─── Trend view ──────────────────────────────── */
function TrendView({ onWeekClick }) {
  const WeekTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }} onClick={() => onWeekClick(payload.value)}>
        <rect x={-16} y={1} width={32} height={19} rx={6} fill="transparent" />
        <text x={0} y={14} textAnchor="middle" fontSize={11} fontWeight={500} fill="#bbb" fontFamily="inherit">{payload.value}</text>
      </g>
    );
  };

  const TT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#fff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 20px rgba(0,0,0,.09)" }}>
        <p style={{ fontSize: 11, color: "#bbb", marginBottom: 7, fontWeight: 700 }}>{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#888", minWidth: 110 }}>{p.dataKey === "overall" ? "Your attendance" : "Class average"}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: p.color, letterSpacing: "-.4px" }}>{p.value}%</span>
          </div>
        ))}
        <p style={{ fontSize: 10, color: "#c4b5fd", marginTop: 8, marginBottom: 0 }}>Click label → see daily view</p>
      </div>
    );
  };

  return (
    <div>
      <p style={{ fontSize: 11, color: "#c4b5fd", margin: "0 0 10px" }}>Click a week label to see daily breakdown</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={TREND} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="week" axisLine={false} tickLine={false} height={28} tick={(props) => <WeekTick {...props} />} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#ddd" }} axisLine={false} tickLine={false} />
          <Tooltip content={<TT />} />
          <Line type="monotone" dataKey="classAvg" stroke="#ddd6fe" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, fill: "#ddd6fe", stroke: "#fff", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="overall"  stroke="#6d28d9" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#6d28d9", stroke: "#fff", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Root ────────────────────────────────────── */
export default function AttendanceTrend() {
  const [current, setCurrent]   = useState("trend");
  const [rendered, setRendered] = useState("trend");
  const [phase, setPhase]       = useState("idle");
  const monthName = TODAY.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const go = useCallback((next) => {
    if (next === current || phase !== "idle") return;
    setPhase("out");
    setTimeout(() => {
      setRendered(next); setCurrent(next); setPhase("in");
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle")));
    }, 260);
  }, [current, phase]);

  const handleWeek = (w) => go(current === w ? "trend" : w);

  const animCls = phase === "out" ? "morph-out" : phase === "in" ? "morph-in" : "";

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "24px 28px",
        border: "1px solid rgba(109,40,217,.08)",
        boxShadow: "0 2px 20px rgba(109,40,217,.06)",
        width: "100%", maxWidth: 680,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.4px", color: "#1a1a2e", margin: 0 }}>Attendance trend</p>
            <p style={{ fontSize: 12, color: "#aaa", marginTop: 3, marginBottom: 0 }}>
              Weekly overview · <span style={{ color: "#6d28d9", fontWeight: 700 }}>{monthName}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
              <span style={{ width: 20, height: 2.5, background: "#6d28d9", borderRadius: 2, display: "inline-block" }} /> Attendance
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#aaa" }}>
              <span style={{ width: 20, height: 0, border: "1.5px dashed #c4b5fd", display: "inline-block" }} /> Class avg
            </span>
          </div>
        </div>

        {/* Animated view */}
        <div key={rendered} className={animCls}>
          {rendered === "trend"
            ? <TrendView onWeekClick={handleWeek} />
            : <WeekView wIdx={parseInt(rendered.replace("W", "")) - 1} onBack={() => go("trend")} />
          }
        </div>
      </div>
    </>
  );
}