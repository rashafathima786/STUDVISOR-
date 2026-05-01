from backend.app.database import SessionLocal
from backend.app.models import Student, Subject, Attendance, Mark
db = SessionLocal()
print(f"Students: {db.query(Student).count()}")
print(f"Subjects: {db.query(Subject).count()}")
print(f"Attendance: {db.query(Attendance).count()}")
print(f"Marks: {db.query(Mark).count()}")
db.close()
