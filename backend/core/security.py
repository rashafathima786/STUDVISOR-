"""
v2.0 Security Layer — JWT with refresh tokens, role extraction, and scope helpers.
Three-layer RBAC: JWT claim → route guard → service scope.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from backend.app.database import get_db

from backend.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

VALID_ROLES = {"student", "faculty", "hod", "admin", "parent"}


# ─── Password Hashing ───────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── Token Creation ──────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = {"sub": data["sub"], "role": data["role"], "entity_id": data["entity_id"]}
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# ─── Token Extraction ────────────────────────────────────────────────────────

def _extract_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extract and validate JWT payload. Raises 401 on failure."""
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("role") not in VALID_ROLES:
        raise HTTPException(status_code=401, detail="Invalid role in token")
    return payload


# ─── Role Guards (Infrastructure Layer) ──────────────────────────────────────

def require_student(payload: dict = Depends(_extract_payload)) -> dict:
    """Route-level guard: only students."""
    if payload["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access only")
    return payload

def require_faculty(payload: dict = Depends(_extract_payload)) -> dict:
    """Route-level guard: faculty or HOD."""
    if payload["role"] not in ("faculty", "hod"):
        raise HTTPException(status_code=403, detail="Faculty access only")
    return payload

def require_hod(payload: dict = Depends(_extract_payload)) -> dict:
    """Route-level guard: HOD only."""
    if payload["role"] != "hod":
        raise HTTPException(status_code=403, detail="HOD access only")
    return payload

def require_admin(payload: dict = Depends(_extract_payload)) -> dict:
    """Route-level guard: admin only."""
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return payload

def require_any(*roles):
    """Factory: guard for any of the specified roles."""
    def guard(payload: dict = Depends(_extract_payload)) -> dict:
        if payload["role"] not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {', '.join(roles)}")
        return payload
    return guard

require_role = require_any


# ─── Scope Helpers (Service Layer) ───────────────────────────────────────────

class RoleViolationError(Exception):
    """Raised when a service function detects cross-role data access."""
    pass

def scope_to_student(query, model, student_id: int):
    """Apply student-scoped WHERE clause. Prevents horizontal privilege escalation."""
    return query.filter(model.student_id == student_id)

def scope_to_faculty(query, model, faculty_id: int):
    """Apply faculty-scoped WHERE clause."""
    return query.filter(model.faculty_id == faculty_id)

def scope_to_department(query, model, department: str):
    """Apply department-scoped WHERE clause."""
    return query.filter(model.department == department)

def verify_ownership(actor_role: str, actor_id: int, resource_owner_id: int, resource_type: str):
    """Verify the actor owns the resource. Raises RoleViolationError on mismatch."""
    if actor_id != resource_owner_id:
        raise RoleViolationError(
            f"{actor_role}:{actor_id} attempted to access {resource_type} owned by {resource_owner_id}"
        )
# ─── Model Helpers (Route Layer) ───────────────────────────────────────────

def get_current_student(payload: dict = Depends(require_student), db: Session = Depends(get_db)):
    from backend.app.models import Student
    student = db.query(Student).filter(Student.id == payload.get("entity_id")).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

def get_current_faculty(payload: dict = Depends(require_faculty), db: Session = Depends(get_db)):
    from backend.app.models import Faculty
    faculty = db.query(Faculty).filter(Faculty.id == payload.get("entity_id")).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return faculty

def get_current_user(payload: dict = Depends(_extract_payload)):
    """Returns the raw payload for routes that only need basic identity."""
    return payload
