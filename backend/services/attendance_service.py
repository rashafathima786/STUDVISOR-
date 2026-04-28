"""Attendance computation service — subject-wise, heatmap, streaks."""
from sqlalchemy.orm import Session
from collections import defaultdict
from backend.app.models import Attendance, Subject


class AttendanceService:
    def get_overall(self, db: Session, student_id: int) -> dict:
        records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
        total = len(records)
        present = sum(1 for r in records if r.status == "P")
        return {"total": total, "present": present, "absent": total - present, "percentage": round(present / total * 100, 1) if total > 0 else 0}

    def get_subject_wise(self, db: Session, student_id: int) -> list:
        records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
        data = defaultdict(lambda: {"total": 0, "present": 0})
        for r in records:
            data[r.subject_id]["total"] += 1
            if r.status == "P": data[r.subject_id]["present"] += 1
        result = []
        for sid, d in data.items():
            subj = db.query(Subject).filter(Subject.id == sid).first()
            pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 0
            result.append({"subject_id": sid, "subject": subj.name if subj else "?", "code": subj.code if subj else "?", "total": d["total"], "present": d["present"], "percentage": pct, "below_75": pct < 75})
        return sorted(result, key=lambda x: x["percentage"])

    def get_streak(self, db: Session, student_id: int) -> int:
        records = db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.date.desc()).all()
        streak = 0
        for r in records:
            if r.status == "P": streak += 1
            else: break
        return streak

attendance_service = AttendanceService()
