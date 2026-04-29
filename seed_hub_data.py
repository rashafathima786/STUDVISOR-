from backend.app.database import SessionLocal
from backend.app.models import (
    Student, Subject, Assignment, TimetableSlot, SyllabusTopic, 
    ExamSchedule, Note, LectureLog, Faculty, AssignmentSubmission,
    AnonPost, Event, Poll, PollOption, Announcement, LostFound,
    Attendance, GPARecord, Mark
)
from datetime import datetime, timedelta
import random

def seed():
    db = SessionLocal()
    try:
        # 1. Find the student Tejaswini
        tejaswini = db.query(Student).filter(Student.full_name.ilike("%Tejaswini%")).first()
        if not tejaswini:
            print("Student Tejaswini not found. Creating a default student...")
            tejaswini = Student(
                username="tejaswini",
                full_name="Tejaswini",
                email="tejaswini@example.com",
                hashed_password="hashed_password", # dummy
                semester=4,
                department="Computer Science",
                institution_id="default"
            )
            db.add(tejaswini)
            db.commit()
            db.refresh(tejaswini)
        
        print(f"Found/Created student: {tejaswini.full_name} (ID: {tejaswini.id}, Sem: {tejaswini.semester})")
        
        # 2. Find or create a Faculty
        faculty = db.query(Faculty).first()
        if not faculty:
            faculty = Faculty(name="Dr. Smith", department="Computer Science", institution_id="default")
            db.add(faculty)
            db.commit()
            db.refresh(faculty)

        # 3. Create some Subjects for her semester
        subject_data = [
            {"code": "CS401", "name": "Operating Systems", "credits": 4},
            {"code": "CS402", "name": "Database Management", "credits": 4},
            {"code": "CS403", "name": "Computer Networks", "credits": 3},
            {"code": "CS404", "name": "Theory of Computation", "credits": 4},
        ]
        
        subjects = []
        for s in subject_data:
            existing = db.query(Subject).filter(Subject.code == s["code"]).first()
            if not existing:
                sub = Subject(**s, semester=tejaswini.semester, institution_id="default")
                db.add(sub)
                subjects.append(sub)
            else:
                subjects.append(existing)
        db.commit()
        for s in subjects: db.refresh(s)

        # --- ACADEMICS HUB DATA ---

        # 4. Create Timetable Slots for today
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        today_name = datetime.now().strftime("%A")
        
        # Clear existing slots for today to avoid clutter
        db.query(TimetableSlot).filter(TimetableSlot.day == today_name, TimetableSlot.semester == tejaswini.semester).delete()
        
        for i, sub in enumerate(subjects[:3]):
            slot = TimetableSlot(
                subject_id=sub.id,
                faculty_id=faculty.id,
                day=today_name,
                hour=i + 1,
                room=f"LHC-{100+i}",
                semester=tejaswini.semester,
                institution_id="default"
            )
            db.add(slot)
        
        # 5. Create Assignments
        db.query(Assignment).delete()
        # One pending
        pending_assignment = Assignment(
            faculty_id=faculty.id,
            subject_id=subjects[0].id,
            title="OS Process Scheduling Lab",
            description="Implement Round Robin and Priority scheduling algorithms in C.",
            due_date=(datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            institution_id="default"
        )
        db.add(pending_assignment)
        
        # One submitted
        submitted_assignment = Assignment(
            faculty_id=faculty.id,
            subject_id=subjects[1].id,
            title="SQL Normalization Exercise",
            description="Normalize the given schema to 3NF and BCNF.",
            due_date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            institution_id="default"
        )
        db.add(submitted_assignment)
        db.commit()
        db.refresh(submitted_assignment)
        
        db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == tejaswini.id).delete()
        submission = AssignmentSubmission(
            assignment_id=submitted_assignment.id,
            student_id=tejaswini.id,
            status="Submitted",
            submitted_at=datetime.now() - timedelta(days=2),
            institution_id="default"
        )
        db.add(submission)

        # 6. Create Syllabus Topics
        db.query(SyllabusTopic).delete()
        for sub in subjects:
            for unit in range(1, 3):
                topic = SyllabusTopic(
                    subject_id=sub.id,
                    unit=unit,
                    name=f"Unit {unit} Essentials",
                    description=f"Core concepts of unit {unit} for {sub.name}",
                    institution_id="default"
                )
                db.add(topic)

        # 7. Create Exams
        db.query(ExamSchedule).delete()
        exam = ExamSchedule(
            subject_id=subjects[2].id,
            exam_type="Mid-Term",
            exam_date=(datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
            venue="Exam Hall A",
            semester=tejaswini.semester,
            institution_id="default"
        )
        db.add(exam)

        # 8. Create Notes
        db.query(Note).delete()
        note = Note(
            uploaded_by=tejaswini.id,
            subject_id=subjects[0].id,
            title="Operating Systems - Unit 1 Handout",
            file_url="https://example.com/notes/os1.pdf",
            institution_id="default"
        )
        db.add(note)

        # 9. Create Lecture Logs
        db.query(LectureLog).delete()
        log = LectureLog(
            faculty_id=faculty.id,
            subject_id=subjects[0].id,
            date=datetime.now().strftime("%Y-%m-%d"),
            hour=1,
            topic_covered="Introduction to Kernels and System Calls",
            methodology="PPT",
            institution_id="default"
        )
        db.add(log)

        # --- CAMPUS HUB DATA ---
        
        # 10. Anon Posts
        db.query(AnonPost).delete()
        posts = [
            "Anyone know if the library is open till 10 PM today?",
            "The cafeteria's new menu is actually pretty good! 🍱",
            "Looking for a study partner for Theory of Comp."
        ]
        for p in posts:
            db.add(AnonPost(session_hash="dummy", content=p, institution_id="default"))
            
        # 11. Events
        db.query(Event).delete()
        db.add(Event(
            title="Tech Symposium 2026",
            description="Annual technical festival featuring workshops and hackathons.",
            event_date=(datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            venue="Main Auditorium",
            organizer="Computer Science Dept",
            institution_id="default"
        ))
        
        # 12. Polls
        db.query(Poll).delete()
        poll = Poll(question="Should we have a dedicated gaming room in the student center?", institution_id="default")
        db.add(poll)
        db.commit()
        db.refresh(poll)
        db.add(PollOption(poll_id=poll.id, option_text="Yes, absolutely!", vote_count=45, institution_id="default"))
        db.add(PollOption(poll_id=poll.id, option_text="Maybe, if space permits.", vote_count=20, institution_id="default"))
        db.add(PollOption(poll_id=poll.id, option_text="No, focus on academics.", vote_count=5, institution_id="default"))
        
        # 13. Announcements
        db.query(Announcement).delete()
        db.add(Announcement(
            title="Semester Registration Deadline",
            content="All students must complete their registration for the next semester by Friday.",
            target_scope="all",
            institution_id="default"
        ))
        
        # 14. Lost & Found
        db.query(LostFound).delete()
        db.add(LostFound(item_name="Blue Water Bottle", location="Library 2nd Floor", type="found", status="open", institution_id="default"))

        # --- PERFORMANCE HUB DATA ---
        
        # 15. GPA
        db.query(GPARecord).filter(GPARecord.student_id == tejaswini.id).delete()
        db.add(GPARecord(student_id=tejaswini.id, semester=1, gpa=8.5, cgpa=8.5, institution_id="default"))
        db.add(GPARecord(student_id=tejaswini.id, semester=2, gpa=8.8, cgpa=8.65, institution_id="default"))
        db.add(GPARecord(student_id=tejaswini.id, semester=3, gpa=9.0, cgpa=8.77, institution_id="default"))
        
        # 16. Marks (Results)
        db.query(Mark).filter(Mark.student_id == tejaswini.id).delete()
        for sub in subjects:
            db.add(Mark(
                student_id=tejaswini.id,
                subject_id=sub.id,
                marks_obtained=random.randint(75, 95),
                max_marks=100,
                assessment_type="Internal",
                semester=str(tejaswini.semester),
                published=True,
                institution_id="default"
            ))

        # 17. Attendance (for trends)
        db.query(Attendance).filter(Attendance.student_id == tejaswini.id).delete()
        # Add some attendance records over the last week
        for d in range(7):
            date_str = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
            for h in range(1, 5):
                db.add(Attendance(
                    student_id=tejaswini.id,
                    subject_id=subjects[h % len(subjects)].id,
                    date=date_str,
                    hour=h,
                    status="P" if random.random() > 0.1 else "A",
                    institution_id="default"
                ))

        db.commit()
        print("Successfully seeded all Hub data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
