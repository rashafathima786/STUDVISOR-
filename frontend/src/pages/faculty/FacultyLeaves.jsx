import { useState, useEffect } from 'react'
import { fetchFacultyPendingLeaves, approveFacultyLeave, rejectFacultyLeave } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { PenTool, Check, X } from 'lucide-react'

export default function FacultyLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    fetchFacultyPendingLeaves()
      .then((res) => setLeaves(res?.pending || []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    setProcessing(id)
    try {
      await approveFacultyLeave(id)
      toast.success('Leave approved')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed')
    } finally { setProcessing(null) }
  }

  const handleReject = async (id) => {
    setProcessing(id)
    try {
      await rejectFacultyLeave(id)
      toast.success('Leave rejected')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed')
    } finally { setProcessing(null) }
  }

  return (
    <ErpLayout title="Leave Approvals" subtitle="Review and action student leave requests">
      <div className="card">
        <h3 className="section-title"><PenTool size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Pending Leave Requests</h3>
        {loading ? <SkeletonLoader variant="table-row" count={5} /> : leaves.length === 0 ? (
          <EmptyState title="No pending leaves" description="All leave requests have been processed." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Actions</th></tr></thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.student}</td>
                    <td><span className="pill-badge" style={{ background: 'var(--info-soft)', color: 'var(--info-text)' }}>{l.type}</span></td>
                    <td>{l.from}</td><td>{l.to}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="icon-btn-success" onClick={() => handleApprove(l.id)} disabled={processing === l.id} aria-label="Approve"><Check size={15} /></button>
                        <button className="icon-btn-danger" onClick={() => handleReject(l.id)} disabled={processing === l.id} aria-label="Reject"><X size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErpLayout>
  )
}
