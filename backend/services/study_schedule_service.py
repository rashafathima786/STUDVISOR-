"""
Study schedule generator — AI-powered personalized day-by-day study plan.
Weighted by: uncovered topics × exam weight × days remaining.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.app.models import Student, Subject, SyllabusTopic, ExamSchedule, Attendance
from collections import defaultdict


class StudyScheduleGenerator:

    def generate(self, db: Session, student_id: int, daily_hours: int = 4,
                 preferred_start: str = "18:00") -> dict:
        """Generate a day-by-day study schedule based on exam dates and syllabus coverage."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        today = datetime.now()
        upcoming_exams = db.query(ExamSchedule).filter(
            ExamSchedule.exam_date >= today.strftime("%Y-%m-%d"),
            ExamSchedule.semester == student.semester,
        ).order_by(ExamSchedule.exam_date).all()

        if not upcoming_exams:
            return {"schedule": [], "message": "No upcoming exams found"}

        # Build subject priority scores
        subject_priorities = []
        for exam in upcoming_exams:
            subj = db.query(Subject).filter(Subject.id == exam.subject_id).first()
            if not subj:
                continue

            topics = db.query(SyllabusTopic).filter(SyllabusTopic.subject_id == subj.id).all()
            total_topics = len(topics)

            # Calculate days until exam
            try:
                exam_date = datetime.strptime(exam.exam_date, "%Y-%m-%d")
                days_left = max((exam_date - today).days, 1)
            except:
                days_left = 14

            # Attendance check (lower attendance = more review needed)
            records = db.query(Attendance).filter(
                Attendance.student_id == student_id,
                Attendance.subject_id == subj.id
            ).all()
            att_pct = sum(1 for r in records if r.status == "P") / len(records) * 100 if records else 100
            att_penalty = 1.5 if att_pct < 60 else 1.2 if att_pct < 75 else 1.0

            # Priority = topics × credits × urgency × attendance_penalty
            urgency = max(1, 30 / days_left)  # Higher urgency for closer exams
            priority = total_topics * subj.credits * urgency * att_penalty

            subject_priorities.append({
                "subject_id": subj.id,
                "name": subj.name,
                "code": subj.code,
                "exam_date": exam.exam_date,
                "days_left": days_left,
                "total_topics": total_topics,
                "topics": [t.name for t in topics],
                "credits": subj.credits,
                "attendance": round(att_pct, 1),
                "priority": round(priority, 1),
            })

        # Sort by priority (highest first)
        subject_priorities.sort(key=lambda x: x["priority"], reverse=True)

        # Generate daily schedule
        schedule = []
        current_date = today + timedelta(days=1)
        topic_index = defaultdict(int)  # Track which topic we're on per subject

        for day_num in range(1, 31):
            date = current_date + timedelta(days=day_num - 1)
            if date.weekday() == 6:  # Skip Sunday
                continue

            day_plan = {
                "date": date.strftime("%Y-%m-%d"),
                "day": date.strftime("%A"),
                "sessions": [],
            }

            hours_remaining = daily_hours
            for sp in subject_priorities:
                if hours_remaining <= 0:
                    break
                if topic_index[sp["subject_id"]] >= sp["total_topics"]:
                    continue

                # Allocate hours proportional to priority
                alloc = min(2, hours_remaining)
                topic_idx = topic_index[sp["subject_id"]]
                topic_name = sp["topics"][topic_idx] if topic_idx < len(sp["topics"]) else "Revision"

                day_plan["sessions"].append({
                    "subject": sp["name"],
                    "topic": topic_name,
                    "duration_hours": alloc,
                    "start_time": preferred_start,
                    "study_tip": f"Focus on {topic_name}. Use active recall — close notes and test yourself.",
                })

                topic_index[sp["subject_id"]] += 1
                hours_remaining -= alloc

            if day_plan["sessions"]:
                schedule.append(day_plan)

        return {
            "student": student.full_name,
            "total_days": len(schedule),
            "daily_hours": daily_hours,
            "subjects": [{
                "name": sp["name"],
                "exam_date": sp["exam_date"],
                "priority": sp["priority"],
                "topics_count": sp["total_topics"],
            } for sp in subject_priorities],
            "schedule": schedule[:21],  # Max 3 weeks
        }


study_scheduler = StudyScheduleGenerator()
