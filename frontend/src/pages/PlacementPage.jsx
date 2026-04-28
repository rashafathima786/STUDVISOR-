import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { Briefcase, Building2, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function PlacementPage() {
  const [drives, setDrives] = useState([])
  const [applications, setApplications] = useState([])
  const [tab, setTab] = useState('drives')
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('erp_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/placement/drives`, { headers }).then(r => r.json()).catch(() => ({ drives: [] })),
      fetch(`${API}/placement/my-applications`, { headers }).then(r => r.json()).catch(() => ({ applications: [] })),
    ]).then(([drivesRes, appsRes]) => {
      setDrives(drivesRes.drives || [])
      setApplications(appsRes.applications || [])
      setLoading(false)
    })
  }, [])

  const applyToDrive = async (driveId) => {
    const res = await fetch(`${API}/placement/apply/${driveId}`, { method: 'POST', headers })
    const data = await res.json()
    alert(data.message || data.detail)
  }

  const appliedDriveIds = applications.map(a => a.id)

  const statusIcon = (status) => {
    if (status === 'Selected') return <CheckCircle size={14} color="#22c55e" />
    if (status === 'Rejected') return <XCircle size={14} color="#ef4444" />
    return <Clock size={14} color="#facc15" />
  }

  if (loading) return (
    <div className="page-loader"><div className="loader-card"><h2>Studvisor</h2><p>Loading Placement Portal...</p></div></div>
  )

  return (
    <ErpLayout title="Placement Portal" subtitle="Campus drives, applications, and offer tracking">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['drives', 'applications'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
            backgroundColor: tab === t ? 'var(--primary-color)' : 'var(--bg-secondary, #0f1424)',
            color: tab === t ? 'white' : 'var(--text-secondary)',
          }}>
            {t === 'drives' ? '🏢 Open Drives' : '📋 My Applications'}
          </button>
        ))}
      </div>

      {tab === 'drives' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {drives.map(d => (
            <div key={d.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{d.company_name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{d.role_title}</p>
                </div>
                {d.package_lpa && (
                  <span style={{ padding: '4px 12px', borderRadius: '16px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    ₹{d.package_lpa} LPA
                  </span>
                )}
              </div>
              {d.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0', lineHeight: 1.4 }}>{d.description}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '12px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {d.eligibility_cgpa > 0 && <span>📊 Min CGPA: {d.eligibility_cgpa}</span>}
                {d.drive_date && <span>📅 Drive: {d.drive_date}</span>}
                {d.last_date_apply && <span>⏰ Apply by: {d.last_date_apply}</span>}
              </div>
              <button
                onClick={() => applyToDrive(d.id)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
              >
                Apply Now
              </button>
            </div>
          ))}
          {drives.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
              <Building2 size={40} color="var(--text-secondary)" />
              <h3>No Open Drives</h3>
              <p style={{ color: 'var(--text-secondary)' }}>New placement opportunities will appear here.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="card">
          <h3 className="section-title"><Briefcase size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} /> Application History</h3>
          {applications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>You haven't applied to any drives yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Company</th>
                  <th style={{ padding: '10px 12px' }}>Role</th>
                  <th style={{ padding: '10px 12px' }}>Package</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Applied</th>
                </tr></thead>
                <tbody>
                  {applications.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{a.company_name}</td>
                      <td style={{ padding: '10px 12px' }}>{a.role_title}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#22c55e' }}>{a.package_lpa ? `₹${a.package_lpa} LPA` : '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {statusIcon(a.status)} {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(a.applied_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </ErpLayout>
  )
}

