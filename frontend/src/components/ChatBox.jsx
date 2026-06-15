import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  SendHorizonal, User, ArrowRight, ExternalLink, Mic,
  Sparkles, AlertTriangle, CheckCircle2, Zap, ChevronRight,
  Clock, Copy, Check, LayoutDashboard, Activity, GraduationCap,
  ShieldCheck, MessageSquare, Settings, Users, Cpu, FileText
} from 'lucide-react'
import ChatbotLogo from './ui/ChatbotLogo'
import { fetchChatHistory, sendChatMessage, streamChatMessage, fetchChatWelcome } from '../services/api'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

// ── Animation Variants ─────────────────────────────────────────────
const botVariants = {
  hidden: { opacity: 0, x: -14, scale: 0.96, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, x: -8, scale: 0.97, filter: 'blur(4px)', transition: { duration: 0.18 } },
}
const userVariants = {
  hidden: { opacity: 0, x: 14, scale: 0.96, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, x: 8, scale: 0.97, filter: 'blur(4px)', transition: { duration: 0.18 } },
}

// ── Helpers ────────────────────────────────────────────────────────
function formatTime(d = new Date()) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function useTimestamp() {
  return formatTime()
}

// ── Copy Button ────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [text])
  return (
    <button className="cb2-copy-btn" onClick={handle} aria-label="Copy message" title="Copy">
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

// ── Provider Badge ─────────────────────────────────────────────────
function ProviderBadge({ meta }) {
  const label = meta?.protocol || meta?.orchestration?.provider_summary?.label
  if (!label) return null
  const isGemini = label.toLowerCase().includes('gemini')
  const isGroq   = label.toLowerCase().includes('groq')
  const color = isGemini ? '#22d3ee' : isGroq ? '#a78bfa' : '#94a3b8'
  return (
    <div className="cb2-provider-badge" style={{ color }}>
      <Zap size={9} />
      <span>{label}</span>
    </div>
  )
}

// ── Emotion Strip ──────────────────────────────────────────────────
function EmotionStrip({ emotion }) {
  if (!emotion || emotion === 'neutral') return null
  const map = {
    distressed: { label: 'Support mode active', color: '#ef4444', icon: '🆘' },
    frustrated:  { label: 'I hear you — let\'s sort this',   color: '#f97316', icon: '😤' },
    anxious:     { label: 'You\'ve got this — one step at a time', color: '#f59e0b', icon: '💛' },
    positive:    { label: 'Great energy!', color: '#10b981', icon: '✨' },
  }
  const e = map[emotion]
  if (!e) return null
  return (
    <div className="cb2-emotion-strip" style={{ borderColor: e.color + '44', background: e.color + '14', color: e.color }}>
      <span>{e.icon}</span>
      <span>{e.label}</span>
    </div>
  )
}

// ── Attendance / Subject data parser ──────────────────────────────
// Detects backend bullet format:
//   • Subject Name: 83.5% (Safe)
//   • Subject Name: 20.0% (Requires 11 more classes)
//   • Subject: ELIGIBLE (83.5%) / INELIGIBLE
//   • Subject (CIA1): 45/50 (90.0%) -> A+
//   • Subject Name: 15/50 (30.0%) in CIA1
const ATT_LINE_RE = /^[•\-*]?\s*\*{0,2}(.+?)\*{0,2}:\s*(\d+(?:\.\d+)?)%\s*\(([^)]+)\)/
const MARKS_LINE_RE = /^[•\-*]?\s*\*{0,2}(.+?)\*{0,2}\s*\(([^)]+)\):\s*(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\s*\((\d+(?:\.\d+)?)%\)\s*->\s*(.+)/
const ELIGIBILITY_LINE_RE = /^[•\-*]?\s*\*{0,2}(.+?):\s*(ELIGIBLE|INELIGIBLE)\s*\((\d+(?:\.\d+)?)%\)/i
const BUNK_LINE_RE = /^[•\-*]?\s*\*{0,2}(.+?)\*{0,2}:\s*(\d+)\s+classes?\s*\((SAFE|WARN|CRIT)\)/i
const LOW_MARKS_LINE_RE = /^[•\-*]?\s*\*{0,2}(.+?)\*{0,2}:\s*(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\s*\((\d+(?:\.\d+)?)%\)\s+in\s+(.+)/i

function parseAttendanceLines(text) {
  const lines = text.split(/\n|(?=•)/g).map(l => l.trim()).filter(Boolean)
  const rows = []
  for (const line of lines) {
    // Marks format
    const mMark = MARKS_LINE_RE.exec(line)
    if (mMark) {
      const subjectName = mMark[1].trim().replace(/^\*+|\*+$/g, '').trim()
      if (/overall\s+attendance/i.test(subjectName)) continue
      const pct = parseFloat(mMark[5])
      rows.push({ type: 'marks', subject: subjectName, assessment: mMark[2], obtained: mMark[3], max: mMark[4], pct, grade: mMark[6].trim() })
      continue
    }
    // Low Marks format
    const mLowMark = LOW_MARKS_LINE_RE.exec(line)
    if (mLowMark) {
      const subjectName = mLowMark[1].trim().replace(/^\*+|\*+$/g, '').trim()
      if (/overall\s+attendance/i.test(subjectName)) continue
      const pct = parseFloat(mLowMark[4])
      rows.push({ type: 'marks', subject: subjectName, assessment: mLowMark[5].trim(), obtained: mLowMark[2], max: mLowMark[3], pct, grade: pct >= 40 ? 'PASS' : 'FAIL' })
      continue
    }
    // Eligibility format
    const mElig = ELIGIBILITY_LINE_RE.exec(line)
    if (mElig) {
      const subjectName = mElig[1].trim().replace(/^\*+|\*+$/g, '').trim()
      if (/overall\s+attendance/i.test(subjectName)) continue
      rows.push({ type: 'eligibility', subject: subjectName, status: mElig[2].toUpperCase(), pct: parseFloat(mElig[3]) })
      continue
    }
    // Bunk format
    const mBunk = BUNK_LINE_RE.exec(line)
    if (mBunk) {
      const subjectName = mBunk[1].trim().replace(/^\*+|\*+$/g, '').trim()
      if (/overall\s+attendance/i.test(subjectName)) continue
      rows.push({ type: 'bunk', subject: subjectName, canMiss: parseInt(mBunk[2]), status: mBunk[3].toUpperCase() })
      continue
    }
    // Attendance % format  — backend wraps number in **bold**: (Requires **11** more classes)
    const mAtt = ATT_LINE_RE.exec(line)
    if (mAtt) {
      const subjectName = mAtt[1].trim().replace(/^\*+|\*+$/g, '').trim()
      if (/overall\s+attendance/i.test(subjectName)) continue
      const detail = mAtt[3].trim()
      const isSafe = /safe|ok/i.test(detail)
      // Strip optional **markdown** bold around the number e.g. **11** or 11
      const needMatch = detail.match(/\*{0,2}(\d+)\*{0,2}\s+more/i)
      rows.push({ type: 'attendance', subject: subjectName, pct: parseFloat(mAtt[2]), isSafe, needed: needMatch ? parseInt(needMatch[1]) : null, detail })
    }
  }
  return rows
}

function hasStructuredData(text) {
  if (!text) return false
  const lines = text.split(/\n|(?=•)/g).map(l => l.trim()).filter(Boolean)
  const matchCount = lines.filter(l => {
    const m = ATT_LINE_RE.exec(l) || MARKS_LINE_RE.exec(l) || ELIGIBILITY_LINE_RE.exec(l) || BUNK_LINE_RE.exec(l) || LOW_MARKS_LINE_RE.exec(l)
    if (!m) return false
    const subjectName = m[1].trim().replace(/^\*+|\*+$/g, '').trim()
    return !/overall\s+attendance/i.test(subjectName)
  }).length
  return matchCount >= 2
}

// ── Attendance Card ─────────────────────────────────────────────────
function AttendanceRow({ row, idx }) {
  const delay = idx * 0.06

  if (row.type === 'marks') {
    const pct = row.pct
    const isGood = pct >= 75
    return (
      <motion.div
        className={`cb2-att-row ${isGood ? 'safe' : 'warn'}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.25, ease: [0.34,1.56,0.64,1] }}
      >
        <span className="cb2-att-icon">{isGood ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}</span>
        <span className="cb2-att-name">{row.subject}</span>
        <span className="cb2-att-meta">{row.assessment}</span>
        <span className="cb2-att-score">{row.obtained}/{row.max}</span>
        <span className="cb2-att-grade">{row.grade}</span>
        <div className="cb2-att-bar-wrap">
          <motion.div className="cb2-att-bar" initial={{ width: 0 }} animate={{ width: `${Math.min(pct,100)}%` }} transition={{ delay: delay+0.1, duration: 0.7, ease:[0.34,1.56,0.64,1] }} />
        </div>
      </motion.div>
    )
  }

  if (row.type === 'eligibility') {
    const ok = row.status === 'ELIGIBLE'
    return (
      <motion.div
        className={`cb2-att-row ${ok ? 'safe' : 'warn'}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.25, ease: [0.34,1.56,0.64,1] }}
      >
        <span className="cb2-att-icon">{ok ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}</span>
        <span className="cb2-att-name">{row.subject}</span>
        <span className={`cb2-elig-badge ${ok ? 'safe' : 'warn'}`}>{ok ? 'ELIGIBLE' : 'INELIGIBLE'}</span>
        <span className="cb2-att-pct">{row.pct}%</span>
        <div className="cb2-att-bar-wrap">
          <motion.div className="cb2-att-bar" initial={{ width: 0 }} animate={{ width: `${Math.min(row.pct,100)}%` }} transition={{ delay: delay+0.1, duration: 0.7, ease:[0.34,1.56,0.64,1] }} />
        </div>
      </motion.div>
    )
  }

  if (row.type === 'bunk') {
    const ok = row.status === 'SAFE'
    const warn = row.status === 'WARN'
    const cls = ok ? 'safe' : warn ? 'warn' : 'crit'
    return (
      <motion.div
        className={`cb2-att-row ${cls}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.25, ease: [0.34,1.56,0.64,1] }}
      >
        <span className="cb2-att-icon">{ok ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}</span>
        <span className="cb2-att-name">{row.subject}</span>
        <span className="cb2-att-pct" style={{ marginLeft: 'auto' }}>{row.canMiss} can miss</span>
      </motion.div>
    )
  }

  // Default: attendance %
  const isSafe = row.isSafe
  const pct = row.pct
  return (
    <motion.div
      className={`cb2-att-row ${isSafe ? 'safe' : 'warn'}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25, ease: [0.34,1.56,0.64,1] }}
    >
      <span className="cb2-att-icon">
        {isSafe ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
      </span>
      <span className="cb2-att-name">{row.subject}</span>
      {!isSafe && row.needed != null && (
        <span className="cb2-need-badge">+{row.needed} classes</span>
      )}
      <span className="cb2-att-pct">{pct}%</span>
      <div className="cb2-att-bar-wrap">
        <motion.div
          className="cb2-att-bar"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ delay: delay + 0.1, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
    </motion.div>
  )
}

function AttendanceCard({ rows, preamble }) {
  const warnRows = rows.filter(r => r.type === 'attendance' ? !r.isSafe : r.type === 'eligibility' ? r.status !== 'ELIGIBLE' : r.type === 'bunk' ? r.status === 'CRIT' : r.type === 'marks' ? r.pct < 40 : false)
  const safeRows = rows.filter(r => !warnRows.includes(r))
  const isAttendance = rows.some(r => r.type === 'attendance')
  const isMarks      = rows.some(r => r.type === 'marks')
  const isElig       = rows.some(r => r.type === 'eligibility')
  const isBunk       = rows.some(r => r.type === 'bunk')

  return (
    <div className="cb2-att-card">
      {preamble && <p className="cb2-att-preamble">{preamble}</p>}
      {isAttendance && warnRows.length > 0 && (
        <>
          <div className="cb2-att-section-label warn">
            <AlertTriangle size={11}/> Needs attention
          </div>
          {warnRows.map((row, i) => <AttendanceRow key={i} row={row} idx={i} />)}
        </>
      )}
      {isAttendance && safeRows.length > 0 && (
        <>
          <div className="cb2-att-section-label safe">
            <CheckCircle2 size={11}/> You&apos;re safe
          </div>
          {safeRows.map((row, i) => <AttendanceRow key={i} row={row} idx={i} />)}
        </>
      )}
      {(isMarks || isElig || isBunk) && rows.map((row, i) => <AttendanceRow key={i} row={row} idx={i} />)}
    </div>
  )
}

// ── Overall Attendance data parser ───────────────────────────────
function hasOverallAttendance(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('overall attendance') && lower.includes('present') && lower.includes('absent')
}

function parseOverallAttendance(text) {
  const lines = text.split(/\n|(?=•)/g).map(l => l.trim()).filter(Boolean)
  let pct = null
  let present = null
  let absent = null
  let status = null
  const preambleLines = []

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').trim() // clean markdown asterisks
    const mPct = /overall\s+attendance\s*:\s*(\d+(?:\.\d+)?)/i.exec(clean)
    if (mPct) {
      pct = parseFloat(mPct[1])
      continue
    }
    const mPres = /present\s*:\s*(\d+)/i.exec(clean)
    if (mPres) {
      present = parseInt(mPres[1], 10)
      continue
    }
    const mAbs = /absent\s*:\s*(\d+)/i.exec(clean)
    if (mAbs) {
      absent = parseInt(mAbs[1], 10)
      continue
    }
    const mStat = /status\s*:\s*([a-zA-Z]+)/i.exec(clean)
    if (mStat) {
      status = mStat[1].toUpperCase()
      continue
    }
    preambleLines.push(clean)
  }

  if (pct !== null && present !== null && absent !== null) {
    let preamble = preambleLines.join(' ').replace(/^[•\-*]/, '').trim()
    preamble = preamble
      .replace(/,?\s*\b(?:but\s+)?here(?:'s|\s+is)\s+(?:your\s+)?(?:current\s+)?attendance\s+(?:summary|details):?/i, '')
      .replace(/,?\s*\bhere\s+is\s+your\s+attendance:?/i, '')
      .replace(/,?\s*\bhere\s+is\s+the\s+summary:?/i, '')
      .replace(/:$/, '')
      .trim()
    return { pct, present, absent, status: status || 'STABLE', preamble: preamble || null }
  }
  return null
}

function OverallAttendanceCard({ data }) {
  const { pct, present, absent, status, preamble } = data
  const total = present + absent
  const statusCls = status.toLowerCase()

  const icon = statusCls === 'stable' ? (
    <CheckCircle2 size={12} />
  ) : (
    <AlertTriangle size={12} />
  )

  return (
    <div className="cb2-overall-att-card">
      <div className="cb2-overall-header">
        <span className="cb2-overall-title">Overall Attendance Summary</span>
        <span className={`cb2-overall-status ${statusCls}`}>
          {icon}
          {status}
        </span>
      </div>

      {preamble && (
        <motion.div 
          className="cb2-overall-preamble"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="cb2-overall-preamble-icon-wrap">
            <AlertTriangle size={13} />
          </div>
          <div className="cb2-overall-preamble-content">
            <span className="cb2-overall-preamble-label">Important Note</span>
            <p className="cb2-overall-preamble-text">{preamble}</p>
          </div>
        </motion.div>
      )}
      <div className="cb2-overall-content">
        <div className={`cb2-overall-radial ${statusCls}`}>
          <svg className="cb2-overall-radial-svg" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="stable-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="warning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="critical-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <circle className="cb2-overall-radial-bg" cx="50" cy="50" r="42" />
            <motion.circle
              className="cb2-overall-radial-progress"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="cb2-overall-pct-text">
            <span>{pct}%</span>
            <span className="cb2-overall-pct-sub">ATTENDED</span>
          </div>
        </div>
        <div className="cb2-overall-stats">
          <div className="cb2-overall-stat-item">
            <span className="cb2-overall-stat-label">
              <span className="cb2-overall-stat-dot present" />
              Present
            </span>
            <span className="cb2-overall-stat-value">{present} classes</span>
          </div>
          <div className="cb2-overall-stat-item">
            <span className="cb2-overall-stat-label">
              <span className="cb2-overall-stat-dot absent" />
              Absent
            </span>
            <span className="cb2-overall-stat-value">{absent} classes</span>
          </div>
          <div className="cb2-overall-stat-item">
            <span className="cb2-overall-stat-label">
              <span className="cb2-overall-stat-dot total" />
              Total
            </span>
            <span className="cb2-overall-stat-value">{total} classes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── GPA Summary data parser & component ──────────────────────────
function hasGPASummary(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return (lower.includes('cgpa') || lower.includes('sgpa')) && lower.includes('sem')
}

// ── Overall Performance: attendance + CGPA + subjects combined ───
function hasOverallPerformance(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return (
    lower.includes('overall attendance') &&
    lower.includes('present') &&
    lower.includes('absent') &&
    (lower.includes('current cgpa') || lower.includes('cgpa'))
  )
}

function parseOverallPerformance(text) {
  const lines = text.split(/\n/g).map(l => l.trim()).filter(Boolean)
  let attPct = null, present = null, absent = null, attStatus = null
  let cgpa = null
  const semesters = []
  let bestSubject = null, weakestSubject = null
  const preambleLines = []

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').trim()
    const mAtt = /overall\s+attendance\s*:\s*(\d+(?:\.\d+)?)/i.exec(clean)
    if (mAtt) { attPct = parseFloat(mAtt[1]); continue }
    const mPres = /^present\s*:\s*(\d+)/i.exec(clean)
    if (mPres) { present = parseInt(mPres[1]); continue }
    const mAbs = /^absent\s*:\s*(\d+)/i.exec(clean)
    if (mAbs) { absent = parseInt(mAbs[1]); continue }
    const mStat = /^status\s*:\s*([a-zA-Z]+)/i.exec(clean)
    if (mStat) { attStatus = mStat[1].toUpperCase(); continue }
    const mCgpa = /current\s+cgpa\s*:\s*(\d+(?:\.\d+)?)/i.exec(clean)
    if (mCgpa) { cgpa = parseFloat(mCgpa[1]); continue }
    const mSem = /sem\s*(\d+)\s+sgpa\s*:\s*(\d+(?:\.\d+)?)/i.exec(clean)
    if (mSem) { semesters.push({ semester: parseInt(mSem[1]), sgpa: parseFloat(mSem[2]) }); continue }
    const mBest = /best\s+subject\s*:\s*(.+?)\s*\((\d+(?:\.\d+)?)%\)/i.exec(clean)
    if (mBest) { bestSubject = { name: mBest[1].trim(), pct: parseFloat(mBest[2]) }; continue }
    const mWeak = /weakest\s+subject\s*:\s*(.+?)\s*\((\d+(?:\.\d+)?)%\)/i.exec(clean)
    if (mWeak) { weakestSubject = { name: mWeak[1].trim(), pct: parseFloat(mWeak[2]) }; continue }
    preambleLines.push(clean)
  }

  if (attPct !== null && cgpa !== null) {
    let preamble = preambleLines.join(' ').replace(/^[•\-*]/, '').trim()
    preamble = preamble
      .replace(/,?\s*\b(?:but\s+)?here(?:'s|\s+is)\s+(?:your\s+)?(?:current\s+)?academic\s+performance:?/i, '')
      .replace(/,?\s*\bhere\s+is\s+your\s+current\s+performance:?/i, '')
      .replace(/,?\s*\bhere\s+is\s+the\s+summary:?/i, '')
      .replace(/:$/, '')
      .trim()
    return { attPct, present, absent, attStatus: attStatus || 'STABLE', cgpa, semesters, bestSubject, weakestSubject, preamble: preamble || null }
  }
  return null
}

function OverallPerformanceCard({ data }) {
  const { attPct, present, absent, attStatus, cgpa, semesters, bestSubject, weakestSubject, preamble } = data
  const total = (present || 0) + (absent || 0)
  const attCls = attStatus.toLowerCase()
  const attColor = attCls === 'stable' ? '#10b981' : attCls === 'warning' ? '#f59e0b' : '#ef4444'
  const cgpaColor = cgpa >= 8.5 ? '#10b981' : cgpa >= 7 ? '#f59e0b' : '#ef4444'

  return (
    <div className="cb2-overall-perf-card">
      {/* Header */}
      <div className="cb2-overall-perf-header">
        <span className="cb2-overall-perf-title">📊 Academic Performance</span>
        <span className={`cb2-overall-status ${attCls}`} style={{ background: attColor + '22', color: attColor }}>
          {attStatus}
        </span>
      </div>

      {preamble && (
        <motion.div 
          className="cb2-overall-preamble"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="cb2-overall-preamble-icon-wrap">
            <AlertTriangle size={13} />
          </div>
          <div className="cb2-overall-preamble-content">
            <span className="cb2-overall-preamble-label">Important Note</span>
            <p className="cb2-overall-preamble-text">{preamble}</p>
          </div>
        </motion.div>
      )}

      {/* Top row: Attendance ring + CGPA score */}
      <div className="cb2-overall-perf-top">
        {/* Attendance Radial */}
        <div className="cb2-overall-perf-att">
          <div className={`cb2-overall-radial ${attCls}`}>
            <svg className="cb2-overall-radial-svg" viewBox="0 0 100 100">
              <circle className="cb2-overall-radial-bg" cx="50" cy="50" r="42" />
              <motion.circle
                className="cb2-overall-radial-progress"
                cx="50" cy="50" r="42"
                stroke={attColor}
                strokeDasharray={2 * Math.PI * 42}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - attPct / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="cb2-overall-pct-text">
              <span>{attPct}%</span>
              <span className="cb2-overall-pct-sub">ATTEND</span>
            </div>
          </div>
          <div className="cb2-overall-perf-att-stats">
            <span><span className="cb2-overall-stat-dot present" /> {present} present</span>
            <span><span className="cb2-overall-stat-dot absent" /> {absent} absent</span>
            <span><span className="cb2-overall-stat-dot total" /> {total} total</span>
          </div>
        </div>

        {/* CGPA Section */}
        <div className="cb2-overall-perf-gpa">
          <div className="cb2-overall-perf-gpa-score" style={{ color: cgpaColor }}>
            {cgpa}
            <span className="cb2-overall-perf-gpa-label">CGPA</span>
          </div>
          <div className="cb2-overall-perf-sems">
            {semesters.map((s, i) => (
              <div key={i} className="cb2-overall-perf-sem-row">
                <span className="cb2-overall-perf-sem-label">Sem {s.semester}</span>
                <span className="cb2-overall-perf-sem-val">{s.sgpa}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best / Weakest subjects */}
      {(bestSubject || weakestSubject) && (
        <div className="cb2-overall-perf-subjects">
          {bestSubject && (
            <div className="cb2-overall-perf-subj best">
              <CheckCircle2 size={12} />
              <span className="cb2-overall-perf-subj-label">Best</span>
              <span className="cb2-overall-perf-subj-name">{bestSubject.name}</span>
              <span className="cb2-overall-perf-subj-pct">{bestSubject.pct}%</span>
            </div>
          )}
          {weakestSubject && (
            <div className="cb2-overall-perf-subj weak">
              <AlertTriangle size={12} />
              <span className="cb2-overall-perf-subj-label">Weakest</span>
              <span className="cb2-overall-perf-subj-name">{weakestSubject.name}</span>
              <span className="cb2-overall-perf-subj-pct">{weakestSubject.pct}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function parseGPASummary(text) {
  const lines = text.split(/\n/g).map(l => l.trim()).filter(Boolean)
  let cgpa = null
  const semesters = []
  const preambleLines = []

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').trim()
    const mCgpa = /current\s+cgpa\s*:\s*(\d+(?:\.\d+)?)/i.exec(clean)
    if (mCgpa) {
      cgpa = parseFloat(mCgpa[1])
      continue
    }
    const mSem = /sem\s*(\d+)\s+sgpa\s*:\s*(\d+(?:\.\d+)?)/i.exec(clean)
    if (mSem) {
      semesters.push({ semester: parseInt(mSem[1], 10), sgpa: parseFloat(mSem[2]) })
      continue
    }
    preambleLines.push(clean)
  }

  if (cgpa !== null || semesters.length > 0) {
    let preamble = preambleLines.join(' ').replace(/^[•\-*]/, '').trim()
    preamble = preamble
      .replace(/,?\s*\b(?:but\s+)?here(?:'s|\s+is)\s+(?:your\s+)?(?:current\s+)?academic\s+performance:?/i, '')
      .replace(/,?\s*\bhere\s+is\s+your\s+current\s+performance:?/i, '')
      .replace(/,?\s*\bhere\s+is\s+the\s+summary:?/i, '')
      .replace(/:$/, '')
      .trim()
    return { cgpa, semesters, preamble: preamble || null }
  }
  return null
}

function GPASummaryCard({ data }) {
  const { cgpa, semesters, preamble } = data

  return (
    <div className="cb2-gpa-card">
      <div className="cb2-gpa-header">
        <span className="cb2-gpa-title">Academic Performance Hub</span>
        {cgpa !== null && (
          <span className="cb2-gpa-badge">
            <Zap size={11} />
            CGPA: {cgpa}
          </span>
        )}
      </div>

      {preamble && (
        <motion.div 
          className="cb2-gpa-preamble"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="cb2-gpa-preamble-icon-wrap">
            <AlertTriangle size={13} />
          </div>
          <div className="cb2-gpa-preamble-content">
            <span className="cb2-gpa-preamble-label">Important Note</span>
            <p className="cb2-gpa-preamble-text">{preamble}</p>
          </div>
        </motion.div>
      )}
      <div className="cb2-gpa-content">
        {cgpa !== null && (
          <div className="cb2-gpa-radial-wrap">
            <div className="cb2-gpa-radial">
              <svg className="cb2-gpa-radial-svg" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="gpa-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <circle className="cb2-gpa-radial-bg" cx="50" cy="50" r="42" />
                <motion.circle
                  className="cb2-gpa-radial-progress"
                  cx="50"
                  cy="50"
                  r="42"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - cgpa / 10) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="cb2-gpa-text">
                <span>{cgpa}</span>
                <span className="cb2-gpa-sub">CGPA</span>
              </div>
            </div>
          </div>
        )}
        <div className="cb2-gpa-list">
          {semesters.map((sem, i) => {
            const pct = (sem.sgpa / 10) * 100
            return (
              <div key={i} className="cb2-gpa-item">
                <div className="cb2-gpa-item-info">
                  <span className="cb2-gpa-item-name">Semester {sem.semester}</span>
                  <span className="cb2-gpa-item-val">{sem.sgpa} SGPA</span>
                </div>
                <div className="cb2-gpa-bar-wrap">
                  <motion.div
                    className="cb2-gpa-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Student Profile data parser & component ──────────────────────
function hasProfile(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('roll number') && lower.includes('merit points')
}

function parseProfile(text) {
  const lines = text.split(/\n|(?=•)/g).map(l => l.trim()).filter(Boolean)
  const data = {}

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').replace(/^[•\-*]/, '').trim()
    const parts = clean.split(':')
    if (parts.length >= 2) {
      const key = parts[0].trim().toLowerCase()
      const val = parts.slice(1).join(':').trim()
      if (key.includes('name')) data.name = val
      else if (key.includes('roll number')) data.rollNumber = val
      else if (key.includes('department')) data.department = val
      else if (key.includes('semester')) data.semester = val
      else if (key.includes('merit points')) {
        const m = /(\d+)\s*\(([^)]+)\)/.exec(val)
        if (m) {
          data.meritPoints = parseInt(m[1], 10)
          data.meritTier = m[2]
        } else {
          data.meritPoints = val
        }
      }
      else if (key.includes('contact')) data.contact = val
    }
  }
  return Object.keys(data).length > 0 ? data : null
}

function ProfileCard({ data }) {
  const { name, rollNumber, department, semester, meritPoints, meritTier } = data
  const tierColor = meritTier?.toLowerCase() || 'novice'

  return (
    <div className="cb2-profile-card">
      <div className="cb2-profile-header">
        <div className="cb2-profile-avatar">
          <User size={20} />
        </div>
        <div className="cb2-profile-meta">
          <div className="cb2-profile-name">{name || 'Student Profile'}</div>
          <div className="cb2-profile-roll">{rollNumber || 'N/A'}</div>
        </div>
      </div>
      <div className="cb2-profile-grid">
        <div className="cb2-profile-item">
          <span className="cb2-profile-label">Department</span>
          <span className="cb2-profile-val">{department || 'N/A'}</span>
        </div>
        <div className="cb2-profile-item">
          <span className="cb2-profile-label">Semester</span>
          <span className="cb2-profile-val">{semester || 'N/A'}</span>
        </div>
        {meritPoints !== undefined && (
          <div className="cb2-profile-item span-2">
            <span className="cb2-profile-label">Academic Standing</span>
            <div className="cb2-profile-tier-wrap">
              <span className={`cb2-profile-tier-badge ${tierColor}`}>
                <Sparkles size={10} />
                {meritTier || 'Standard'} ({meritPoints} pts)
              </span>
            </div>
          </div>
        )}
        {data.contact && (
          <div className="cb2-profile-item span-2">
            <span className="cb2-profile-label">Contact Email</span>
            <span className="cb2-profile-val">{data.contact}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Leave Requests data parser & component ───────────────────────
function hasLeaveRequests(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('recent leaves') || lower.includes('leave requests')
}

function parseLeaveRequests(text) {
  const lines = text.split(/\n/g).map(l => l.trim()).filter(Boolean)
  const leaves = []

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').replace(/^[-•*]/, '').trim()
    const m = /([a-zA-Z\s]+)\s*\(([^)]+)\)\s*:\s*([a-zA-Z\s]+)/.exec(clean)
    if (m) {
      leaves.push({ type: m[1].trim(), dates: m[2].trim(), status: m[3].trim() })
    }
  }
  return leaves.length > 0 ? leaves : null
}

function LeaveRequestsCard({ leaves }) {
  return (
    <div className="cb2-leaves-card">
      <div className="cb2-leaves-header">
        <span className="cb2-leaves-title">Recent Leave Requests</span>
      </div>
      <div className="cb2-leaves-list">
        {leaves.map((leave, i) => {
          const statusCls = leave.status.toLowerCase()
          return (
            <div key={i} className="cb2-leave-item">
              <div className="cb2-leave-info">
                <span className="cb2-leave-type">{leave.type}</span>
                <span className="cb2-leave-dates">{leave.dates}</span>
              </div>
              <span className={`cb2-leave-status ${statusCls}`}>
                {leave.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Exam Schedule data parser & component ────────────────────────
function hasExamSchedule(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('upcoming exams') || lower.includes('exam schedule')
}

function parseExamSchedule(text) {
  const lines = text.split(/\n|(?=•)/g).map(l => l.trim()).filter(Boolean)
  const exams = []

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').replace(/^[•\-*]/, '').trim()
    const m = /(\d{4}-\d{2}-\d{2})\s*:\s*(.+?)\s*\((.+?)\)\s*@\s*(.+)/.exec(clean)
    if (m) {
      exams.push({ date: m[1], subject: m[2].trim(), type: m[3].trim(), venue: m[4].trim() })
    }
  }
  return exams.length > 0 ? exams : null
}

function ExamScheduleCard({ exams }) {
  return (
    <div className="cb2-exams-card">
      <div className="cb2-exams-header">
        <span className="cb2-exams-title">Upcoming Exam Schedule</span>
      </div>
      <div className="cb2-exams-list">
        {exams.map((exam, i) => (
          <div key={i} className="cb2-exam-item">
            <div className="cb2-exam-date-box">
              <Clock size={11} className="cb2-exam-icon" />
              <span>{exam.date}</span>
            </div>
            <div className="cb2-exam-details">
              <span className="cb2-exam-subj">{exam.subject}</span>
              <div className="cb2-exam-subdetails">
                <span className="cb2-exam-type">{exam.type}</span>
                <span className="cb2-exam-venue">📍 {exam.venue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Holiday data parser & component ──────────────────────────────
function hasHoliday(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('next holiday')
}

function parseHoliday(text) {
  const clean = text.replace(/\*/g, '').replace(/^[-•*]/, '').trim()
  const m = /next\s+holiday\s*:\s*(.+?)\s*\(([^)]+)\)\s*(?:\[([^\]]+)\])?/i.exec(clean)
  if (m) {
    return { name: m[1].trim(), date: m[2].trim(), type: m[3] ? m[3].trim() : 'Holiday' }
  }
  return null
}

function HolidayCard({ data }) {
  const { name, date, type } = data
  return (
    <div className="cb2-holiday-card">
      <div className="cb2-holiday-badge">{type}</div>
      <div className="cb2-holiday-icon">📅</div>
      <div className="cb2-holiday-info">
        <span className="cb2-holiday-title">{name}</span>
        <span className="cb2-holiday-date">{date}</span>
      </div>
    </div>
  )
}

// ── Uncovered Absences data parser & component ───────────────────
function hasUncoveredAbsences(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('uncovered absences')
}

function parseUncoveredAbsences(text) {
  const lines = text.split(/\n/g).map(l => l.trim()).filter(Boolean)
  const absences = []

  for (const line of lines) {
    const clean = line.replace(/\*/g, '').replace(/^[-•*]/, '').trim()
    const m = /(\d{4}-\d{2}-\d{2})\s*:\s*(.+?)\s*(?:\(Hour\s*(\d+)\))?$/i.exec(clean)
    if (m) {
      absences.push({ date: m[1], subject: m[2].trim(), hour: m[3] ? parseInt(m[3], 10) : null })
    }
  }
  return absences.length > 0 ? absences : null
}

function UncoveredAbsencesCard({ absences }) {
  return (
    <div className="cb2-uncovered-card">
      <div className="cb2-uncovered-header">
        <AlertTriangle size={14} />
        <span className="cb2-uncovered-title">Uncovered Absences</span>
      </div>
      <p className="cb2-uncovered-desc">
        The following absences do not have approved ODs applied. Please submit OD requests to avoid attendance penalties:
      </p>
      <div className="cb2-uncovered-list">
        {absences.map((abs, i) => (
          <div key={i} className="cb2-uncovered-item">
            <span className="cb2-uncovered-date">{abs.date}</span>
            <span className="cb2-uncovered-subj">
              {abs.subject} {abs.hour ? `(Hour ${abs.hour})` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Attendance Simulation data parser & component ────────────────
function hasSimulation(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('attendance of') && lower.includes('reduce your attendance to') && lower.includes('classes per day')
}

function parseSimulation(text) {
  const currentPctMatch = /current\s+attendance\s+of\s+(\d+(?:\.\d+)?)/i.exec(text)
  const classesPerDayMatch = /timetable\s+of\s+(\d+)\s+class/i.exec(text)
  const daysMatch = /missing\s+(\d+)\s+day/i.exec(text)
  const classesMatch = /missing\s+\d+\s+day(?:s)?\s*\((\d+)\s+class/i.exec(text)
  const newPctMatch = /reduce\s+your\s+attendance\s+to\s+(\d+(?:\.\d+)?)/i.exec(text)
  const reqMatch = /above\s+the\s+(\d+(?:\.\d+)?)/i.exec(text) || /below\s+the\s+(\d+(?:\.\d+)?)/i.exec(text) || /requirement\s+of\s+(\d+(?:\.\d+)?)/i.exec(text) || /(\d+(?:\.\d+)?)\s*%\s*requirement/i.exec(text)

  const currentPct = currentPctMatch ? parseFloat(currentPctMatch[1]) : 86.5
  const classesPerDay = classesPerDayMatch ? parseInt(classesPerDayMatch[1]) : 2
  const days = daysMatch ? parseInt(daysMatch[1]) : 2
  const classes = classesMatch ? parseInt(classesMatch[1]) : 4
  const newPct = newPctMatch ? parseFloat(newPctMatch[1]) : 86.1
  const reqPct = reqMatch ? parseFloat(reqMatch[1]) : 75.0
  const isSafe = newPct >= reqPct

  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(Boolean)
  const preamble = paragraphs[0]
  const conclusion = paragraphs[1] || ''

  return { currentPct, classesPerDay, days, classes, newPct, reqPct, isSafe, preamble, conclusion }
}

function SimulationCard({ data }) {
  const { currentPct, classesPerDay, days, classes, newPct, reqPct, isSafe, conclusion } = data
  const statusCls = isSafe ? 'safe' : 'risky'

  return (
    <motion.div 
      className={`cb2-simulation-card ${statusCls}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="cb2-sim-header">
        <div className="cb2-sim-icon-wrap">
          {isSafe ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div className="cb2-sim-title-group">
          <span className="cb2-sim-title">Attendance Leave Simulation</span>
          <span className="cb2-sim-subtitle">Simulating {days} days off ({classes} classes)</span>
        </div>
      </div>

      <div className="cb2-sim-grid">
        <div className="cb2-sim-grid-item">
          <span className="cb2-sim-grid-label">Current</span>
          <span className="cb2-sim-grid-val">{currentPct}%</span>
        </div>
        <div className="cb2-sim-grid-item projected">
          <span className="cb2-sim-grid-label">Projected</span>
          <span className="cb2-sim-grid-val">{newPct}%</span>
        </div>
      </div>

      <div className="cb2-sim-slider-wrap">
        <div className="cb2-sim-slider-labels">
          <span>Min Required: {reqPct}%</span>
          <span style={{ color: isSafe ? '#10b981' : '#ef4444' }}>Projected: {newPct}%</span>
        </div>
        <div className="cb2-sim-slider-bar">
          <div className="cb2-sim-slider-threshold" style={{ left: `${reqPct}%` }} title={`Required minimum: ${reqPct}%`} />
          <div className="cb2-sim-slider-current-marker" style={{ left: `${currentPct}%` }} title={`Current: ${currentPct}%`} />
          <motion.div 
            className="cb2-sim-slider-fill"
            initial={{ width: 0 }}
            animate={{ width: `${newPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {conclusion && (
        <div className="cb2-sim-conclusion">
          {conclusion}
        </div>
      )}
    </motion.div>
  )
}

// ── Smart BotMessage — detects structured data and renders cards ────
function BotMessage({ text }) {
  if (!text) return <p className="cb2-para">No response received.</p>

  // Try combined Overall Performance card FIRST (attendance + CGPA together)
  if (hasOverallPerformance(text)) {
    const data = parseOverallPerformance(text)
    if (data) return <OverallPerformanceCard data={data} />
  }

  // Try parsing attendance simulation
  if (hasSimulation(text)) {
    const data = parseSimulation(text)
    if (data) return <SimulationCard data={data} />
  }

  // Try parsing overall attendance summary
  if (hasOverallAttendance(text)) {
    const data = parseOverallAttendance(text)
    if (data) return <OverallAttendanceCard data={data} />
  }

  // Try parsing GPA Summary
  if (hasGPASummary(text)) {
    const data = parseGPASummary(text)
    if (data) return <GPASummaryCard data={data} />
  }

  // Try parsing Student Profile
  if (hasProfile(text)) {
    const data = parseProfile(text)
    if (data) return <ProfileCard data={data} />
  }

  // Try parsing Leave Requests
  if (hasLeaveRequests(text)) {
    const data = parseLeaveRequests(text)
    if (data) return <LeaveRequestsCard leaves={data} />
  }

  // Try parsing Exam Schedule
  if (hasExamSchedule(text)) {
    const data = parseExamSchedule(text)
    if (data) return <ExamScheduleCard exams={data} />
  }

  // Try parsing Holiday
  if (hasHoliday(text)) {
    const data = parseHoliday(text)
    if (data) return <HolidayCard data={data} />
  }

  // Try parsing Uncovered Absences
  if (hasUncoveredAbsences(text)) {
    const data = parseUncoveredAbsences(text)
    if (data) return <UncoveredAbsencesCard absences={data} />
  }

  // Split text into preamble (non-data lines) and data lines
  if (hasStructuredData(text)) {
    const allLines = text.split(/\n|(?=•)/g).map(l => l.trim()).filter(Boolean)
    const preambleLines = []
    const dataLines = []
    let inData = false
    for (const line of allLines) {
      const isData = (ATT_LINE_RE.test(line) || MARKS_LINE_RE.test(line) || ELIGIBILITY_LINE_RE.test(line) || BUNK_LINE_RE.test(line) || LOW_MARKS_LINE_RE.test(line)) && !/overall\s+attendance/i.test(line)
      if (isData) { inData = true; dataLines.push(line) }
      else if (!inData) preambleLines.push(line)
    }
    const rows = parseAttendanceLines(dataLines.join('\n'))
    const preamble = preambleLines.join(' ').replace(/^[•\-*]/, '').trim()
    if (rows.length > 0) {
      return <AttendanceCard rows={rows} preamble={preamble || null} />
    }
  }

  // Default markdown renderer
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer" className="cb2-link">{children}</a>
        ),
        strong: ({ children }) => <strong className="cb2-strong">{children}</strong>,
        ul: ({ children }) => <ul className="cb2-list">{children}</ul>,
        li: ({ children }) => <li className="cb2-list-item"><span className="cb2-bullet" />{children}</li>,
        p: ({ children }) => <p className="cb2-para">{children}</p>,
        code: ({ children }) => <code className="cb2-code">{children}</code>,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

// ── Streaming Cursor ───────────────────────────────────────────────
function StreamCursor() {
  return (
    <motion.span
      className="cb2-stream-cursor"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ repeat: Infinity, duration: 0.7 }}
    >▋</motion.span>
  )
}

// ── Action Buttons ─────────────────────────────────────────────────
function ActionButtons({ actions, onAction }) {
  if (!actions || actions.length === 0) return null
  return (
    <div className="cb2-actions">
      {actions.map((action, idx) => (
        <motion.button
          key={`${action.label}-${idx}`}
          className={`cb2-action-btn ${action.category || ''}`}
          onClick={() => onAction(action)}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
        >
          {action.label}
          {action.action === 'navigate'
            ? <ExternalLink size={11} className="ml-1 opacity-60" />
            : <ChevronRight size={11} className="ml-1 opacity-60" />}
        </motion.button>
      ))}
    </div>
  )
}

// ── Typing Indicator ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      className="cb2-message bot"
      variants={botVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="cb2-avatar bot">
        <ChatbotLogo size={18} />
      </div>
      <div className="cb2-bubble bot typing-bubble" aria-live="polite">
        <div className="cb2-typing-row">
          <span className="cb2-typing-label">Analyzing</span>
          <div className="cb2-typing-dots">
            {[0, 0.18, 0.36].map((delay, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.9, delay }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Prompt Sets ────────────────────────────────────────────────────
const promptSets = {
  attendance: [
    ['which classes did i miss today', 'Missed today', 'attendance'],
    ['show my missed classes this week', 'This week', 'attendance'],
    ['how many classes can i miss', 'Can miss', 'attendance'],
    ['which subject did i miss most', 'Most missed', 'attendance'],
  ],
  results: [
    ['what is my weakest subject', 'Weakest', 'results'],
    ['what is my best subject', 'Best', 'results'],
    ['what is my latest sgpa', 'SGPA', 'results'],
    ['compare my semester performance', 'Trend', 'results'],
  ],
  calendar: [
    ['when is the next holiday', 'Next holiday', 'calendar'],
    ['is tomorrow a working day', 'Tomorrow', 'calendar'],
    ['show holidays this month', 'This month', 'calendar'],
    ['how many working hours are there on 24 April', 'Hours', 'calendar'],
  ],
  od: [
    ['which classes did i miss on 10 April for OD', 'OD details', 'od'],
    ['which od have i applied and not applied', 'OD status', 'od'],
    ['show pending medical leave requests', 'Medical', 'od'],
    ['what dates should I mention for my medical leave', 'Dates', 'od'],
  ],
  dashboard: [
    ['which classes did i miss today', 'Missed today', 'attendance'],
    ['when is the next holiday', 'Next holiday', 'calendar'],
    ['what is my weakest subject', 'Weakest', 'results'],
    ['explain my eligibility status', 'Eligibility', 'attendance'],
  ],
  faculty: [
    ['show my timetable', 'Timetable', 'calendar'],
    ['which students are at risk', 'At Risk', 'attendance'],
    ['show attendance statistics', 'Statistics', 'attendance'],
    ['view pending leave requests', 'Leaves', 'od'],
  ],
  hod: [
    ['show department overview', 'Overview', 'results'],
    ['faculty performance analytics', 'Faculty', 'results'],
    ['analyze student risk trends', 'Risk Trends', 'attendance'],
    ['approve pending documents', 'Approvals', 'od'],
  ],
}

// ── Date Divider ───────────────────────────────────────────────────
function DateDivider({ label }) {
  return (
    <div className="cb2-date-divider">
      <span>{label}</span>
    </div>
  )
}

// ── Get Related Actions Based on Message Text & User Role ──────────
function getRelatedActions(msg, role = 'student') {
  const actions = [...(msg.actions || [])]
  if (!msg.text) return actions
  const textUpper = msg.text.toUpperCase()
  
  const hasAction = (label) => actions.some(a => a.label.toLowerCase().includes(label.toLowerCase()))
  
  if (role === 'student') {
    if (textUpper.includes("ATTENDANCE") || textUpper.includes("BUNK") || textUpper.includes("PRESENT") || textUpper.includes("ABSENT")) {
      if (!hasAction("Attendance")) {
        actions.push({ label: "View Attendance", action: "navigate", payload: "/attendance" })
      }
    }
    if (textUpper.includes("EXAM") || textUpper.includes("SCHEDULE") || textUpper.includes("TEST")) {
      if (!hasAction("Exam")) {
        actions.push({ label: "Check Exams", action: "navigate", payload: "/exams" })
      }
    }
    if (textUpper.includes("LEAVE") || textUpper.includes("OD") || textUpper.includes("ON DUTY") || textUpper.includes("ON-DUTY")) {
      if (!hasAction("OD") && !hasAction("Leave")) {
        actions.push({ label: "Apply for OD", action: "navigate", payload: "/leave" })
      }
    }
    if (textUpper.includes("CGPA") || textUpper.includes("GPA") || textUpper.includes("MARKS") || textUpper.includes("RESULTS")) {
      if (!hasAction("Performance") && !hasAction("Marks") && !hasAction("CGPA") && !hasAction("GPA")) {
        actions.push({ label: "Check Performance", action: "navigate", payload: "/performance" })
      }
    }
  } else if (role === 'faculty' || role === 'hod') {
    if (textUpper.includes("ATTENDANCE") || textUpper.includes("ROSTER") || textUpper.includes("STUDENT")) {
      if (!hasAction("Attendance") && !hasAction("Roster")) {
        actions.push({ label: "Roster", action: "navigate", payload: "/faculty/attendance" })
      }
    }
    if (textUpper.includes("MARK") || textUpper.includes("GRADE") || textUpper.includes("ACADEMIA")) {
      if (!hasAction("Academia") && !hasAction("Marks")) {
        actions.push({ label: "Academia Marks", action: "navigate", payload: "/faculty/marks" })
      }
    }
    if (textUpper.includes("LOG") || textUpper.includes("DIARY") || textUpper.includes("LECTURE")) {
      if (!hasAction("Diary") && !hasAction("Log")) {
        actions.push({ label: "Lecture Diary", action: "navigate", payload: "/faculty/lecture-logs" })
      }
    }
    if (textUpper.includes("LEAVE") || textUpper.includes("REQUEST") || textUpper.includes("OD")) {
      if (!hasAction("Request") && !hasAction("Leave")) {
        actions.push({ label: "Requests", action: "navigate", payload: "/faculty/leaves" })
      }
    }
  } else if (role === 'admin') {
    if (textUpper.includes("STUDENT")) {
      if (!hasAction("Student")) {
        actions.push({ label: "Manage Students", action: "navigate", payload: "/admin/students" })
      }
    }
    if (textUpper.includes("FACULTY") || textUpper.includes("TEACHER")) {
      if (!hasAction("Faculty")) {
        actions.push({ label: "Manage Faculty", action: "navigate", payload: "/admin/faculty" })
      }
    }
    if (textUpper.includes("ANALYTICS") || textUpper.includes("INTEL") || textUpper.includes("PERFORMANCE")) {
      if (!hasAction("Intel") && !hasAction("Analytics")) {
        actions.push({ label: "Intel Analytics", action: "navigate", payload: "/admin/analytics" })
      }
    }
  }
  
  return actions
}

// ── Main ChatBox ───────────────────────────────────────────────────
export default function ChatBox({ onNewChat, resetToken = 0, className = '', contextPage = 'dashboard', compact = false }) {
  const role = useAuthStore(state => state.role) || 'student'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [welcomeData, setWelcomeData] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const navigate = useNavigate()
  const chatEndRef = useRef(null)
  const hasMountedRef = useRef(false)
  const currentMetaRef = useRef(null)
  const textareaRef = useRef(null)
  const streamTargetTextRef = useRef('')
  const streamDisplayedTextRef = useRef('')
  const streamTimerRef = useRef(null)
  const streamRequestDoneRef = useRef(false)
  const botMessageIdRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current)
    }
  }, [])

  useEffect(() => { loadInitialChats() }, [])

  useEffect(() => {
    if (!hasMountedRef.current) { hasMountedRef.current = true; return }
    setMessages([{ id: `reset-${Date.now()}`, sender: 'bot', text: 'Chat history cleared. Ask me anything about your academic data.', timestamp: new Date() }])
  }, [resetToken])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function loadInitialChats() {
    setLoadingHistory(true)
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    try {
      // ── Step 1: Load chat history FAST — clears the spinner immediately ──
      const history = await fetchChatHistory().catch(() => [])
      const formatted = []
      history.slice().reverse().slice(-10).forEach((item) => {
        formatted.push({ id: `h-u-${Math.random()}`, sender: 'user', text: item.query, timestamp: new Date(item.date) })
        formatted.push({ id: `h-b-${Math.random()}`, sender: 'bot',  text: item.response, timestamp: new Date(item.date) })
      })

      if (formatted.length > 0) {
        // Has history: show it right away, no welcome needed
        setMessages(formatted)
      } else {
        // No history: show a fast static placeholder while AI welcome loads
        setMessages([{
          id: `welcome-placeholder-${Date.now()}`,
          sender: 'bot',
          text: `✨ **${greeting}!** I'm **Studvisor AI**, your premium ERP assistant.\n\nType **help** to see everything I can do for you!`,
          timestamp: new Date(),
        }])
      }
    } catch {
      setMessages([{ id: 'err', sender: 'bot', text: 'Unable to load previous chat history.', timestamp: new Date() }])
    } finally {
      // ── Spinner off: user sees the chat immediately ──
      setLoadingHistory(false)
    }

    // ── Step 2: Fetch AI welcome in the background (non-blocking) ──
    try {
      const welcome = await fetchChatWelcome()
      if (!welcome) return
      setWelcomeData(welcome)
      const isFaculty = welcome.message?.toLowerCase().includes('professor') || welcome.message?.toLowerCase().includes('faculty')

      // Only replace the placeholder welcome message, not real chat history
      setMessages(prev => {
        const hasHistory = prev.some(m => m.id?.startsWith('h-'))
        if (hasHistory) return prev  // Don't overwrite real history
        return [{
          id: `welcome-${Date.now()}`,
          sender: 'bot',
          text: `✨ **${greeting}!** ${welcome.message}`,
          actions: welcome.actions,
          protocol: isFaculty ? 'Staff AI Ensemble' : 'Studvisor AI',
          timestamp: new Date(),
        }]
      })
    } catch {
      // Welcome fetch failed silently — placeholder message stays
    }
  }

  async function handleAction(action) {
    if (action.action === 'navigate') {
      navigate(action.payload)
    } else if (action.query) {
      setInput(action.query)
      setTimeout(() => document.getElementById('cb2-send-btn')?.click(), 10)
    }
  }

  function startTypingAnimation(botMessageId) {
    botMessageIdRef.current = botMessageId
    streamTargetTextRef.current = ''
    streamDisplayedTextRef.current = ''
    streamRequestDoneRef.current = false
    
    if (streamTimerRef.current) clearInterval(streamTimerRef.current)
    
    const startTime = Date.now()
    const minThinkingTime = 800 // ms thinking delay
    let hasStartedTyping = false

    streamTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      
      // 1. Enforce thinking delay: show typing indicator for at least minThinkingTime
      if (elapsed < minThinkingTime) {
        return
      }

      const target = streamTargetTextRef.current
      const displayed = streamDisplayedTextRef.current

      // 2. Hide typing indicator when there is text ready to type
      if (!hasStartedTyping && target) {
        hasStartedTyping = true
        setShowTyping(false)
      }

      // 3. Check if we have caught up
      if (displayed === target) {
        if (streamRequestDoneRef.current) {
          clearInterval(streamTimerRef.current)
          streamTimerRef.current = null
          setSending(false)
          setShowTyping(false)
          setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, streaming: false } : m))
        }
        return
      }

      // 4. Typing incremental calculation
      const remaining = target.slice(displayed.length)
      if (!remaining) return

      let nextChunk = ''
      if (remaining.startsWith('\n')) {
        nextChunk = '\n'
      } else if (remaining.startsWith(' ')) {
        nextChunk = ' '
      } else {
        const nextSpaceIdx = remaining.search(/\s/)
        if (nextSpaceIdx === -1) {
          nextChunk = remaining
        } else if (nextSpaceIdx === 0) {
          nextChunk = remaining[0]
        } else {
          nextChunk = remaining.slice(0, nextSpaceIdx)
        }
      }

      const nextText = displayed + nextChunk
      streamDisplayedTextRef.current = nextText

      setMessages(prev => prev.map(m => {
        if (m.id === botMessageId) {
          return {
            ...m,
            text: nextText,
            streaming: true
          }
        }
        return m
      }))
    }, 45)
  }

  async function handleSend() {
    if (!input.trim() || sending) return
    const userMessage = input.trim()
    const botMessageId = `bot-${Date.now()}`
    currentMetaRef.current = null
    
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: userMessage, timestamp: new Date() }])
    setInput('')
    setSending(true)
    setShowTyping(true)
    textareaRef.current?.focus()

    // Start typing loop
    startTypingAnimation(botMessageId)

    try {
      const streamed = await streamChatMessage(userMessage, {
        contextPage,
        onMeta: (meta) => {
          currentMetaRef.current = meta
          setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, meta } : m))
        },
        onChunk: (_chunk, finalText) => {
          streamTargetTextRef.current = finalText
          
          setMessages(prev => {
            const exists = prev.some(m => m.id === botMessageId)
            if (exists) return prev
            return [...prev, {
              id: botMessageId,
              sender: 'bot',
              text: '',
              streaming: true,
              meta: currentMetaRef.current,
              timestamp: new Date()
            }]
          })
        },
        onDone: (finalText) => {
          streamTargetTextRef.current = finalText
          streamRequestDoneRef.current = true
        },
      })

      if (!streamed.reply) {
        const response = await sendChatMessage(userMessage, contextPage)
        streamTargetTextRef.current = response.reply || 'No reply received.'
        
        setMessages(prev => {
          const exists = prev.some(m => m.id === botMessageId)
          if (exists) {
            return prev.map(m => m.id === botMessageId ? { 
              ...m, 
              meta: response.meta, 
              actions: response.actions, 
              emotion: response.emotion 
            } : m)
          }
          return [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: '',
            streaming: true,
            meta: response.meta,
            actions: response.actions,
            emotion: response.emotion,
            timestamp: new Date(),
          }]
        })
        streamRequestDoneRef.current = true
      }

      onNewChat?.()
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    } catch {
      try {
        const response = await sendChatMessage(userMessage, contextPage)
        streamTargetTextRef.current = response.reply || 'No reply received.'
        
        setMessages(prev => {
          const exists = prev.some(m => m.id === botMessageId)
          if (exists) {
            return prev.map(m => m.id === botMessageId ? { 
              ...m, 
              meta: response.meta, 
              actions: response.actions, 
              emotion: response.emotion 
            } : m)
          }
          return [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: '',
            streaming: true,
            meta: response.meta,
            actions: response.actions,
            emotion: response.emotion,
            timestamp: new Date(),
          }]
        })
        streamRequestDoneRef.current = true
        onNewChat?.()
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } catch {
        streamTargetTextRef.current = 'Failed to connect to the AI backend. Please try again.'
        setMessages(prev => {
          const exists = prev.some(m => m.id === botMessageId)
          if (exists) return prev
          return [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: '',
            streaming: true,
            timestamp: new Date(),
          }]
        })
        streamRequestDoneRef.current = true
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const chips = welcomeData?.actions || promptSets[contextPage] || promptSets.dashboard

  return (
    <div className={`cb2-shell ${compact ? 'cb2-compact' : ''} ${className}`}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="cb2-header">
        <div className="cb2-header-left">
          <div className="cb2-header-avatar">
            <ChatbotLogo size={compact ? 18 : 22} />
            <span className="cb2-online-dot" />
          </div>
          {!compact && (
            <div>
              <div className="cb2-header-title">Studvisor AI</div>
              <div className="cb2-header-sub">
                <Sparkles size={9} />
                Intelligence Ensemble · Online
              </div>
            </div>
          )}
        </div>

        {/* Quick Chips */}
        <div className="cb2-chips-row scrollbar-hide">
          {chips.map((item, i) => {
            const prompt    = Array.isArray(item) ? item[0] : item.query
            const label     = Array.isArray(item) ? item[1] : item.label
            const category  = Array.isArray(item) ? item[2] : item.category
            return (
              <motion.button
                key={`${prompt}-${i}`}
                type="button"
                className={`cb2-chip ${category || ''}`}
                onClick={() => handleAction(Array.isArray(item) ? { query: prompt } : item)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="cb2-window custom-scrollbar">
        {loadingHistory && (
          <div className="cb2-loader-row">
            <motion.div
              className="cb2-loader-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
            <span>Syncing your academic profile…</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isBot  = msg.sender === 'bot'
            const isUser = msg.sender === 'user'
            const prevMsg = messages[idx - 1]
            const showDate = !prevMsg || (msg.timestamp && prevMsg.timestamp && new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString())

            return (
              <motion.div key={msg.id || `${msg.sender}-${idx}`} layout>
                {showDate && msg.timestamp && <DateDivider label={new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} />}

                <motion.div
                  className={`cb2-message ${msg.sender}`}
                  variants={isBot ? botVariants : userVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Avatar */}
                  <div className={`cb2-avatar ${msg.sender}`}>
                    {isBot ? <ChatbotLogo size={18} /> : <User size={15} />}
                  </div>

                  {/* Bubble */}
                  <div className="cb2-bubble-wrap">
                    {isBot && msg.emotion && <EmotionStrip emotion={msg.emotion} />}
                    <div className={`cb2-bubble ${msg.sender} ${msg.streaming ? 'streaming' : ''} markdown-body`}>
                      {isBot ? (
                        <>
                          <BotMessage text={msg.text} />
                          {msg.streaming && <StreamCursor />}
                          <ActionButtons actions={getRelatedActions(msg, role)} onAction={handleAction} />
                          <div className="cb2-bubble-footer">
                            <ProviderBadge meta={msg.meta} />
                            {!msg.streaming && <CopyBtn text={msg.text} />}
                          </div>
                        </>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                    {msg.timestamp && (
                      <div className={`cb2-timestamp ${msg.sender}`}>
                        <Clock size={9} />
                        {formatTime(new Date(msg.timestamp))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
          {showTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────── */}
      <div className={`cb2-input-wrap ${inputFocused ? 'focused' : ''}`}>
        <textarea
          ref={textareaRef}
          className="cb2-textarea"
          placeholder="Ask about attendance, marks, eligibility…"
          value={input}
          rows={compact ? 1 : 2}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        <div className="cb2-input-actions">
          <button
            type="button"
            className="cb2-mic-btn"
            aria-label="Voice input"
            title="Voice input (coming soon)"
          >
            <Mic size={15} />
          </button>
          <motion.button
            id="cb2-send-btn"
            className={`cb2-send-btn ${sending ? 'sending' : ''}`}
            onClick={handleSend}
            disabled={sending || !input.trim()}
            whileHover={!sending ? { scale: 1.06, y: -1 } : {}}
            whileTap={!sending ? { scale: 0.94 } : {}}
            aria-label="Send message"
          >
            {sending ? (
              <motion.div
                className="cb2-send-spinner"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              />
            ) : (
              <SendHorizonal size={16} />
            )}
            <span>{sending ? 'Thinking…' : 'Send'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
