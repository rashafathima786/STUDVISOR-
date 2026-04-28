import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Calendar, UserCheck, Zap, Activity, Target, Flame, AlertTriangle, BarChart3, Award, ChevronRight, ArrowUpRight } from 'lucide-react'
import DonutChart from '../ui/DonutChart'
import Sparkline from '../ui/Sparkline'
import ProgressBar from '../ui/ProgressBar'

export function ProfileCard({ profile, marks }) {
  return (
    <div className="nx-card nx-card--profile nx-span-2">
      <div className="nx-card__mesh" />
      <div className="nx-profile-row">
        <div className="nx-avatar-ring">
          <div className="nx-avatar">{profile?.name?.[0] || 'S'}</div>
        </div>
        <div className="nx-profile-info">
          <h2>{profile?.name || 'Student'}</h2>
          <div className="nx-profile-meta">
            <span className="nx-tag"><GraduationCap size={13} /> {profile?.department || 'CSE'}</span>
            <span className="nx-tag"><Calendar size={13} /> Semester {profile?.semester || 3}</span>
            <span className="nx-tag"><UserCheck size={13} /> {profile?.student_id || '0000'}</span>
          </div>
        </div>
        <div className="nx-profile-actions">
          <Link to="/hub" className="nx-btn nx-btn--primary">
            <Zap size={15} /> Campus Hub
          </Link>
        </div>
      </div>

      <div className="nx-profile-stats">
        <div className="nx-pstat">
          <span className="nx-pstat-val" style={{ color: '#8b5cf6' }}>{profile?.merit_points || 0}</span>
          <span className="nx-pstat-label">Merit Points</span>
        </div>
        <div className="nx-pstat-divider" />
        <div className="nx-pstat">
          <span className="nx-pstat-val" style={{ color: '#22c55e' }}>{profile?.merit_tier || 'Novice'}</span>
          <span className="nx-pstat-label">Shield Tier</span>
        </div>
        <div className="nx-pstat-divider" />
        <div className="nx-pstat">
          <span className="nx-pstat-val" style={{ color: '#3b82f6' }}>{marks?.length || 0}</span>
          <span className="nx-pstat-label">Active Courses</span>
        </div>
      </div>
    </div>
  )
}

export function AttendanceWidget({ overallAtt, attColor, sparkData }) {
  return (
    <div className="nx-card nx-card--glass">
      <div className="nx-card-head">
        <span className="nx-card-label">Attendance</span>
        <Activity size={16} className="nx-card-icon" />
      </div>
      <DonutChart value={overallAtt} color={attColor} label="Overall" />
      <Sparkline data={sparkData} color={attColor} />
    </div>
  )
}

export function BunkBudgetWidget({ bunkData }) {
  return (
    <div className="nx-card nx-card--glass">
      <div className="nx-card-head">
        <span className="nx-card-label">Bunk Budget</span>
        <Target size={16} className="nx-card-icon" />
      </div>
      <div className="nx-big-num">{bunkData?.can_miss || 0}</div>
      <span className="nx-big-sub">classes you can safely skip</span>
      <Link to="/attendance" className="nx-link">Open Simulator <ArrowUpRight size={13} /></Link>
    </div>
  )
}

export function MeritWidget({ meritData, profile }) {
  return (
    <div className="nx-card nx-card--glass">
      <div className="nx-card-head">
        <span className="nx-card-label">Merit Score</span>
        <Flame size={16} className="nx-card-icon" style={{ color: '#f97316' }} />
      </div>
      <div className="nx-big-num" style={{ color: '#f97316' }}>{meritData?.score || profile?.merit_points || 0}</div>
      <span className="nx-big-sub">{meritData?.tier || profile?.merit_tier || 'Novice'} tier</span>
      <ProgressBar value={meritData?.score || profile?.merit_points || 0} max={500} color="#f97316" />
    </div>
  )
}

export function DangerAlertsWidget({ bunkData }) {
  if (!bunkData?.danger_subjects?.length) return null;
  return (
    <div className="nx-card nx-card--danger nx-span-2">
      <div className="nx-card-head">
        <span className="nx-card-label"><AlertTriangle size={15} /> Attendance Alerts</span>
      </div>
      <div className="nx-alert-list">
        {bunkData.danger_subjects.map(sub => (
          <div key={sub.subject} className="nx-alert-row">
            <div className="nx-alert-info">
              <strong>{sub.subject}</strong>
              <span>Need {sub.classes_needed} more classes</span>
            </div>
            <div className={`nx-alert-pct ${sub.severity === 'critical' ? 'critical' : 'warn'}`}>
              {sub.current_percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SubjectBreakdownWidget({ bunkData }) {
  return (
    <div className="nx-card nx-span-2">
      <div className="nx-card-head">
        <span className="nx-card-label"><BarChart3 size={15} /> Subject Breakdown</span>
        <Link to="/attendance" className="nx-link-sm">View All <ChevronRight size={14} /></Link>
      </div>
      <div className="nx-subject-bars">
        {bunkData?.subject_details?.slice(0, 6).map(sub => (
          <ProgressBar
            key={sub.subject}
            value={sub.percentage}
            color={sub.percentage >= 85 ? '#22c55e' : sub.percentage >= 75 ? '#eab308' : '#ef4444'}
            label={sub.subject}
          />
        ))}
        {!bunkData?.subject_details?.length && <p className="nx-empty-text">No attendance data yet</p>}
      </div>
    </div>
  )
}

export function RecentResultsWidget({ marks }) {
  return (
    <div className="nx-card nx-span-2">
      <div className="nx-card-head">
        <span className="nx-card-label"><Award size={15} /> Recent Results</span>
        <Link to="/results" className="nx-link-sm">All Results <ChevronRight size={14} /></Link>
      </div>
      {marks && marks.length > 0 ? (
        <div className="nx-results-grid">
          {marks.map((m, i) => {
            const pct = m.max_marks ? (m.marks_obtained / m.max_marks * 100) : 0
            const c = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'
            return (
              <div key={i} className="nx-result-chip">
                <div className="nx-result-top">
                  <span className="nx-result-name">{m.subject_name || `Subject ${m.subject_id}`}</span>
                  <span className="nx-result-type">{m.exam_type || m.assessment_type}</span>
                </div>
                <div className="nx-result-score">
                  <span style={{ color: c, fontWeight: 700 }}>{m.marks_obtained}</span>
                  <span className="nx-result-max">/ {m.max_marks}</span>
                </div>
                <ProgressBar value={pct} color={c} />
              </div>
            )
          })}
        </div>
      ) : (
        <p className="nx-empty-text">No recent results published</p>
      )}
    </div>
  )
}
