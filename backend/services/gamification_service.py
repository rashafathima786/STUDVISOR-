"""
Gamification Engine — Achievements, badges, XP, and peer mentor matching.
"""
from sqlalchemy.orm import Session
from backend.app.models import Student, Attendance, Mark, Assignment, AssignmentSubmission, Subject
from collections import defaultdict


BADGE_DEFINITIONS = {
    "perfect_attendance_week": {"name": "Perfect Week", "description": "100% attendance for 7 consecutive days", "xp": 50},
    "first_assignment": {"name": "First Submit", "description": "Submitted your first assignment", "xp": 20},
    "grade_a_plus": {"name": "Academic Star", "description": "Scored A+ in any subject", "xp": 100},
    "streak_30": {"name": "Iron Discipline", "description": "30-day attendance streak", "xp": 200},
    "helper": {"name": "Knowledge Sharer", "description": "Uploaded 5+ study notes", "xp": 75},
    "early_bird": {"name": "Early Bird", "description": "Submitted 3 assignments before deadline", "xp": 50},
    "perfect_score": {"name": "Perfectionist", "description": "Scored 100% in any assessment", "xp": 150},
    "semester_topper": {"name": "Semester Topper", "description": "Highest CGPA in your batch", "xp": 500},
}


class GamificationService:

    def check_badges(self, db: Session, student_id: int) -> list:
        """Check and award new badges based on current data."""
        earned = []

        # Perfect week check
        records = db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.date.desc()).all()
        if len(records) >= 7:
            last_7 = records[:7]
            if all(r.status == "P" for r in last_7):
                earned.append("perfect_attendance_week")

        # 30-day streak
        streak = 0
        prev_date = None
        for r in records:
            if r.status == "P":
                streak += 1
            else:
                break
        if streak >= 30:
            earned.append("streak_30")

        # First assignment
        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == student_id
        ).count()
        if submissions >= 1:
            earned.append("first_assignment")

        # Grade A+
        marks = db.query(Mark).filter(Mark.student_id == student_id).all()
        for m in marks:
            pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
            if pct >= 90:
                earned.append("grade_a_plus")
                break

        # Perfect score
        for m in marks:
            if m.marks_obtained == m.max_marks and m.max_marks > 0:
                earned.append("perfect_score")
                break

        return [{"badge_id": b, **BADGE_DEFINITIONS[b]} for b in set(earned)]

    def get_xp(self, db: Session, student_id: int) -> int:
        """Calculate total XP from earned badges + merit points."""
        badges = self.check_badges(db, student_id)
        badge_xp = sum(b["xp"] for b in badges)
        student = db.query(Student).filter(Student.id == student_id).first()
        merit_xp = student.merit_points * 2 if student else 0
        return badge_xp + merit_xp

    def find_peer_mentors(self, db: Session, student_id: int) -> list:
        """Match struggling student with high-performers in the same batch."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return []

        # Find student's weak subjects
        marks = db.query(Mark).filter(Mark.student_id == student_id).all()
        weak_subjects = set()
        for m in marks:
            pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
            if pct < 50:
                weak_subjects.add(m.subject_id)

        if not weak_subjects:
            return []

        # Find peers in same department/semester who scored > 80% in those subjects
        peers = db.query(Student).filter(
            Student.department == student.department,
            Student.semester == student.semester,
            Student.id != student_id,
        ).all()

        mentors = []
        for peer in peers:
            peer_marks = db.query(Mark).filter(
                Mark.student_id == peer.id,
                Mark.subject_id.in_(weak_subjects)
            ).all()

            if not peer_marks:
                continue

            avg = sum(m.marks_obtained / m.max_marks * 100 for m in peer_marks) / len(peer_marks)
            if avg >= 80:
                strong_in = []
                for m in peer_marks:
                    if m.marks_obtained / m.max_marks * 100 >= 80:
                        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                        if subj:
                            strong_in.append(subj.name)

                mentors.append({
                    "peer_id": peer.id,
                    "name": peer.full_name,
                    "average_score": round(avg, 1),
                    "strong_subjects": strong_in[:3],
                    "merit_tier": peer.merit_tier,
                })

        return sorted(mentors, key=lambda x: x["average_score"], reverse=True)[:5]


gamification_service = GamificationService()
