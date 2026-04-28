import { useState, useEffect } from 'react'
import { markAttendance, fetchAllStudents } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { UserCheck, Check, X, RotateCcw } from 'lucide-react'

export default function FacultyAttendance() {
  const [students, setStudents] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hour, setHour] = useState(1)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchAllStudents()
      .then((res) => {
        const list = res?.students || []
        setStudents(list)
        // Initialize all as Present
        const init = {}
        list.forEach((s) => (init[s.id] = 'P'))
        setAttendance(init)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleStatus = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'P' ? 'A' : prev[studentId] === 'A' ? 'DL' : 'P',
    }))
  }

  const setAll = (status) => {
    const next = {}
    students.forEach((s) => (next[s.id] = status))
    setAttendance(next)
  }

  const handleSubmit = async () => {
    if (!subjectId) {
      toast.warning('Please enter a Subject ID')
      return
    }
    setSubmitting(true)
    try {
      const entries = Object.entries(attendance).map(([sid, status]) => ({
        student_id: parseInt(sid),
        status,
      }))
      await markAttendance({
        subject_id: parseInt(subjectId),
        date,
        hour,
        entries,
      })
      toast.success(`Attendance marked for ${entries.length} students`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = Object.values(attendance).filter((v) => v === 'P').length
  const absentCount = Object.values(attendance).filter((v) => v === 'A').length

  return (
    <ErpLayout title="Mark Attendance" subtitle="Record student attendance for a class session">
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="section-title">
          <UserCheck size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Session Details
        </h3>
        <div className="attendance-controls">
          <div className="input-group">
            <label>Subject ID</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 1"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Hour</label>
            <select
              className="form-input"
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                <option key={h} value={h}>Hour {h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="attendance-bulk-actions">
          <button className="outline-btn" onClick={() => setAll('P')}>
            <Check size={14} /> All Present
          </button>
          <button className="outline-btn" onClick={() => setAll('A')}>
            <X size={14} /> All Absent
          </button>
          <button className="outline-btn" onClick={() => setAll('DL')}>
            <RotateCcw size={14} /> All Duty Leave
          </button>
          <div className="attendance-summary-pills">
            <span className="pill-badge" style={{ background: 'var(--success-soft)', color: 'var(--success-text)' }}>
              P: {presentCount}
            </span>
            <span className="pill-badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)' }}>
              A: {absentCount}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <SkeletonLoader variant="table-row" count={8} />
        ) : students.length === 0 ? (
          <EmptyState title="No students found" description="No students are registered in the system." />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const status = attendance[s.id] || 'P'
                    return (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.department}</td>
                        <td>{s.semester}</td>
                        <td>
                          <button
                            className={`attendance-toggle-btn att-${status}`}
                            onClick={() => toggleStatus(s.id)}
                          >
                            {status}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="primary-btn compact-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </ErpLayout>
  )
}
