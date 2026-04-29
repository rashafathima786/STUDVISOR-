from backend.app.database import SessionLocal
from backend.app.models import TimetableSlot, Assignment, Student, Subject
from datetime import datetime

def debug_db():
    db = SessionLocal()
    student = db.query(Student).filter(Student.full_name.ilike("%Tejaswini%")).first()
    print(f"Student: {student.full_name}, ID: {student.id}, Sem: {student.semester}")
    
    today = datetime.now().strftime("%A")
    print(f"Today according to Python: {today}")
    
    slots = db.query(TimetableSlot).all()
    print(f"Total Timetable Slots: {len(slots)}")
    for s in slots:
        subj = db.query(Subject).filter(Subject.id == s.subject_id).first()
        print(f"  Slot: {s.day}, Hour: {s.hour}, Sem: {s.semester}, Subject: {subj.name if subj else '?'}")
        
    assignments = db.query(Assignment).all()
    print(f"Total Assignments: {len(assignments)}")
    for a in assignments:
        print(f"  Assignment: {a.title}, Due: {a.due_date}")
        
    db.close()

if __name__ == "__main__":
    debug_db()
