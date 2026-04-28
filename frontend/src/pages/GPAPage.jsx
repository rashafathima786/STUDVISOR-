import { useState, useEffect } from 'react'
import ErpLayout from '../components/ErpLayout'
import { fetchCGPA } from '../services/api'
import { GraduationCap, Award } from 'lucide-react'

export default function GPAPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCGPA().then(res => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-surface min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-on-surface-variant uppercase tracking-widest text-xs font-bold">Computing GPA Engine...</p>
      </div>
    </div>
  )

  const gradeColor = (gpa) => {
    if (gpa >= 9) return '#22c55e'
    if (gpa >= 8) return '#6ee7b7'
    if (gpa >= 7) return '#facc15'
    if (gpa >= 6) return '#fb923c'
    return '#ef4444'
  }

  const semesters = data?.semesters || []

  return (
    <ErpLayout title="GPA / CGPA Engine" subtitle="Credit-weighted academic performance analysis">
      <div className="flex flex-col gap-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Cumulative GPA</p>
            <p className="text-5xl font-bold text-primary" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {data?.cgpa?.toFixed(2) || '0.00'}
            </p>
            <p className="text-on-surface-variant/60 text-sm">Across all semesters</p>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Credits</p>
            <p className="text-5xl font-bold text-secondary" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {data?.total_credits || 0}
            </p>
            <p className="text-on-surface-variant/60 text-sm">Credit hours earned</p>
          </div>
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Semesters</p>
            <p className="text-5xl font-bold text-tertiary" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {semesters.length}
            </p>
            <p className="text-on-surface-variant/60 text-sm">Completed</p>
          </div>
        </div>

        {/* Semester Breakdown */}
        {semesters.map(sem => (
          <div key={sem.semester} className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-on-surface flex items-center gap-2">
                <GraduationCap size={18} />
                Semester {sem.semester}
              </h3>
              <span className="px-4 py-1 rounded-full text-sm font-bold border"
                style={{
                  backgroundColor: `${gradeColor(sem.sgpa || sem.gpa)}20`,
                  color: gradeColor(sem.sgpa || sem.gpa),
                  borderColor: `${gradeColor(sem.sgpa || sem.gpa)}40`,
                }}>
                SGPA: {(sem.sgpa || sem.gpa)?.toFixed(2)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    {['Subject', 'Code', 'Credits', 'Marks', '%', 'Grade', 'GP'].map(h => (
                      <th key={h} className="py-3 px-6 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(sem.subjects || []).map((subj, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-sm font-semibold text-on-surface">{subj.name || subj.subject_name}</td>
                      <td className="py-4 px-6 text-sm text-primary/80 font-bold">{subj.code || subj.subject_code}</td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant text-center">{subj.credits}</td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant text-center">{subj.marks_obtained}/{subj.max_marks}</td>
                      <td className="py-4 px-6 text-sm text-on-surface text-center">{subj.percentage}%</td>
                      <td className="py-4 px-6 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${gradeColor(subj.grade_point || 0)}20`,
                            color: gradeColor(subj.grade_point || 0),
                          }}>
                          {subj.grade_letter || subj.grade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-on-surface text-center">{subj.grade_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {semesters.length === 0 && (
          <div className="glass-panel rounded-2xl p-16 flex flex-col items-center justify-center gap-4 opacity-60">
            <Award size={48} />
            <h3 className="text-xl font-bold">No Results Available</h3>
            <p className="text-on-surface-variant">Your semester results will appear here once published.</p>
          </div>
        )}
      </div>
    </ErpLayout>
  )
}
