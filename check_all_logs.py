from backend.app.database import SessionLocal
from backend.app.models import AuditLog, Student
from datetime import datetime, timedelta

def check_all_logs():
    db = SessionLocal()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logs = db.query(AuditLog).filter(AuditLog.timestamp >= today).order_by(AuditLog.timestamp.desc()).limit(20).all()
    print(f"Recent Logs for Today ({today}):")
    for l in logs:
        print(f"Time: {l.timestamp}, Action: {l.action}, ActorID: {l.actor_id}, Role: {l.actor_role}")
    db.close()

if __name__ == "__main__":
    check_all_logs()
