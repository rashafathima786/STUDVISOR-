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

class RefreshRequest(BaseModel):
    refresh_token: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

@router.post("/login/")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Unified login for Students, Faculty, and Admins.
    Prioritizes lookup based on the requested role.
    """
    username_lower = data.username.lower()
    requested_role = data.role.lower() if data.role else None

    # Helper to create standard response
    def auth_response(sub, role, entity_id, user_data):
        token = create_access_token({"sub": sub, "role": role, "entity_id": entity_id})
        refresh = create_refresh_token({"sub": sub, "role": role, "entity_id": entity_id})
        return {
            "access_token": token,
            "refresh_token": refresh,
            "role": role,
            "user": user_data
        }

    # 1. Attempt Faculty/Admin Login (Prioritized if role is faculty/hod/admin/college)
    if requested_role in ("faculty", "hod", "college", "admin"):
        # Try Admin
        adm = db.query(Admin).filter(func.lower(Admin.username) == username_lower).first()
        if adm and verify_password(data.password, adm.hashed_password):
            return auth_response(adm.username, "admin", adm.id, {"id": adm.id, "name": adm.full_name})

        # Try Faculty
        fac = db.query(Faculty).filter(func.lower(Faculty.username) == username_lower).first()
        if fac and verify_password(data.password, fac.hashed_password):
            role = "hod" if fac.designation and "HOD" in fac.designation.upper() else "faculty"
            return auth_response(fac.username, role, fac.id, {
                "id": fac.id, "name": fac.name, "department": fac.department
            })

    # 2. Attempt Student Login (Prioritized if role is student or not provided)
    if not requested_role or requested_role == "student":
        user = db.query(Student).filter(func.lower(Student.username) == username_lower).first()
        if user and verify_password(data.password, user.hashed_password):
            return auth_response(user.username, "student", user.id, {
                "id": user.id, "name": user.full_name, "department": user.department
            })

    # 3. Final Fallback - Try all tables if no role was provided or prioritized attempt failed
    if not requested_role:
        # Faculty check
        fac = db.query(Faculty).filter(func.lower(Faculty.username) == username_lower).first()
        if fac and verify_password(data.password, fac.hashed_password):
            role = "hod" if fac.designation and "HOD" in fac.designation.upper() else "faculty"
            return auth_response(fac.username, role, fac.id, {"id": fac.id, "name": fac.name, "department": fac.department})
        
        # Admin check
        adm = db.query(Admin).filter(func.lower(Admin.username) == username_lower).first()
        if adm and verify_password(data.password, adm.hashed_password):
            return auth_response(adm.username, "admin", adm.id, {"id": adm.id, "name": adm.full_name})

    # 4. Universal Demo Fallback (ONLY if NO real user matches and username starts with 'demo_')
    if username_lower.startswith("demo_"):
        role = requested_role or "student"
        return auth_response(data.username, role, 9999, {"id": 9999, "name": f"Demo {role.capitalize()}", "department": "Demo Dept"})

    raise HTTPException(status_code=401, detail="Invalid username or password")

@router.post("/register/")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if get_student_by_username(db, data.username):
        raise HTTPException(400, "Username already exists")
    student = create_student(db, data.username, data.email, data.password, data.full_name)
    token = create_access_token({"sub": student.username, "role": "student", "entity_id": student.id})
    return {"access_token": token, "role": "student", "user": {"id": student.id, "name": student.full_name}}

@router.post("/refresh/")
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")
    new_access = create_access_token({"sub": payload["sub"], "role": payload["role"], "entity_id": payload["entity_id"]})
    new_refresh = create_refresh_token({"sub": payload["sub"], "role": payload["role"], "entity_id": payload["entity_id"]})
    return {"access_token": new_access, "refresh_token": new_refresh}

@router.get("/student/me/")
def student_profile(student=Depends(get_current_student)):
    return {"id": student.id, "username": student.username, "full_name": student.full_name, "email": student.email, "department": student.department, "semester": student.semester, "merit_points": student.merit_points, "merit_tier": student.merit_tier, "batch_year": student.batch_year, "section": student.section, "roll_number": student.roll_number}
