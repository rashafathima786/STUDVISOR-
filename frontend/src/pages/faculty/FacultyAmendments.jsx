import { useState, useEffect } from 'react'
import { fetchPendingAmendments, approveAmendment } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import SkeletonLoader from '../../components/SkeletonLoader'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../stores/toastStore'
import { FileSearch, Check, X } from 'lucide-react'

export default function FacultyAmendments() {
  const [amendments, setAmendments] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const toast = useToast()

  const load = () => {
    setLoading(true)
    fetchPendingAmendments()
      .then((res) => setAmendments(res?.pending_amendments || []))
      .catch(() => setAmendments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAction = async (id, approve) => {
    setProcessing(id)
    try {
      await approveAmendment(id, approve, '')
      toast.success(approve ? 'Amendment approved' : 'Amendment rejected')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Action failed')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <ErpLayout title="Amendment Requests" subtitle="Review attendance amendment requests">
      <div className="card">
        <h3 className="section-title"><FileSearch size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Pending Amendments</h3>
        {loading ? <SkeletonLoader variant="table-row" count={5} /> : amendments.length === 0 ? (
          <EmptyState title="No pending amendments" description="All requests processed." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Faculty</th><th>Subject</th><th>Date</th><th>Old</th><th>New</th><th>Reason</th><th>Actions</th></tr></thead>
              <tbody>
                {amendments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.faculty}</td>
                    <td>{a.subject}</td><td>{a.date}</td>
                    <td><span className={`attendance-toggle-btn att-${a.old_status}`}>{a.old_status}</span></td>
                    <td><span className={`attendance-toggle-btn att-${a.new_status}`}>{a.new_status}</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="icon-btn-success" onClick={() => handleAction(a.id, true)} disabled={processing === a.id} aria-label="Approve"><Check size={15} /></button>
                        <button className="icon-btn-danger" onClick={() => handleAction(a.id, false)} disabled={processing === a.id} aria-label="Reject"><X size={15} /></button>
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
