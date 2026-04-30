"""Auth routes — login, register, refresh, profile."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.database import get_db
from backend.core.security import verify_password, create_access_token, create_refresh_token, get_current_student, get_current_user, decode_token
from backend.app.crud import get_student_by_username, create_student
from backend.app.models import Student, Faculty, Admin

router = APIRouter(tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str = None

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Demo logic
    if data.username.lower() == "demo" and data.password.lower() == "demo":
        role = data.role or "student"
        # Force a generic ID for demo
        entity_id = 9999
        name = "Demo " + role.capitalize()
        token = create_access_token({"sub": "demo", "role": role, "entity_id": entity_id})
        refresh = create_refresh_token({"sub": "demo", "role": role, "entity_id": entity_id})
        return {"access_token": token, "refresh_token": refresh, "role": role, "user": {"id": entity_id, "name": name, "department": "Demo Dept"}}

    # Try student
    user = db.query(Student).filter(func.lower(Student.username) == data.username.lower()).first()
    if user and verify_password(data.password, user.hashed_password):
        token = create_access_token({"sub": user.username, "role": "student", "entity_id": user.id})
        refresh = create_refresh_token({"sub": user.username, "role": "student", "entity_id": user.id})
        return {"access_token": token, "refresh_token": refresh, "role": "student", "user": {"id": user.id, "name": user.full_name, "department": user.department}}

    # Try faculty
    fac = db.query(Faculty).filter(func.lower(Faculty.username) == data.username.lower()).first()
    if fac and fac.hashed_password and verify_password(data.password, fac.hashed_password):
        role = "hod" if fac.designation and "HOD" in fac.designation.upper() else "faculty"
        token = create_access_token({"sub": fac.username, "role": role, "entity_id": fac.id})
        refresh = create_refresh_token({"sub": fac.username, "role": role, "entity_id": fac.id})
        return {"access_token": token, "refresh_token": refresh, "role": role, "user": {"id": fac.id, "name": fac.name, "department": fac.department}}

    # Try admin
    adm = db.query(Admin).filter(func.lower(Admin.username) == data.username.lower()).first()
    if adm and verify_password(data.password, adm.hashed_password):
        token = create_access_token({"sub": adm.username, "role": "admin", "entity_id": adm.id})
        refresh = create_refresh_token({"sub": adm.username, "role": "admin", "entity_id": adm.id})
        return {"access_token": token, "refresh_token": refresh, "role": "admin", "user": {"id": adm.id, "name": adm.full_name}}

    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if get_student_by_username(db, data.username):
        raise HTTPException(400, "Username already exists")
    student = create_student(db, data.username, data.email, data.password, data.full_name)
    token = create_access_token({"sub": student.username, "role": "student", "entity_id": student.id})
    return {"access_token": token, "role": "student", "user": {"id": student.id, "name": student.full_name}}

@router.post("/refresh")
def refresh_token(token: str, db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")
    new_token = create_access_token({"sub": payload["sub"], "role": payload["role"], "entity_id": payload["entity_id"]})
    return {"access_token": new_token}

@router.get("/student/me")
def student_profile(student=Depends(get_current_student)):
    return {"id": student.id, "username": student.username, "full_name": student.full_name, "email": student.email, "department": student.department, "semester": student.semester, "merit_points": student.merit_points, "merit_tier": student.merit_tier, "batch_year": student.batch_year, "section": student.section, "roll_number": student.roll_number}
