import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from './EmptyState'

/**
 * Reusable data table with sort, pagination, and optional filtering.
 * Props:
 *   columns — [{ key, label, sortable, render }]
 *   data    — array of row objects
 *   pageSize — rows per page (0 = no pagination)
 *   emptyTitle / emptyDescription — empty state text
 *   onRowClick — optional (row) => void
 */
export default function DataTable({
  columns = [],
  data = [],
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  onRowClick,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  const handleSort = (key) => {
    if (!key) return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = pageSize > 0 ? Math.ceil(sorted.length / pageSize) : 1
  const visible = pageSize > 0 ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="datatable-wrapper">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={col.sortable ? 'sortable-th' : ''}
                >
                  <span className="th-inner">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'clickable-row' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && totalPages > 1 && (
        <div className="datatable-pagination">
          <span className="datatable-info">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="datatable-nav">
            <button
              className="datatable-pg-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="datatable-pg-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
