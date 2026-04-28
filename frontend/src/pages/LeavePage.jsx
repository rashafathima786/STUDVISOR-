import { useEffect, useState } from 'react'
import ErpLayout from '../components/ErpLayout'
import { applyLeaveRequest, fetchLeaveRequests, fetchMissedClasses } from '../services/api'

const initialForm = {
  leave_type: 'OD',
  from_date: '2026-04-21',
  to_date: '2026-04-21',
  reason: '',
}

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [missedClasses, setMissedClasses] = useState([])
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function loadLeaveData() {
    const [leaveData, missedData] = await Promise.all([
      fetchLeaveRequests(),
      fetchMissedClasses(),
    ])
    setLeaveRequests(leaveData)
    setMissedClasses(missedData)
  }

  useEffect(() => {
    async function load() {
      try {
        await loadLeaveData()
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to load leave data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      await applyLeaveRequest(form)
      setMessage('Leave request submitted as pending.')
      setForm(initialForm)
      await loadLeaveData()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit leave request.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <ErpLayout title="OD / Leave" subtitle="Review missed classes and submit OD, medical, or leave requests.">
      {error ? <div className="error-box page-error">{error}</div> : null}
      {message ? <div className="success-box page-error">{message}</div> : null}
      {loading ? <div className="card empty-state">Loading leave data...</div> : null}

      {!loading ? (
        <section className="leave-grid">
          <div className="card">
            <h3 className="section-title">Apply Leave</h3>
            <form className="erp-form" onSubmit={handleSubmit}>
              <label>
                Type
                <select value={form.leave_type} onChange={(event) => updateForm('leave_type', event.target.value)}>
                  <option value="OD">OD</option>
                  <option value="Medical">Medical</option>
                  <option value="Leave">Leave</option>
                </select>
              </label>
              <label>
                From
                <input type="date" value={form.from_date} onChange={(event) => updateForm('from_date', event.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={form.to_date} onChange={(event) => updateForm('to_date', event.target.value)} />
              </label>
              <label>
                Reason
                <textarea value={form.reason} onChange={(event) => updateForm('reason', event.target.value)} rows={4} />
              </label>
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          <div className="page-stack">
            <div className="card">
              <h3 className="section-title">Applied Requests</h3>
              {leaveRequests.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((item) => (
                        <tr key={item.id}>
                          <td>{item.leave_type}</td>
                          <td>{item.from_date === item.to_date ? item.from_date : `${item.from_date} to ${item.to_date}`}</td>
                          <td>{item.status}</td>
                          <td>{item.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No leave requests found.</div>
              )}
            </div>

            <div className="card">
              <h3 className="section-title">Missed Classes for Leave Support</h3>
              {missedClasses.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Absent Periods</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missedClasses.map((day) => (
                        <tr key={day.date}>
                          <td>{day.date}</td>
                          <td>
                            {day.missed_hours
                              .map((item) => `${item.hour} hr - ${item.subject_name}`)
                              .join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No absences found for leave support.</div>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </ErpLayout>
  )
}
