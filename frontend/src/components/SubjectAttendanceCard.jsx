export default function SubjectAttendanceCard({ subjectAttendance }) {
  return (
    <div className="card">
      <h3 className="section-title">Subject-wise Attendance</h3>
      {subjectAttendance.length ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Present</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {subjectAttendance.map((item, index) => (
                <tr key={`${item.subject_code}-${index}`}>
                  <td>{item.subject_name}</td>
                  <td>{item.subject_code}</td>
                  <td>{item.present_classes}</td>
                  <td>{item.total_classes}</td>
                  <td>{item.attendance_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No subject attendance data found.</div>
      )}
    </div>
  )
}
