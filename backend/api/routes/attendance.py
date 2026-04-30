"""Attendance routes — overall, subject-wise, heatmap, bunk alerts, simulate."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict
from typing import Optional
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import Attendance, Subject

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/overall/")
def overall(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    print(f"[DEBUG] Attendance for student {student.id} ({student.username}): found {len(records)} records")
    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    return {"total": total, "present": present, "absent": total - present, "percentage": round(present / total * 100, 1) if total > 0 else 0}

@router.get("/subject-wise/")
def subject_wise(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P": data[r.subject_id]["present"] += 1
    result = []
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        result.append({"subject_id": sid, "subject": subj.name if subj else "?", "code": subj.code if subj else "?", "total": d["total"], "present": d["present"], "percentage": pct, "below_75": pct < 75})
    return {"subjects": sorted(result, key=lambda x: x["percentage"])}

@router.get("/heatmap/")
def heatmap(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    daily = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        daily[r.date]["total"] += 1
        if r.status == "P": daily[r.date]["present"] += 1
    return {"heatmap": [{"date": d, "total": v["total"], "present": v["present"], "status": "full" if v["present"] == v["total"] else "partial" if v["present"] > 0 else "absent"} for d, v in sorted(daily.items())]}

@router.get("/missed-classes/")
def missed(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.status == "A").order_by(Attendance.date.desc()).all()
    result = []
    for r in records:
        subj = db.query(Subject).filter(Subject.id == r.subject_id).first()
        result.append({"date": r.date, "hour": r.hour, "subject": subj.name if subj else "?"})
    return {"missed": result[:50]}

@router.get("/bunk-alerts/")
def bunk_alerts(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P": data[r.subject_id]["present"] += 1
    
    alerts = []
    for sid, d in data.items():
        total = d["total"]
        present = d["present"]
        pct = round(present / total * 100, 1) if total > 0 else 100
        
        subj = db.query(Subject).filter(Subject.id == sid).first()
        subject_name = subj.name if subj else "Unknown Subject"
        
        # Calculation Logic:
        # Safe Bunks: present / (total + x) >= 0.75  => x <= (present / 0.75) - total
        # Required to Clear: (present + y) / (total + y) >= 0.75 => y >= 3*total - 4*present
        
        safe_bunks = int((present / 0.75) - total) if total > 0 else 0
        required_to_clear = max(0, 3 * total - 4 * present) if pct < 75 else 0
        
        level = "optimal" if pct >= 85 else "warning" if pct >= 75 else "critical"
        
        alerts.append({
            "subject_name": subject_name,
            "percentage": pct,
            "safe_bunks": max(0, safe_bunks),
            "required_to_clear": int(required_to_clear),
            "level": level,
            "total": total,
            "present": present
        })
    
    return {"alerts": sorted(alerts, key=lambda x: x["percentage"])}

@router.get("/simulate-bunk/")
def simulate(miss_count: int = 1, subject_id: Optional[int] = None, student=Depends(get_current_student), db: Session = Depends(get_db)):
    query = db.query(Attendance).filter(Attendance.student_id == student.id)
    if subject_id is not None:
        query = query.filter(Attendance.subject_id == subject_id)
    records = query.all()
    n = len(records)
    present = sum(1 for r in records if r.status == "P")
    miss_count = max(0, miss_count)
    simulated_total = n + miss_count
    return {
        "current_total": n,
        "current_present": present,
        "simulated_total": simulated_total,
        "simulated_present": present,
        "current_pct": round(present / n * 100, 1) if n > 0 else 0,
        "simulated_pct": round(present / simulated_total * 100, 1) if simulated_total > 0 else 0,
    }
