from backend.app.database import SessionLocal
from backend.app.models import Student, AuditLog

def check_user():
    db = SessionLocal()
    users = db.query(Student).filter(Student.full_name.ilike("%Tejaswini%")).all()
    print("Students found:")
    for u in users:
        print(f"ID: {u.id}, Name: {u.full_name}, Username: {u.username}")
    
    last_audit = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    if last_audit:
        print(f"Last audit action: {last_audit.action} by ID: {last_audit.actor_id} ({last_audit.actor_role})")
    db.close()

if __name__ == "__main__":
    check_user()
