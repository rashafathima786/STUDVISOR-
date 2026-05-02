from backend.app.database import SessionLocal, engine
from backend.app.models import (
    Student, Subject, Faculty, Attendance, Mark, Assignment, 
    LectureLog, LeaveRequest, TimetableSlot, Base
)
from backend.core.security import hash_password
from datetime import datetime, timedelta
import random

def seed_sudha_data():
    db = SessionLocal()
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    try:
        # 1. Ensure Sudha exists or update her
        sudha = db.query(Faculty).filter(Faculty.name == "Sudha").first()
        if not sudha:
            sudha = Faculty(
                username="sudha",
                email="sudha@university.edu",
                hashed_password=hash_password("faculty123"),
                name="Sudha",
                department="BCA",
                designation="Assistant Professor",
                subjects_teaching="BCA101, BCA102",
                institution_id="default"
            )
            db.add(sudha)
            db.commit()
            db.refresh(sudha)
            print(f"Created/Verified Sudha: ID {sudha.id}")
        else:
            sudha.subjects_teaching = "BCA101, BCA102"
            sudha.department = "BCA"
            db.commit()
            print(f"Updated Sudha: ID {sudha.id}")

        # 2. Create Subjects for BCA 1st Year (Semester 1)
        subjects = []
        subject_list = [
            ("BCA101", "Introduction to Programming", 4, 1),
            ("BCA102", "Mathematics for Computing", 3, 1),
        ]
        
        for code, name, credits, sem in subject_list:
            sub = db.query(Subject).filter(Subject.code == code).first()
            if not sub:
                sub = Subject(
                    code=code,
                    name=name,
                    credits=credits,
                    semester=sem,
                    department="BCA",
                    institution_id="default"
                )
                db.add(sub)
                db.commit()
                db.refresh(sub)
            subjects.append(sub)

        # 3. Create Students for BCA Semester 1
        students = []
        for i in range(1, 11):
            username = f"bca_student_{i}"
            student = db.query(Student).filter(Student.username == username).first()
            if not student:
                student = Student(
                    username=username,
                    email=f"{username}@student.edu",
                    hashed_password=hash_password("student123"),
                    full_name=f"BCA Student {i}",
                    semester=1,
                    department="BCA",
                    institution_id="default"
                )
                db.add(student)
                db.commit()
                db.refresh(student)
            students.append(student)

        # 4. Add Timetable Slots for Sudha
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        for i, sub in enumerate(subjects):
            day = days[i % 5]
            # Check if slot exists
            exists = db.query(TimetableSlot).filter(
                TimetableSlot.faculty_id == sudha.id,
                TimetableSlot.day == day,
                TimetableSlot.hour == 1
            ).first()
            if not exists:
                db.add(TimetableSlot(
                    faculty_id=sudha.id,
                    subject_id=sub.id,
                    day=day,
                    hour=1,
                    room="Room 101",
                    section="A",
                    semester=1,
                    institution_id="default"
                ))

        # 5. Add historical Attendance (last 5 days)
        for sub in subjects:
            for d in range(1, 6):
                date_str = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
                for s in students:
                    exists = db.query(Attendance).filter(
                        Attendance.student_id == s.id,
                        Attendance.subject_id == sub.id,
                        Attendance.date == date_str
                    ).first()
                    if not exists:
                        # Create some defaulters (below 75%)
                        status = "P" if random.random() > (0.1 if s.id % 3 != 0 else 0.4) else "A"
                        db.add(Attendance(
                            student_id=s.id,
                            subject_id=sub.id,
                            date=date_str,
                            hour=1,
                            status=status,
                            marked_by=sudha.id,
                            institution_id="default"
                        ))

        # 6. Add Assignments
        for sub in subjects:
            exists = db.query(Assignment).filter(Assignment.subject_id == sub.id).first()
            if not exists:
                db.add(Assignment(
                    faculty_id=sudha.id,
                    subject_id=sub.id,
                    title=f"Initial Assignment for {sub.name}",
                    description="Please submit the basic implementation of sorting algorithms.",
                    due_date=(datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                    max_marks=100,
                    institution_id="default"
                ))

        # 7. Add Leave Requests for Sudha to approve
        pending_leave = db.query(LeaveRequest).filter(
            LeaveRequest.student_id == students[0].id,
            LeaveRequest.status == "Pending"
        ).first()
        if not pending_leave:
            db.add(LeaveRequest(
                student_id=students[0].id,
                leave_type="Personal",
                from_date=(datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
                to_date=(datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                reason="Sister's wedding ceremony",
                status="Pending",
                institution_id="default"
            ))

        # 8. Add some Lecture Logs for Sudha
        log_exists = db.query(LectureLog).filter(LectureLog.faculty_id == sudha.id).first()
        if not log_exists:
            db.add(LectureLog(
                faculty_id=sudha.id,
                subject_id=subjects[0].id,
                date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                hour=1,
                topic_covered="Basic Python Syntax and Variables",
                methodology="Live Coding",
                institution_id="default"
            ))

        db.commit()
        print("Data for Sudha populated successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding Sudha data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_sudha_data()
