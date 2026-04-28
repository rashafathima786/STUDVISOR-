"""Merit/XP service — point awarding, tier calculation, leaderboard."""
from sqlalchemy.orm import Session
from backend.app.models import Student, MeritLog

TIER_THRESHOLDS = [
    (1000, "Diamond"), (500, "Gold"), (200, "Silver"), (50, "Bronze"), (0, "Novice"),
]

POINT_RULES = {
    "assignment_submit": 10,
    "assignment_early": 20,
    "perfect_attendance_day": 5,
    "perfect_attendance_week": 25,
    "exam_pass": 15,
    "exam_distinction": 50,
    "note_upload": 10,
    "note_helpful": 5,
    "event_rsvp": 5,
    "poll_create": 10,
    "streak_7": 30,
    "streak_30": 100,
    "semester_topper": 500,
    "department_topper": 300,
    "class_rep": 100,
    "placement_offer": 200,
    "100_attendance": 250,
    "hackathon_win": 150,
    "paper_published": 400,
}



class MeritService:

    def award_points(self, db: Session, student_id: int, reason: str, custom_points: int = None) -> dict:
        """Award merit points. Uses POINT_RULES if reason matches, else custom_points."""
        points = custom_points if custom_points else POINT_RULES.get(reason, 0)
        if points <= 0:
            return {"awarded": 0}

        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        student.merit_points += points
        # Recalculate tier
        for threshold, tier in TIER_THRESHOLDS:
            if student.merit_points >= threshold:
                student.merit_tier = tier
                break

        db.add(MeritLog(student_id=student_id, points=points, reason=reason))
        db.commit()

        return {"awarded": points, "total": student.merit_points, "tier": student.merit_tier}

    def deduct_points(self, db: Session, student_id: int, points: int, reason: str) -> dict:
        """Deduct points (negative merit log). Floor at 0."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        student.merit_points = max(0, student.merit_points - points)
        for threshold, tier in TIER_THRESHOLDS:
            if student.merit_points >= threshold:
                student.merit_tier = tier
                break

        db.add(MeritLog(student_id=student_id, points=-points, reason=f"DEDUCTION: {reason}"))
        db.commit()
        return {"deducted": points, "total": student.merit_points, "tier": student.merit_tier}

    def get_leaderboard(self, db: Session, department: str = None, limit: int = 25) -> list:
        q = db.query(Student).filter(Student.is_active == True)
        if department:
            q = q.filter(Student.department == department)
        students = q.order_by(Student.merit_points.desc()).limit(limit).all()
        return [{
            "rank": i + 1, "name": s.full_name, "department": s.department,
            "points": s.merit_points, "tier": s.merit_tier,
        } for i, s in enumerate(students)]

    def recalculate_all_tiers(self, db: Session):
        """Batch recalculate all student tiers."""
        students = db.query(Student).all()
        for s in students:
            for threshold, tier in TIER_THRESHOLDS:
                if s.merit_points >= threshold:
                    s.merit_tier = tier
                    break
        db.commit()
        return len(students)


merit_service = MeritService()
