import { GraduationCap, Mail, User } from 'lucide-react'

export default function ProfileCard({ profile }) {
  return (
    <div className="card profile-card">
      <h3 className="section-title">Student Profile</h3>
      <div className="profile-list">
        <div className="profile-row">
          <User size={18} />
          <span>
            <strong>Name:</strong> {profile?.full_name || '-'}
          </span>
        </div>
        <div className="profile-row">
          <User size={18} />
          <span>
            <strong>Username:</strong> {profile?.username || '-'}
          </span>
        </div>
        <div className="profile-row">
          <Mail size={18} />
          <span>
            <strong>Email:</strong> {profile?.email || '-'}
          </span>
        </div>
        <div className="profile-row">
          <GraduationCap size={18} />
          <span>
            <strong>Department:</strong> {profile?.department || '-'}
          </span>
        </div>
        <div className="profile-row">
          <GraduationCap size={18} />
          <span>
            <strong>Semester:</strong> {profile?.semester || '-'}
          </span>
        </div>
      </div>
    </div>
  )
}
