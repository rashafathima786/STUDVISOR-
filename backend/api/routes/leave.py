"""Leave management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import LeaveRequest

router = APIRouter(prefix="/leave", tags=["Leave"])

class LeaveCreate(BaseModel):
    leave_type: str
    from_date: str
    to_date: str
    reason: str

@router.get("/requests")
def my_leaves(student=Depends(get_current_student), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).order_by(LeaveRequest.applied_on.desc()).all()
    return {"leaves": [{"id": l.id, "type": l.leave_type, "from": l.from_date, "to": l.to_date, "reason": l.reason, "status": l.status} for l in leaves]}

@router.post("/requests")
def apply_leave(data: LeaveCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    leave = LeaveRequest(student_id=student.id, leave_type=data.leave_type, from_date=data.from_date, to_date=data.to_date, reason=data.reason)
    db.add(leave)
    db.commit()
    return {"message": "Leave applied", "id": leave.id}

@router.delete("/requests/{leave_id}")
def withdraw_leave(leave_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id, LeaveRequest.student_id == student.id, LeaveRequest.status == "Pending").first()
    if not leave: raise HTTPException(404, "Leave not found or already actioned")
    db.delete(leave)
    db.commit()
    return {"message": "Leave withdrawn"}

@router.get("/balance")
def leave_balance(student=Depends(get_current_student), db: Session = Depends(get_db)):
    approved = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id, LeaveRequest.status.in_(["Faculty_Approved", "HOD_Approved", "Approved"])).all()
    used = {"Medical": 0, "Personal": 0, "OD": 0, "Other": 0}
    for l in approved:
        t = l.leave_type if l.leave_type in used else "Other"
        used[t] = used.get(t, 0) + 1
    limits = {"Medical": 15, "Personal": 10, "OD": 20, "Other": 5}
    return {"balance": {k: {"used": used.get(k, 0), "limit": limits.get(k, 5), "remaining": limits.get(k, 5) - used.get(k, 0)} for k in limits}}
