from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import Mark, Subject, Student, GPARecord, Attendance
from backend.services.gpa_service import gpa_service, percentage_to_grade
from backend.services.predictive_service import predictive_service
from collections import defaultdict
from typing import Dict

class AnalyticsService:
    def get_performance_summary(self, db: Session, student_id: int):
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return None

        # 1. Metrics
        gpa_data = gpa_service.get_cgpa(db, student_id)
        current_cgpa = gpa_data["cgpa"]
        
        # Calculate total credits earned (where avg marks >= 40%)
        # Note: This is a simplified calculation
        passing_subjects = db.query(Subject.credits)\
            .join(Mark, Mark.subject_id == Subject.id)\
            .filter(Mark.student_id == student_id)\
            .group_by(Subject.id)\
            .having(func.avg(Mark.marks_obtained / Mark.max_marks) >= 0.4)\
            .all()
        total_credits = sum(s[0] for s in passing_subjects)
        
        standing = "Good Standing"
        if current_cgpa < 6.0: standing = "Academic Probation"
        if current_cgpa < 4.0: standing = "Critical Risk"
        if current_cgpa >= 9.0: standing = "Dean's List"

        metrics = {
            "current_cgpa": current_cgpa,
            "total_credits_earned": int(total_credits),
            "standing": standing
        }

        # 2. Risk Flags
        risks = predictive_service.compute_all_risks(db, student_id)
        risk_flags = []
        for signal in risks["dropout_risk"]["signals"] + risks["academic_risk"]["signals"]:
            risk_flags.append({
                "type": "Academic" if any(x in signal.lower() for x in ["marks", "fail", "score"]) else "Engagement",
                "message": signal,
                "severity": "Danger" if risks["combined_score"] > 0.6 else "Warning"
            })

        # 3. CGPA Trend
        records = db.query(GPARecord).filter(GPARecord.student_id == student_id).order_by(GPARecord.semester).all()
        if records:
            cgpa_trend = [{"semester": r.semester, "sgpa": r.gpa, "cgpa": r.cgpa} for r in records]
        else:
            # Fallback trend from Marks
            cgpa_trend = []
            for sem_info in gpa_data["semesters"]:
                cgpa_trend.append({
                    "semester": sem_info["semester"], 
                    "sgpa": sem_info["sgpa"], 
                    "cgpa": sem_info["sgpa"] # Simplified: SGPA as CGPA for single data point
                })

        # 4. Subjects Mastery (Current Semester)
        current_sem = student.semester
        marks = db.query(Mark).filter(Mark.student_id == student_id, Mark.semester == str(current_sem)).all()
        subj_stats = defaultdict(lambda: {"obtained": 0.0, "max": 0.0, "name": ""})
        
        for m in marks:
            subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
            if not subj: continue
            subj_stats[m.subject_id]["obtained"] += m.marks_obtained
            subj_stats[m.subject_id]["max"] += m.max_marks
            subj_stats[m.subject_id]["name"] = subj.name
        
        subjects = []
        for sid, d in subj_stats.items():
            subjects.append({
                "subject_id": sid,
                "subject_name": d["name"],
                "total_marks": round(d["obtained"], 1),
                "max_marks": round(d["max"], 1)
            })

        return {
            "metrics": metrics,
            "risk_flags": risk_flags,
            "cgpa_trend": cgpa_trend,
            "subjects": subjects
        }

    def predict_future_cgpa(self, db: Session, student_id: int, expected_marks: Dict[int, float]):
        """
        Simulate CGPA by replacing/adding expected marks for current semester.
        """
        # Get past marks (all semesters except current)
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student: return None
        
        current_sem = student.semester
        past_marks = db.query(Mark).filter(Mark.student_id == student_id, Mark.semester != str(current_sem)).all()
        
        sem_data = defaultdict(lambda: {"tc": 0, "wp": 0})
        
        # Process past marks
        for m in past_marks:
            subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
            if not subj: continue
            pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
            grade = percentage_to_grade(pct)
            sem_data[m.semester]["tc"] += subj.credits
            sem_data[m.semester]["wp"] += grade["point"] * subj.credits
            
        # Current CGPA calculation (baseline)
        curr_tc = sum(d["tc"] for d in sem_data.values())
        curr_wp = sum(d["wp"] for d in sem_data.values())
        current_cgpa = curr_wp / curr_tc if curr_tc > 0 else 0
        
        # Simulated marks for current semester
        for subj_id, marks in expected_marks.items():
            subj = db.query(Subject).filter(Subject.id == int(subj_id)).first()
            if not subj: continue
            
            # Assume marks is a total or percentage. Frontend seems to send total marks.
            # We'll treat it as percentage of 100 if max_marks is not known, but we usually know max_marks.
            # For simplicity, if max_marks is provided by frontend or known:
            max_marks = 100.0 # Default
            pct = (marks / max_marks) * 100
            grade = percentage_to_grade(pct)
            
            sem_data[current_sem]["tc"] += subj.credits
            sem_data[current_sem]["wp"] += grade["point"] * subj.credits
            
        total_tc = sum(d["tc"] for d in sem_data.values())
        total_wp = sum(d["wp"] for d in sem_data.values())
        projected_cgpa = total_wp / total_tc if total_tc > 0 else 0
        
        return {
            "current_cgpa": round(current_cgpa, 2),
            "projected_cgpa": round(projected_cgpa, 2),
            "target_points_gained": round(max(0, projected_cgpa - current_cgpa) * 10, 1) # Arbitrary point system
        }

analytics_service = AnalyticsService()
