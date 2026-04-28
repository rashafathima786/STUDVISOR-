import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { BookOpen, Search, BookMarked, Clock, AlertTriangle } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function LibraryPage() {
  const [tab, setTab] = useState('catalog')
  const [books, setBooks] = useState([])
  const [myBooks, setMyBooks] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('erp_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/library/catalog`, { headers }).then(r => r.json()).catch(() => ({ books: [] })),
      fetch(`${API}/library/my-books`, { headers }).then(r => r.json()).catch(() => ({ issued_books: [] })),
    ]).then(([catalogRes, myRes]) => {
      setBooks(catalogRes.books || [])
      setMyBooks(myRes.issued_books || [])
      setLoading(false)
    })
  }, [])

  const searchBooks = () => {
    fetch(`${API}/library/catalog?q=${encodeURIComponent(query)}`, { headers })
      .then(r => r.json()).then(res => setBooks(res.books || []))
  }

  const issueBook = async (bookId) => {
    const res = await fetch(`${API}/library/issue/${bookId}`, { method: 'POST', headers })
    const data = await res.json()
    alert(data.message || data.detail)
  }

  if (loading) return (
    <div className="page-loader"><div className="loader-card"><h2>Studvisor</h2><p>Loading Library...</p></div></div>
  )

  return (
    <ErpLayout title="Library Management" subtitle="Search, borrow, and manage your reading">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['catalog', 'my-books'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
            backgroundColor: tab === t ? 'var(--primary-color)' : 'var(--bg-secondary, #0f1424)',
            color: tab === t ? 'white' : 'var(--text-secondary)',
          }}>
            {t === 'catalog' ? '📚 Browse Catalog' : '📖 My Books'}
          </button>
        ))}
      </div>

      {tab === 'catalog' && (
        <div className="card">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary, #0f1424)' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchBooks()}
                placeholder="Search by title or author..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem' }}
              />
            </div>
            <button onClick={searchBooks} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Search</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {books.map(b => (
              <div key={b.id} style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary, #0f1424)' }}>
                <h4 style={{ margin: '0 0 4px' }}>{b.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 8px' }}>{b.author}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: b.available_copies > 0 ? '#22c55e' : '#ef4444' }}>
                    {b.available_copies > 0 ? `${b.available_copies} available` : 'Not available'}
                  </span>
                  {b.available_copies > 0 && (
                    <button onClick={() => issueBook(b.id)} style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Borrow
                    </button>
                  )}
                </div>
                {b.shelf_location && <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '6px' }}>📍 {b.shelf_location}</p>}
              </div>
            ))}
            {books.length === 0 && <p style={{ color: 'var(--text-secondary)', padding: '20px' }}>No books found.</p>}
          </div>
        </div>
      )}

      {tab === 'my-books' && (
        <div className="card">
          <h3 className="section-title"><BookMarked size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} /> Currently Issued</h3>
          {myBooks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>No books currently issued.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '10px 12px' }}>Issued</th>
                  <th style={{ padding: '10px 12px' }}>Due</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Fine</th>
                </tr></thead>
                <tbody>
                  {myBooks.map(b => (
                    <tr key={b.issue_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{b.title}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.issue_date}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.due_date}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: b.status === 'Overdue' ? '#ef4444' : '#22c55e' }}>{b.status}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: b.fine > 0 ? '#ef4444' : 'inherit' }}>₹{b.fine}</td>
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

