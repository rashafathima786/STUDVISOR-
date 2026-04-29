from backend.app.database import SessionLocal
from backend.app.models import Student, TimetableSlot, Assignment
from backend.api.routes.features import get_timetable, list_assignments

def simulate_api():
    db = SessionLocal()
    student = db.query(Student).filter(Student.full_name.ilike("%Tejaswini%")).first()
    
    print(f"Simulating API calls for {student.full_name} (ID: {student.id}, Sem: {student.semester})")
    
    # Simulate fetchTimetable
    timetable_resp = get_timetable(student=student, db=db)
    print(f"Timetable Response count: {len(timetable_resp['timetable'])}")
    for t in timetable_resp['timetable']:
        print(f"  {t['day']} {t['hour']}: {t['subject']}")
        
    # Simulate list_assignments
    assignments_resp = list_assignments(student=student, db=db)
    print(f"Assignments Response count: {len(assignments_resp['assignments'])}")
    for a in assignments_resp['assignments']:
        print(f"  {a['title']} - {a['status']}")
        
    db.close()

if __name__ == "__main__":
    simulate_api()
