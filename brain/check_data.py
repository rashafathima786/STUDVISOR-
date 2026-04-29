from backend.app.database import SessionLocal
from backend.app.models import Subject, SyllabusTopic, Student, TimetableSlot

db = SessionLocal()
try:
    s = db.query(Student).filter(Student.full_name.ilike('%Tejaswini%')).first()
    print(f"Student: {s.full_name}, Semester: {s.semester}, Institution: {s.institution_id}")
    
    subs = db.query(Subject).filter(Subject.semester == s.semester).all()
    print(f"Subjects for Semester {s.semester}: {len(subs)}")
    for sub in subs:
        topics = db.query(SyllabusTopic).filter(SyllabusTopic.subject_id == sub.id).all()
        print(f"  - {sub.name} ({sub.code}): {len(topics)} topics")
        
    from datetime import datetime
    today = datetime.now().strftime("%A")
    slots = db.query(TimetableSlot).filter(TimetableSlot.semester == s.semester, TimetableSlot.day == today).all()
    print(f"Timetable slots for {today}: {len(slots)}")
    for slot in slots:
        sub = db.query(Subject).filter(Subject.id == slot.subject_id).first()
        print(f"  - Hour {slot.hour}: {sub.name if sub else 'Unknown'}")

finally:
    db.close()
