export default function MarksCard({ marks, average }) {
  return (
    <div className="card">
      <div className="card-header-row">
        <h3 className="section-title">Marks Summary</h3>
        <div className="pill-badge">Average: {average}</div>
      </div>

      {marks.length ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Marks</th>
                <th>Max</th>
                <th>Assessment</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((item, index) => (
                <tr key={`${item.subject_code}-${item.assessment_type}-${index}`}>
                  <td>{item.subject_name}</td>
                  <td>{item.subject_code}</td>
                  <td>{item.marks_obtained}</td>
                  <td>{item.max_marks}</td>
                  <td>{item.assessment_type}</td>
                  <td>{item.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No marks data found.</div>
      )}
    </div>
  )
}
