import { useState, useEffect } from 'react'
import { fetchAllStudents } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import DataTable from '../../components/DataTable'
import SkeletonLoader from '../../components/SkeletonLoader'
import { Users, Search } from 'lucide-react'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllStudents()
      .then((res) => { const s = res?.students || []; setStudents(s); setFiltered(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(students); return }
    const q = search.toLowerCase()
    setFiltered(students.filter(s => s.name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q)))
  }, [search, students])

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'username', label: 'Username', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'semester', label: 'Sem', sortable: true },
    { key: 'merit', label: 'Merit', sortable: true, render: (v) => <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>{v || 0}</span> },
  ]

  return (
    <ErpLayout title="Student Roster" subtitle="Manage all registered students">
      <div className="card">
        <div className="card-header-row">
          <h3 className="section-title" style={{ margin: 0 }}><Users size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Students ({filtered.length})</h3>
          <div className="input-with-icon" style={{ marginBottom: 0, padding: '0 12px', maxWidth: '300px' }}>
            <Search size={16} />
            <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '8px 0', fontSize: '0.88rem' }} />
          </div>
        </div>
        {loading ? <SkeletonLoader variant="table-row" count={8} /> : (
          <DataTable columns={columns} data={filtered} pageSize={15} emptyTitle="No students found" emptyDescription="Try adjusting your search filters." />
        )}
      </div>
    </ErpLayout>
  )
}
