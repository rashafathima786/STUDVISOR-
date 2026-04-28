import { useState } from 'react'
import { uploadMarks, publishMarks } from '../../services/api'
import ErpLayout from '../../components/ErpLayout'
import { useToast } from '../../stores/toastStore'
import { Upload, Send, Plus, Trash2 } from 'lucide-react'

export default function FacultyMarks() {
  const [subjectId, setSubjectId] = useState('')
  const [assessmentType, setAssessmentType] = useState('CAT-1')
  const [semester, setSemester] = useState('1')
  const [entries, setEntries] = useState([{ student_id: '', marks_obtained: '', max_marks: '100' }])
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const toast = useToast()

  const addRow = () => {
    setEntries([...entries, { student_id: '', marks_obtained: '', max_marks: '100' }])
  }

  const removeRow = (idx) => {
    setEntries(entries.filter((_, i) => i !== idx))
  }

  const updateEntry = (idx, field, value) => {
    const updated = [...entries]
    updated[idx][field] = value
    setEntries(updated)
  }

  const handleUpload = async () => {
    if (!subjectId) {
      toast.warning('Please enter a Subject ID')
      return
    }
    const validEntries = entries.filter((e) => e.student_id && e.marks_obtained !== '')
    if (validEntries.length === 0) {
      toast.warning('Please add at least one mark entry')
      return
    }

    setSubmitting(true)
    try {
      await uploadMarks({
        subject_id: parseInt(subjectId),
        assessment_type: assessmentType,
        semester,
        entries: validEntries.map((e) => ({
          student_id: parseInt(e.student_id),
          marks_obtained: parseFloat(e.marks_obtained),
          max_marks: parseFloat(e.max_marks),
        })),
      })
      toast.success(`Uploaded ${validEntries.length} marks (unpublished)`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async () => {
    if (!subjectId) {
      toast.warning('Please enter a Subject ID')
      return
    }
    setPublishing(true)
    try {
      const res = await publishMarks(parseInt(subjectId), assessmentType)
      toast.success(res?.message || 'Marks published successfully')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <ErpLayout title="Marks Upload" subtitle="Upload and publish student marks">
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="section-title">
          <Upload size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Assessment Details
        </h3>
        <div className="attendance-controls">
          <div className="input-group">
            <label>Subject ID</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 1"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Assessment Type</label>
            <select
              className="form-input"
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
            >
              <option value="CAT-1">CAT-1</option>
              <option value="CAT-2">CAT-2</option>
              <option value="CAT-3">CAT-3</option>
              <option value="Semester">Semester Exam</option>
              <option value="Assignment">Assignment</option>
              <option value="Lab">Lab Practical</option>
            </select>
          </div>
          <div className="input-group">
            <label>Semester</label>
            <select
              className="form-input"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h3 className="section-title" style={{ margin: 0 }}>Mark Entries</h3>
          <button className="outline-btn" onClick={addRow}>
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      type="number"
                      className="form-input form-input-sm"
                      placeholder="Student ID"
                      value={entry.student_id}
                      onChange={(e) => updateEntry(idx, 'student_id', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input form-input-sm"
                      placeholder="Marks"
                      value={entry.marks_obtained}
                      onChange={(e) => updateEntry(idx, 'marks_obtained', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input form-input-sm"
                      placeholder="Max"
                      value={entry.max_marks}
                      onChange={(e) => updateEntry(idx, 'max_marks', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      className="icon-btn-danger"
                      onClick={() => removeRow(idx)}
                      aria-label="Remove row"
                      disabled={entries.length <= 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="marks-action-bar">
          <button
            className="primary-btn compact-btn"
            onClick={handleUpload}
            disabled={submitting}
          >
            <Upload size={15} />
            {submitting ? 'Uploading...' : 'Upload Marks (Draft)'}
          </button>
          <button
            className="outline-btn"
            onClick={handlePublish}
            disabled={publishing}
            style={{ borderColor: 'var(--success)', color: 'var(--success-text)' }}
          >
            <Send size={15} />
            {publishing ? 'Publishing...' : 'Publish Marks'}
          </button>
        </div>
      </div>
    </ErpLayout>
  )
}
