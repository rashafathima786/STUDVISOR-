from backend.app.database import SessionLocal, engine
from backend.app.models import (
    Student, Subject, Faculty, Attendance, Mark, Assignment, 
    LectureLog, LeaveRequest, Base
)
from backend.core.security import hash_password
from datetime import datetime, timedelta
import random

def seed_faculty_data():
    db = SessionLocal()
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    try:
        # 1. Create a Faculty member
        faculty_username = "dr_kumar"
        faculty = db.query(Faculty).filter(Faculty.username == faculty_username).first()
        if not faculty:
            faculty = Faculty(
                username=faculty_username,
                email="kumar@university.edu",
                hashed_password=hash_password("faculty123"),
                name="Dr. Rajesh Kumar",
                department="Computer Science",
                designation="Associate Professor",
                subjects_teaching="CS501, CS502, CS503",
                institution_id="default"
            )
            db.add(faculty)
            db.commit()
            db.refresh(faculty)
            print(f"Created Faculty: {faculty.name}")

        # 2. Create Subjects
        subjects = []
        subject_list = [
            ("CS501", "Advanced Algorithms", 4),
            ("CS502", "Machine Learning", 4),
            ("CS503", "Cloud Computing", 3),
        ]
        
        for code, name, credits in subject_list:
            sub = db.query(Subject).filter(Subject.code == code).first()
            if not sub:
                sub = Subject(
                    code=code,
                    name=name,
                    credits=credits,
                    semester=5,
                    department="Computer Science",
                    institution_id="default"
                )
                db.add(sub)
                db.commit()
                db.refresh(sub)
            subjects.append(sub)

        # 3. Create Students (5 students for testing)
        students = []
        for i in range(1, 6):
            username = f"student_{i}"
            student = db.query(Student).filter(Student.username == username).first()
            if not student:
                student = Student(
                    username=username,
                    email=f"{username}@student.edu",
                    hashed_password=hash_password("student123"),
                    full_name=f"Student Name {i}",
                    semester=5,
                    department="Computer Science",
                    institution_id="default"
                )
                db.add(student)
                db.commit()
                db.refresh(student)
            students.append(student)

        # 4. Add some historical data
        # Attendance for the last 3 days
        for sub in subjects:
            for d in range(1, 4):
                date_str = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
                for s in students:
                    # Avoid duplicates
                    exists = db.query(Attendance).filter(
                        Attendance.student_id == s.id,
                        Attendance.subject_id == sub.id,
                        Attendance.date == date_str
                    ).first()
                    if not exists:
                        db.add(Attendance(
                            student_id=s.id,
                            subject_id=sub.id,
                            date=date_str,
                            hour=1,
                            status="P" if random.random() > 0.1 else "A",
                            marked_by=faculty.id,
                            institution_id="default"
                        ))

        # 5. Add some Leave Requests
        pending_leave = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").first()
        if not pending_leave:
            db.add(LeaveRequest(
                student_id=students[0].id,
                leave_type="Medical",
                from_date=(datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
                to_date=(datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                reason="Severe fever and flu",
                status="Pending",
                institution_id="default"
            ))

        # 6. Add some Lecture Logs
        log_exists = db.query(LectureLog).filter(LectureLog.faculty_id == faculty.id).first()
        if not log_exists:
            db.add(LectureLog(
                faculty_id=faculty.id,
                subject_id=subjects[0].id,
                date=datetime.now().strftime("%Y-%m-%d"),
                hour=2,
                topic_covered="Complexity Analysis of Merge Sort",
                methodology="Whiteboard",
                institution_id="default"
            ))

        db.commit()
        print("Faculty Portal Seed Data populated successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding faculty data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_faculty_data()
