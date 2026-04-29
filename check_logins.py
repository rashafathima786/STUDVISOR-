from backend.app.database import SessionLocal
from backend.app.models import AuditLog, Student

def check_logins():
    db = SessionLocal()
    logins = db.query(AuditLog).filter(AuditLog.action.ilike("%LOGIN%")).order_by(AuditLog.timestamp.desc()).limit(5).all()
    print("Recent Logins:")
    for l in logins:
        student = db.query(Student).filter(Student.id == l.actor_id).first() if l.actor_role == "student" else None
        name = student.full_name if student else "N/A"
        print(f"Time: {l.timestamp}, ActorID: {l.actor_id}, Role: {l.actor_role}, Name: {name}")
    db.close()

if __name__ == "__main__":
    check_logins()
