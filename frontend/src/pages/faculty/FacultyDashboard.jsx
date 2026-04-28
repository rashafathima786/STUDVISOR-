import { useState, useEffect } from 'react'
import ClassroomStream from '../../components/faculty/ClassroomStream'
import { fetchFacultyDashboard, fetchFacultyTimetable, fetchFacultyPendingLeaves, fetchAttendanceDefaulters } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import StatCard from '../../components/StatCard'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { Users, ClipboardList, PenTool, AlertTriangle, Clock, BookOpen } from 'lucide-react'

export default function FacultyDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchFacultyDashboard().catch(() => null),
      fetchFacultyTimetable().catch(() => ({ timetable: [] })),
      fetchFacultyPendingLeaves().catch(() => ({ pending: [] })),
      fetchAttendanceDefaulters().catch(() => ({ defaulters: [] })),
    ]).then(([dash, tt, leaves, defs]) => {
      setDashboard(dash)
      setTimetable(tt?.timetable || [])
      setPendingLeaves(leaves?.pending || [])
      setDefaulters(defs?.defaulters || [])
      setLoading(false)
    })
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  }).split(',')[0]

  const todaySlots = timetable.filter(
    (s) => s.day?.toLowerCase() === today?.toLowerCase()
  )

  if (loading) {
    return (
      <ErpLayout title="Faculty Dashboard" subtitle="Loading...">
        <div className="stat-grid-3">
          <SkeletonLoader variant="card" count={3} />
        </div>
        <SkeletonLoader variant="chart" />
      </ErpLayout>
    )
  }

  return (
    <ErpLayout
      title={`Welcome, ${dashboard?.name || 'Faculty'}`}
      subtitle={`${dashboard?.department || ''} Department`}
    >
      <div className="stat-grid-3">
        <StatCard
          title="Subjects Teaching"
          value={dashboard?.subjects_count || 0}
          icon={<BookOpen size={20} />}
          accentColor="var(--accent)"
          subtitle="This semester"
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves.length}
          icon={<PenTool size={20} />}
          accentColor="var(--warning)"
          subtitle="Awaiting your action"
          href="/faculty/leaves"
        />
        <StatCard
          title="At-Risk Students"
          value={defaulters.length}
          icon={<AlertTriangle size={20} />}
          accentColor="var(--danger)"
          subtitle="Below 75% attendance"
        />
      </div>

        {/* ── Google Classroom Style Hub ── */}
        <div style={{ marginTop: '24px' }}>
          <ClassroomStream />
        </div>

      {/* Pending Leave Requests Preview */}
      {pendingLeaves.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 className="section-title">
            <PenTool size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Recent Leave Requests
          </h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.slice(0, 5).map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.student}</td>
                    <td>
                      <span className="pill-badge" style={{ background: 'var(--info-soft)', color: 'var(--info-text)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        {l.type}
                      </span>
                    </td>
                    <td>{l.from}</td>
                    <td>{l.to}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ErpLayout>
  )
}
