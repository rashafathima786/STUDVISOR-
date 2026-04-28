import { useState } from 'react'
import ErpLayout from '../../components/ErpLayout'
import EmptyState from '../../components/EmptyState'
import { FileSearch } from 'lucide-react'

export default function AdminAudit() {
  // Audit log endpoint not yet available in backend — placeholder UI
  const [logs] = useState([])

  return (
    <ErpLayout title="Audit Logs" subtitle="Review system activity and state changes">
      <div className="card">
        <h3 className="section-title"><FileSearch size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Activity Log</h3>
        {logs.length === 0 ? (
          <EmptyState title="No audit logs available" description="Audit log data will appear here once the audit middleware endpoint is connected." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Resource</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i}>
                    <td>{l.timestamp}</td><td>{l.actor}</td><td>{l.action}</td><td>{l.resource}</td><td>{l.ip}</td>
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
