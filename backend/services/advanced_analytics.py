"""
Advanced analytics engine — department metrics, faculty effectiveness, engagement tracking.
"""
from sqlalchemy.orm import Session
from collections import defaultdict
from backend.app.models import Student, Faculty, Attendance, Mark, Subject, Complaint, LeaveRequest


class AdvancedAnalyticsService:

    def department_performance(self, db: Session) -> list:
        """Per-department KPIs: avg attendance, avg marks, student count."""
        departments = defaultdict(lambda: {"students": 0, "total_att": 0, "present_att": 0, "total_marks_pct": 0, "marks_count": 0})
        students = db.query(Student).all()
        for s in students:
            dept = s.department or "Unknown"
            departments[dept]["students"] += 1
            records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
            departments[dept]["total_att"] += len(records)
            departments[dept]["present_att"] += sum(1 for r in records if r.status == "P")
            marks = db.query(Mark).filter(Mark.student_id == s.id).all()
            for m in marks:
                if m.max_marks > 0:
                    departments[dept]["total_marks_pct"] += m.marks_obtained / m.max_marks * 100
                    departments[dept]["marks_count"] += 1

        result = []
        for dept, d in departments.items():
            result.append({
                "department": dept,
                "students": d["students"],
                "avg_attendance": round(d["present_att"] / d["total_att"] * 100, 1) if d["total_att"] > 0 else 0,
                "avg_marks": round(d["total_marks_pct"] / d["marks_count"], 1) if d["marks_count"] > 0 else 0,
            })
        return sorted(result, key=lambda x: x["avg_marks"], reverse=True)

    def at_risk_students(self, db: Session, threshold: float = 65) -> list:
        """Students with attendance below threshold across any subject."""
        students = db.query(Student).filter(Student.is_active == True).all()
        at_risk = []
        for s in students:
            records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
            if not records: continue
            pct = sum(1 for r in records if r.status == "P") / len(records) * 100
            if pct < threshold:
                at_risk.append({"id": s.id, "name": s.full_name, "department": s.department, "semester": s.semester, "attendance": round(pct, 1)})
        return sorted(at_risk, key=lambda x: x["attendance"])

    def faculty_effectiveness(self, db: Session) -> list:
        """Score faculty by class attendance rates and student marks in their subjects."""
        faculty_list = db.query(Faculty).all()
        result = []
        for f in faculty_list:
            codes = [c.strip() for c in (f.subjects_teaching or "").split(",") if c.strip()]
            subjects = db.query(Subject).filter(Subject.code.in_(codes)).all() if codes else []
            if not subjects: continue
            total_att = 0; present_att = 0; total_marks_pct = 0; marks_count = 0
            for subj in subjects:
                att = db.query(Attendance).filter(Attendance.subject_id == subj.id).all()
                total_att += len(att)
                present_att += sum(1 for a in att if a.status == "P")
                marks = db.query(Mark).filter(Mark.subject_id == subj.id).all()
                for m in marks:
                    if m.max_marks > 0:
                        total_marks_pct += m.marks_obtained / m.max_marks * 100
                        marks_count += 1

            att_score = present_att / total_att * 100 if total_att > 0 else 0
            marks_score = total_marks_pct / marks_count if marks_count > 0 else 0
            composite = round((att_score * 0.4 + marks_score * 0.6), 1)

            result.append({"name": f.name, "department": f.department, "subjects": len(subjects), "class_attendance": round(att_score, 1), "avg_student_marks": round(marks_score, 1), "effectiveness_score": composite})
        return sorted(result, key=lambda x: x["effectiveness_score"], reverse=True)


analytics_engine = AdvancedAnalyticsService()
