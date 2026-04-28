"""Admin routes — dashboard, user mgmt, leave admin, reports."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.core.security import require_role
from backend.app.database import get_db
from backend.app.models import Student, Faculty, Admin, LeaveRequest, Complaint, Mark, Attendance, StudentFee, PlacementDrive, PlacementApplication, Subject

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard/v2")
def dashboard_v2(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Enterprise-grade integrated dashboard with cross-module analytics."""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # 1. Identity & Scale
    counts = {
        "students": db.query(Student).count(),
        "faculty": db.query(Faculty).count(),
        "subjects": db.query(Subject).count(),
        "admins": db.query(Admin).count()
    }
    
    # 2. Financial Health
    fees = db.query(
        func.sum(StudentFee.amount_due).label("total"),
        func.sum(StudentFee.amount_paid).label("collected")
    ).first()
    financials = {
        "total_due": fees.total or 0,
        "total_collected": fees.collected or 0,
        "collection_rate": round((fees.collected / fees.total * 100), 1) if fees.total and fees.total > 0 else 0,
        "overdue_count": db.query(StudentFee).filter(StudentFee.status == "Overdue").count()
    }
    
    # 3. Academic & Engagement
    today = datetime.now().strftime("%Y-%m-%d")
    daily_att = db.query(Attendance).filter(Attendance.date == today).all()
    campus_attendance = round(sum(1 for a in daily_att if a.status == "P") / len(daily_att) * 100, 1) if daily_att else 0
    
    academic = {
        "daily_attendance": campus_attendance,
        "at_risk_students": db.query(Student).filter(Student.id.in_(
            db.query(Attendance.student_id).group_by(Attendance.student_id).having(
                func.sum(func.case([(Attendance.status == 'P', 1)], else_=0)) / func.count(Attendance.id) < 0.75
            )
        )).count(),
        "open_complaints": db.query(Complaint).filter(Complaint.status == "Submitted").count(),
        "pending_leaves": db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    }
    
    # 4. Placement Activity
    placement = {
        "active_drives": db.query(PlacementDrive).filter(PlacementDrive.status == "Open").count(),
        "total_offers": db.query(PlacementApplication).filter(PlacementApplication.status == "Offered").count()
    }
    
    return {
        "counts": counts,
        "financials": financials,
        "academic": academic,
        "placement": placement,
        "system_status": "Healthy",
        "last_updated": str(datetime.now())
    }

@router.get("/students")
def list_students(dept: Optional[str] = None, _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    q = db.query(Student)
    if dept: q = q.filter(Student.department == dept)
    students = q.order_by(Student.full_name).all()
    return {"students": [{"id": s.id, "username": s.username, "name": s.full_name, "department": s.department, "semester": s.semester, "merit": s.merit_points} for s in students]}

class StudentCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    department: Optional[str] = None
    semester: Optional[int] = None

@router.post("/students")
def create_student(data: StudentCreate, _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    from backend.core.security import hash_password
    s = Student(username=data.username, email=data.email, hashed_password=hash_password(data.password), full_name=data.full_name, department=data.department, semester=data.semester)
    db.add(s)
    db.commit()
    return {"message": "Student created", "id": s.id}

@router.get("/faculty")
def list_faculty(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    return {"faculty": [{"id": f.id, "name": f.name, "department": f.department, "designation": f.designation, "subjects": f.subjects_teaching} for f in db.query(Faculty).order_by(Faculty.name).all()]}

@router.get("/leaves/pending")
def pending_leaves(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").order_by(LeaveRequest.applied_on.desc()).all()
    result = []
    for l in leaves:
        s = db.query(Student).filter(Student.id == l.student_id).first()
        result.append({"id": l.id, "student": s.full_name if s else "?", "type": l.leave_type, "from": l.from_date, "to": l.to_date, "reason": l.reason})
    return {"leaves": result}

@router.put("/leaves/{lid}")
def action_leave(lid: int, status: str = "Approved", _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == lid).first()
    if not leave: raise HTTPException(404, "Leave not found")
    leave.status = status
    db.commit()
    return {"message": f"Leave {status}"}

@router.get("/reports/attendance")
def attendance_report(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    from collections import defaultdict
    students = db.query(Student).all()
    dept_data = defaultdict(lambda: {"total": 0, "present": 0})
    for s in students:
        records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
        for r in records:
            dept_data[s.department or "Unknown"]["total"] += 1
            if r.status == "P": dept_data[s.department or "Unknown"]["present"] += 1
    return {"report": [{"department": d, "total": v["total"], "present": v["present"], "pct": round(v["present"]/v["total"]*100, 1) if v["total"] > 0 else 0} for d, v in sorted(dept_data.items())]}

@router.get("/reports/fees")
def fees_report(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    fees = db.query(StudentFee).all()
    total_due = sum(f.amount_due for f in fees)
    total_paid = sum(f.amount_paid for f in fees)
    return {"total_due": total_due, "total_collected": total_paid, "pending": total_due - total_paid, "overdue_count": sum(1 for f in fees if f.status == "Overdue")}
@router.get("/analytics/mood")
def mood_analytics(batch_year: Optional[int] = None, section: Optional[str] = None, _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Admin analytics for student wellbeing trends."""
    from backend.app.models import MoodCheckin
    q = db.query(MoodCheckin)
    if batch_year: q = q.filter(MoodCheckin.batch_year == batch_year)
    if section: q = q.filter(MoodCheckin.section == section)
    
    results = q.order_by(MoodCheckin.week_number.desc()).limit(20).all()
    return {
        "trends": [
            {
                "week": r.week_number,
                "avg_score": round(r.average_score, 2),
                "at_risk_count": r.low_mood_count,
                "total_responses": r.total_checkins,
                "status": "Healthy" if r.average_score >= 3.5 else "Concern" if r.average_score >= 2.5 else "Critical"
            } for r in results
        ]
    }
