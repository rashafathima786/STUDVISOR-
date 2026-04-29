from backend.app.database import SessionLocal
from backend.app.models import Student, Subject, Assignment, TimetableSlot, SyllabusTopic, Faculty, Attendance, GPARecord, Mark, AssignmentSubmission
from datetime import datetime, timedelta
import random

db = SessionLocal()
try:
    student = db.query(Student).filter(Student.full_name.ilike('%Tejaswini%')).first()
    if not student:
        print("Student not found")
        exit()
    
    inst = student.institution_id
    sem = student.semester
    
    # Get subjects for her semester
    subjects = db.query(Subject).filter(Subject.semester == sem).all()
    if not subjects:
        print(f"No subjects found for semester {sem}")
        exit()
        
    faculty = db.query(Faculty).first()
    if not faculty:
        faculty = Faculty(name="Dr. Smith", department=student.department, institution_id=inst)
        db.add(faculty)
        db.commit()
        db.refresh(faculty)
    
    # 1. Timetable for today
    today = datetime.now().strftime("%A")
    db.query(TimetableSlot).filter(TimetableSlot.day == today, TimetableSlot.semester == sem).delete()
    for i, sub in enumerate(subjects[:5]):
        slot = TimetableSlot(
            subject_id=sub.id,
            faculty_id=faculty.id,
            day=today,
            hour=i + 1,
            room=f"LHC-{100+i}",
            semester=sem,
            institution_id=inst
        )
        db.add(slot)
        
    # 2. Assignments
    db.query(Assignment).delete()
    for i, sub in enumerate(subjects[:2]):
        a = Assignment(
            faculty_id=faculty.id,
            subject_id=sub.id,
            title=f"{sub.name} Assignment {i+1}",
            description=f"Complete the exercises from chapter {i+1}.",
            due_date=(datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            institution_id=inst
        )
        db.add(a)
        
    # 3. Syllabus Progress (Topics)
    db.query(SyllabusTopic).delete()
    for sub in subjects:
        for unit in range(1, 6):
            topic = SyllabusTopic(
                subject_id=sub.id,
                unit=unit,
                name=f"Unit {unit}: Introduction to {sub.name}",
                description=f"Detailed syllabus for unit {unit}",
                institution_id=inst
            )
            db.add(topic)

    # 4. Exams
    from backend.app.models import ExamSchedule
    db.query(ExamSchedule).delete()
    for i, sub in enumerate(subjects[:3]):
        exam = ExamSchedule(
            subject_id=sub.id,
            exam_type="Internal Test" if i < 2 else "Final Exam",
            exam_date=(datetime.now() + timedelta(days=15+i)).strftime("%Y-%m-%d"),
            venue=f"Hall {101+i}",
            semester=sem,
            institution_id=inst
        )
        db.add(exam)

    # 5. Resources (Notes)
    from backend.app.models import Note
    db.query(Note).delete()
    for sub in subjects[:5]:
        n = Note(
            uploaded_by=student.id,
            subject_id=sub.id,
            title=f"{sub.name} - Complete Lecture Notes",
            file_url="https://example.com/notes.pdf",
            institution_id=inst
        )
        db.add(n)

    # 6. Lecture Logs
    from backend.app.models import LectureLog
    db.query(LectureLog).delete()
    for i, sub in enumerate(subjects[:3]):
        log = LectureLog(
            faculty_id=faculty.id,
            subject_id=sub.id,
            date=datetime.now().strftime("%Y-%m-%d"),
            hour=i + 1,
            topic_covered=f"Introduction to {sub.name} and its applications.",
            methodology="Lecture",
            institution_id=inst
        )
        db.add(log)

    # Seed data for all students in this institution
    students = db.query(Student).filter(Student.institution_id == inst).all()
    print(f"Seeding data for {len(students)} students...")

    for student in students:
        # Reset specific data for this student
        db.query(Attendance).filter(Attendance.student_id == student.id).delete()
        db.query(GPARecord).filter(GPARecord.student_id == student.id).delete()
        db.query(Mark).filter(Mark.student_id == student.id).delete()
        db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student.id).delete()

        # 7. Attendance
        for sub in subjects:
            # Seed 20 classes for each subject
            for day in range(1, 21):
                date = (datetime.now() - timedelta(days=day)).strftime("%Y-%m-%d")
                status = "P" if random.random() < 0.85 else "A"
                att = Attendance(
                    student_id=student.id,
                    subject_id=sub.id,
                    date=date,
                    hour=1,
                    status=status,
                    institution_id=inst
                )
                db.add(att)

        # 8. GPA & Marks
        gpa = GPARecord(
            student_id=student.id,
            semester=student.semester or 1,
            gpa=8.5,
            cgpa=8.5,
            institution_id=inst
        )
        db.add(gpa)

        for sub in subjects[:5]:
            mark = Mark(
                student_id=student.id,
                subject_id=sub.id,
                marks_obtained=random.randint(70, 95),
                max_marks=100,
                assessment_type="Internal",
                semester=str(student.semester or 1),
                published=True,
                institution_id=inst
            )
            db.add(mark)
            
        # 9. Assignment Submissions
        assignments = db.query(Assignment).filter(Assignment.institution_id == inst).all()
        for asn in assignments:
            subm = AssignmentSubmission(
                assignment_id=asn.id,
                student_id=student.id,
                status="Submitted",
                grade=random.randint(8, 10),
                institution_id=inst
            )
            db.add(subm)

    # 10. Anonymous Posts (Campus Wall)
    from backend.app.models import AnonPost
    db.query(AnonPost).delete()
    campus_posts = [
        ("Has anyone started the Physics assignment? The 3rd question is tricky!", "Questions"),
        ("The new cafe in the library is actually pretty good.", "General"),
        ("Good luck to everyone for the internal tests next week!", "General"),
        ("I found a blue water bottle in Hall 102. Keeping it at the security desk.", "General"),
        ("Can we have a hackathon this semester? @admin", "Questions"),
        ("The sunset from the terrace today was amazing 🌅", "General"),
        ("Does anyone have notes for Engineering Mathematics Unit 2?", "Questions")
    ]
    for content, cat in campus_posts:
        post = AnonPost(
            content=content,
            category=cat,
            session_hash="SEED_NODE_" + str(random.randint(1000, 9999)),
            institution_id=inst
        )
        db.add(post)

    db.commit()
    print(f"Successfully seeded complete data suite for {len(students)} students and campus wall.")

finally:
    db.close()
