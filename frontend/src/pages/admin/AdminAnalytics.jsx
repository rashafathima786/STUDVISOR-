import { useState, useEffect } from 'react'
import { fetchAttendanceReport, fetchMoodAnalytics } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const chartStyle = { background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }

export default function AdminAnalytics() {
  const [attReport, setAttReport] = useState([])
  const [moodTrends, setMoodTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAttendanceReport().catch(() => ({ report: [] })),
      fetchMoodAnalytics().catch(() => ({ trends: [] })),
    ]).then(([att, mood]) => {
      setAttReport(att?.report || [])
      setMoodTrends(mood?.trends || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <ErpLayout title="Analytics" subtitle="Loading..."><SkeletonLoader variant="chart" count={2} /></ErpLayout>

  return (
    <ErpLayout title="Analytics" subtitle="Institution-wide performance insights">
      <div className="dashboard-lower-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 className="section-title"><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Attendance by Department</h3>
          {attReport.length === 0 ? <EmptyState title="No data" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attReport}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="department" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip contentStyle={chartStyle} />
                <Bar dataKey="pct" fill="#6366f1" radius={[4, 4, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Student Mood Trends</h3>
          {moodTrends.length === 0 ? <EmptyState title="No mood data" description="Mood check-in data will appear here." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={moodTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} domain={[0, 5]} />
                <Tooltip contentStyle={chartStyle} />
                <Line type="monotone" dataKey="avg_score" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} name="Avg Score" />
                <Line type="monotone" dataKey="at_risk_count" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} name="At-Risk Count" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ErpLayout>
  )
}
