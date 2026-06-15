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
        
        students = db.query(Student.id, Student.department).all()
        student_dept = {}
        for s_id, s_dept in students:
            dept = s_dept or "Unknown"
            student_dept[s_id] = dept
            departments[dept]["students"] += 1
            
        attendance_records = db.query(Attendance.student_id, Attendance.status).all()
        for student_id, status in attendance_records:
            dept = student_dept.get(student_id)
            if dept:
                departments[dept]["total_att"] += 1
                if status == "P":
                    departments[dept]["present_att"] += 1
                    
        marks = db.query(Mark.student_id, Mark.marks_obtained, Mark.max_marks).all()
        for student_id, marks_obtained, max_marks in marks:
            dept = student_dept.get(student_id)
            if dept and max_marks > 0:
                departments[dept]["total_marks_pct"] += (marks_obtained / max_marks * 100)
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
        
        attendance_by_student = defaultdict(list)
        for r in db.query(Attendance.student_id, Attendance.status).all():
            attendance_by_student[r.student_id].append(r.status)
            
        at_risk = []
        for s in students:
            statuses = attendance_by_student.get(s.id)
            if not statuses:
                continue
            pct = sum(1 for status in statuses if status == "P") / len(statuses) * 100
            if pct < threshold:
                at_risk.append({
                    "id": s.id,
                    "name": s.full_name,
                    "department": s.department,
                    "semester": s.semester,
                    "attendance": round(pct, 1)
                })
        return sorted(at_risk, key=lambda x: x["attendance"])

    def faculty_effectiveness(self, db: Session) -> list:
        """Score faculty by class attendance rates and student marks in their subjects."""
        faculty_list = db.query(Faculty).all()
        subjects_list = db.query(Subject).all()
        subjects_by_code = {s.code: s for s in subjects_list}
        
        attendance_by_subject = defaultdict(list)
        for r in db.query(Attendance.subject_id, Attendance.status).all():
            attendance_by_subject[r.subject_id].append(r.status)
            
        marks_by_subject = defaultdict(list)
        for m in db.query(Mark.subject_id, Mark.marks_obtained, Mark.max_marks).all():
            marks_by_subject[m.subject_id].append((m.marks_obtained, m.max_marks))
            
        result = []
        for f in faculty_list:
            codes = [c.strip() for c in (f.subjects_teaching or "").split(",") if c.strip()]
            faculty_subjects = [subjects_by_code[code] for code in codes if code in subjects_by_code]
            if not faculty_subjects:
                continue
                
            total_att = 0; present_att = 0; total_marks_pct = 0; marks_count = 0
            for subj in faculty_subjects:
                statuses = attendance_by_subject.get(subj.id, [])
                total_att += len(statuses)
                present_att += sum(1 for s in statuses if s == "P")
                
                m_list = marks_by_subject.get(subj.id, [])
                for obtained, max_m in m_list:
                    if max_m > 0:
                        total_marks_pct += obtained / max_m * 100
                        marks_count += 1
                        
            att_score = present_att / total_att * 100 if total_att > 0 else 0
            marks_score = total_marks_pct / marks_count if marks_count > 0 else 0
            composite = round((att_score * 0.4 + marks_score * 0.6), 1)
            
            result.append({
                "name": f.name,
                "department": f.department,
                "subjects": len(faculty_subjects),
                "class_attendance": round(att_score, 1),
                "avg_student_marks": round(marks_score, 1),
                "effectiveness_score": composite
            })
        return sorted(result, key=lambda x: x["effectiveness_score"], reverse=True)


analytics_engine = AdvancedAnalyticsService()
