import { useEffect, useState } from 'react'
import ErpLayout from '../components/ErpLayout'
import InfoCard from '../components/InfoCard'
import { fetchCalendarMonth, fetchUpcomingHolidays } from '../services/api'

export default function CalendarPage() {
  const [calendarDays, setCalendarDays] = useState([])
  const [holidays, setHolidays] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCalendar() {
      try {
        const [monthData, holidayData] = await Promise.all([
          fetchCalendarMonth(2026, 4),
          fetchUpcomingHolidays(),
        ])
        setCalendarDays(monthData)
        setHolidays(holidayData)
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to load calendar.')
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()
  }, [])

  const workingDays = calendarDays.filter((day) => day.is_working_day).length
  const totalHours = calendarDays.reduce((sum, day) => sum + Number(day.working_hours || 0), 0)

  return (
    <ErpLayout title="Academic Calendar" subtitle="Check holidays, working days, and working hours.">
      {error ? <div className="error-box page-error">{error}</div> : null}
      {loading ? <div className="card empty-state">Loading calendar...</div> : null}

      {!loading ? (
        <>
          <section className="dashboard-grid calendar-summary-grid">
            <InfoCard title="Working Days" value={workingDays} subtitle="April 2026" />
            <InfoCard title="Holidays" value={calendarDays.length - workingDays} subtitle="Non-working days" />
            <InfoCard title="Working Hours" value={totalHours} subtitle="Total scheduled hours" />
            <InfoCard title="Next Holiday" value={holidays[0]?.holiday_name || '-'} subtitle={holidays[0]?.date || 'No upcoming holiday'} />
          </section>

          <section className="page-stack">
            <div className="card">
              <h3 className="section-title">April 2026 Calendar</h3>
              <div className="calendar-grid">
                {calendarDays.map((day) => (
                  <div className={`calendar-day ${day.is_working_day ? 'working' : 'holiday'}`} key={day.date}>
                    <div className="calendar-date">{day.date.slice(-2)}</div>
                    <div className="calendar-weekday">{day.day_name}</div>
                    <div className="calendar-status">
                      {day.is_working_day ? `${day.working_hours} hours` : day.holiday_name || 'Holiday'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </ErpLayout>
  )
}
