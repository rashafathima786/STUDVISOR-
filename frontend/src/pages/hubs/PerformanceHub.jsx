import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ErpLayout from '../../components/ErpLayout'
import { getUser } from '../../utils/auth'
import { 
  fetchOverallAttendance, 
  fetchSubjectAttendance, 
  fetchCGPA, 
  fetchAchievements, 
  fetchLeaderboard, 
  fetchPerformanceAnalytics,
  fetchMeritStatus
} from '../../services/api'
import { motion } from 'framer-motion'

export default function PerformanceHub() {
  const [overall, setOverall] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [cgpa, setCgpa] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [leaderboard, setLeaderboard] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attData, subData, cgpaData, achData, leadData, anaData, meritData] = await Promise.all([
          fetchOverallAttendance(),
          fetchSubjectAttendance(),
          fetchCGPA(),
          fetchAchievements(),
          fetchLeaderboard(),
          fetchPerformanceAnalytics(),
          fetchMeritStatus()
        ])
        console.log('Fetched Performance Data:', { attData, subData, cgpaData, achData, leadData, anaData, meritData })
        
        setOverall(attData)
        setSubjects(Array.isArray(subData) ? subData.slice(0, 4) : (subData?.subjects?.slice(0, 4) || []))
        
        // Merge merit data into cgpa state for easier access
        setCgpa({
          ...cgpaData,
          merit_points: meritData?.points || 0,
          merit_tier: meritData?.tier || 'Novice',
          semester: cgpaData?.semesters?.[cgpaData.semesters.length - 1]?.semester || '1'
        })
        
        setAchievements(achData?.achievements?.slice(0, 1) || [])
        
        // Find current user rank in leaderboard
        const user = getUser()
        const currentUserName = user?.full_name || user?.username || "Tejaswini";
        const students = leadData?.leaderboard || []
        const myRank = students.find(s => s.name.includes(currentUserName) || s.name.includes("Tejaswini"))
        
        setLeaderboard({
          rank: myRank?.rank || '??',
          total: students.length,
          status_message: myRank ? `Ranked #${myRank.rank} globally` : 'Participate to rank up'
        })
        
        setAnalytics(anaData)
      } catch (err) {
        console.error('Error fetching performance data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <ErpLayout title="Performance" subtitle="Track your academic performance">
      <motion.div 
        className="bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Attendance - Large Bento Tile */}
        <motion.div variants={itemVariants} className="bento-tile bento-span-2 bento-row-span-2" style={{ cursor: 'default' }}>
          <div className="hub-tile-header">
            <div className="hub-tile-icon-wrap">🎯</div>
            <div className="hub-tile-title">
              <span className="hub-tile-label">Attendance Trends</span>
              <span className="hub-tile-desc">Overall: {overall?.percentage || 0}%</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/attendance" className="bento-task-action">Details</Link>
            </div>
          </div>
          <div className="bento-internal-scroll">
            {subjects.length > 0 ? (
              subjects.map((sub, idx) => (
                <div key={idx} className="bento-task-item">
                  <div className="bento-task-info">
                    <span className="bento-task-title">{sub.subject}</span>
                    <span className="bento-task-meta" style={{ color: sub.percentage >= 75 ? '#10b981' : '#ef4444' }}>
                      {sub.percentage}% - {sub.percentage >= 75 ? 'Safe' : 'Critical'}
                    </span>
                  </div>
                  <div style={{ width: '60px', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '4px' }}>
                    <div style={{ width: `${sub.percentage}%`, background: sub.percentage >= 75 ? '#10b981' : '#ef4444', height: '100%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-mini">
                {loading ? "Analyzing attendance..." : "No attendance data found."}
              </div>
            )}
          </div>
        </motion.div>

        {/* GPA - Wide Bento Tile */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/gpa" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🏆</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">GPA Forecaster</span>
                <span className="hub-tile-desc">Current CGPA: {cgpa?.cgpa || '0.0'} / 10.0</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
               <div className="seg-progress" style={{ height: '8px' }}>
                <div className="seg-block seg-block--filled violet" style={{ height: '8px', width: `${(cgpa?.cgpa || 0) * 10}%` }}></div>
                <div className="seg-block" style={{ height: '8px', width: `${100 - (cgpa?.cgpa || 0) * 10}%` }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Semester {cgpa?.semester || 'N/A'}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Target: 9.0+</span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Results */}
        <motion.div variants={itemVariants}>
          <Link to="/results" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">📋</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Results</span>
                <span className="hub-tile-desc">Latest Marks</span>
              </div>
            </div>
            <div className="hub-tile-preview">
              <div className="mini-status-list">
                <div className="mini-status-item">
                  <div className="mini-dot active"></div>
                  <span>{analytics?.recent_performance || 'Loading...'}</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Leaderboard */}
        <motion.div variants={itemVariants}>
          <Link to="/leaderboard" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🥇</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Leaderboard</span>
                <span className="hub-tile-desc">Rank #{leaderboard?.rank || '??'} of {leaderboard?.total || '??'}</span>
              </div>
            </div>
            <div className="hub-tile-preview">
              <div className="mini-status-list">
                <div className="mini-status-item">
                  <div className="mini-dot active"></div>
                  <span>{leaderboard?.status_message || 'Synchronizing rank...'}</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Analytics - Wide Bento Tile */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/analytics" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">🔬</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">AI Analytics</span>
                <span className="hub-tile-desc">Performance Insights</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6ee7b7', lineHeight: 1.5, fontWeight: 500 }}>
                  💡 <strong>Insight:</strong> {analytics?.ai_insight || 'Our AI is analyzing your performance patterns to provide personalized study recommendations.'}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={itemVariants} className="bento-span-2">
          <Link to="/achievements" className="bento-tile" style={{ height: '100%' }}>
            <div className="hub-tile-header">
              <div className="hub-tile-icon-wrap">⭐</div>
              <div className="hub-tile-title">
                <span className="hub-tile-label">Achievements</span>
                <span className="hub-tile-desc">Merit Points: {cgpa?.merit_points || 0}</span>
              </div>
            </div>
            <div className="hub-tile-preview" style={{ borderTop: 'none', paddingTop: '0', marginTop: '16px' }}>
              <div className="seg-progress" style={{ height: '8px' }}>
                <div className="seg-block seg-block--filled orange" style={{ height: '8px', width: '70%' }}></div>
                <div className="seg-block" style={{ height: '8px', width: '30%' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{cgpa?.merit_tier || 'Novice'} Tier</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Progress to next tier</span>
              </div>
            </div>
          </Link>
        </motion.div>

      </motion.div>
    </ErpLayout>
  )
}
