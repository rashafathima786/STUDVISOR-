"""CRUD operations for database models."""
from sqlalchemy.orm import Session
from .models import Student
from backend.core.security import hash_password


def get_student_by_username(db: Session, username: str):
    return db.query(Student).filter(Student.username == username).first()

def create_student(db: Session, username: str, email: str, password: str, full_name: str):
    student = Student(
        username=username, email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student
