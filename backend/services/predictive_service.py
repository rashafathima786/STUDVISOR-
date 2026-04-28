"""
Predictive Academic Intervention Engine — nightly risk scoring.
Three-axis risk model: Dropout, Academic Failure, Disengagement.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import defaultdict
import math

from backend.app.models import (
    Student, Attendance, Mark, LeaveRequest, Assignment, AssignmentSubmission,
    Subject, StudentFee
)


class PredictiveService:

    def compute_dropout_risk(self, db: Session, student_id: int) -> dict:
        """
        Dropout Risk = weighted(attendance_slope, missed_deadlines, fee_arrears, login_gap)
        Score 0.0 (safe) → 1.0 (critical)
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"score": 0, "signals": []}

        signals = []
        score = 0.0

        # 1. Attendance slope (weight: 0.35)
        records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
        if len(records) >= 20:
            first_half = records[:len(records)//2]
            second_half = records[len(records)//2:]
            pct1 = sum(1 for r in first_half if r.status == "P") / len(first_half) * 100
            pct2 = sum(1 for r in second_half if r.status == "P") / len(second_half) * 100
            slope = pct2 - pct1  # negative = declining

            if slope < -15:
                score += 0.35
                signals.append(f"Attendance declining sharply: {pct1:.0f}% → {pct2:.0f}%")
            elif slope < -5:
                score += 0.20
                signals.append(f"Attendance declining: {pct1:.0f}% → {pct2:.0f}%")

        # 2. Missed assignment deadlines (weight: 0.25)
        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == student_id
        ).all()
        total_assignments = db.query(Assignment).count()
        if total_assignments > 0:
            submission_rate = len(submissions) / total_assignments
            if submission_rate < 0.3:
                score += 0.25
                signals.append(f"Only {len(submissions)}/{total_assignments} assignments submitted")
            elif submission_rate < 0.6:
                score += 0.15
                signals.append(f"Assignment submission rate: {submission_rate:.0%}")

        # 3. Fee arrears (weight: 0.25)
        overdue = db.query(StudentFee).filter(
            StudentFee.student_id == student_id,
            StudentFee.status.in_(["Overdue", "Pending"])
        ).all()
        overdue_amount = sum(f.amount_due - f.amount_paid for f in overdue)
        if overdue_amount > 50000:
            score += 0.25
            signals.append(f"Outstanding fees: ₹{overdue_amount:,.0f}")
        elif overdue_amount > 10000:
            score += 0.15
            signals.append(f"Pending fees: ₹{overdue_amount:,.0f}")

        # 4. Overall attendance (weight: 0.15)
        if records:
            overall_pct = sum(1 for r in records if r.status == "P") / len(records) * 100
            if overall_pct < 50:
                score += 0.15
                signals.append(f"Overall attendance critically low: {overall_pct:.1f}%")
            elif overall_pct < 65:
                score += 0.08
                signals.append(f"Overall attendance below safe level: {overall_pct:.1f}%")

        return {
            "score": min(round(score, 2), 1.0),
            "risk_level": "CRITICAL" if score >= 0.7 else "HIGH" if score >= 0.5 else "MODERATE" if score >= 0.3 else "LOW",
            "signals": signals,
        }

    def compute_academic_risk(self, db: Session, student_id: int) -> dict:
        """
        Academic Failure Risk = weighted(cia_trend, subject_attendance, submission_rate)
        """
        signals = []
        score = 0.0

        # CIA marks trend
        marks = db.query(Mark).filter(Mark.student_id == student_id).order_by(Mark.date_published).all()
        if len(marks) >= 4:
            first_half = marks[:len(marks)//2]
            second_half = marks[len(marks)//2:]
            avg1 = sum(m.marks_obtained/m.max_marks*100 for m in first_half) / len(first_half)
            avg2 = sum(m.marks_obtained/m.max_marks*100 for m in second_half) / len(second_half)
            if avg2 < avg1 - 15:
                score += 0.4
                signals.append(f"Marks declining: {avg1:.0f}% → {avg2:.0f}%")
            elif avg2 < avg1 - 5:
                score += 0.2
                signals.append(f"Slight marks decline: {avg1:.0f}% → {avg2:.0f}%")

        # Failing subjects (below 40%)
        subject_marks = defaultdict(list)
        for m in marks:
            pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
            subject_marks[m.subject_id].append(pct)

        failing = 0
        for sid, pcts in subject_marks.items():
            avg = sum(pcts) / len(pcts)
            if avg < 40:
                failing += 1
                subj = db.query(Subject).filter(Subject.id == sid).first()
                signals.append(f"Failing in {subj.name if subj else 'Unknown'}: avg {avg:.0f}%")

        if failing >= 3:
            score += 0.4
        elif failing >= 1:
            score += 0.2

        # Subject-specific attendance
        records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
        subj_att = defaultdict(lambda: {"t": 0, "p": 0})
        for r in records:
            subj_att[r.subject_id]["t"] += 1
            if r.status == "P":
                subj_att[r.subject_id]["p"] += 1

        low_att_subjects = 0
        for sid, d in subj_att.items():
            pct = d["p"] / d["t"] * 100 if d["t"] > 0 else 100
            if pct < 60:
                low_att_subjects += 1

        if low_att_subjects >= 3:
            score += 0.2
            signals.append(f"{low_att_subjects} subjects with attendance below 60%")

        return {
            "score": min(round(score, 2), 1.0),
            "risk_level": "CRITICAL" if score >= 0.65 else "HIGH" if score >= 0.45 else "MODERATE" if score >= 0.25 else "LOW",
            "signals": signals,
        }

    def compute_all_risks(self, db: Session, student_id: int) -> dict:
        dropout = self.compute_dropout_risk(db, student_id)
        academic = self.compute_academic_risk(db, student_id)

        # Combined risk
        combined = round((dropout["score"] * 0.5 + academic["score"] * 0.5), 2)
        intervention = None

        if combined >= 0.7:
            intervention = "URGENT: Schedule counselling session. Notify advisor and HOD."
        elif combined >= 0.5:
            intervention = "Alert faculty advisor. Generate AI tutoring plan."
        elif combined >= 0.3:
            intervention = "Send personalized engagement nudges and study resources."

        return {
            "student_id": student_id,
            "dropout_risk": dropout,
            "academic_risk": academic,
            "combined_score": combined,
            "recommended_intervention": intervention,
        }

    def batch_risk_assessment(self, db: Session) -> list:
        """Run risk assessment for ALL students. Nightly batch job."""
        students = db.query(Student).all()
        results = []
        for s in students:
            risk = self.compute_all_risks(db, s.id)
            if risk["combined_score"] >= 0.3:  # Only return at-risk students
                risk["student_name"] = s.full_name
                risk["department"] = s.department
                risk["semester"] = s.semester
                results.append(risk)
        return sorted(results, key=lambda x: x["combined_score"], reverse=True)


predictive_service = PredictiveService()
