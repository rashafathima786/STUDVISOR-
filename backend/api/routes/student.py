"""Student routes — attendance, marks, profile, analytics."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import Attendance, Mark, Subject, Student

router = APIRouter(prefix="/student", tags=["Student"])

@router.get("/profile/")
def profile(student=Depends(get_current_student)):
    return {"id": student.id, "username": student.username, "full_name": student.full_name, "email": student.email, "department": student.department, "semester": student.semester, "merit_points": student.merit_points, "merit_tier": student.merit_tier}
@router.post("/mood/checkin/")
def mood_checkin(score: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Anonymous mood check-in. Score 1-5."""
    if not (1 <= score <= 5):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")
        
    from backend.app.models import MoodRawCheckin
    from datetime import datetime
    
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    
    # Check if already submitted this week
    existing = db.query(MoodRawCheckin).filter(
        MoodRawCheckin.student_id == student.id,
        MoodRawCheckin.week_number == week_number
    ).first()
    
    if existing:
        existing.score = score
        existing.submitted_at = now
    else:
        db.add(MoodRawCheckin(
            student_id=student.id,
            institution_id=student.institution_id,
            score=score,
            week_number=week_number,
            academic_year="2025-26"
        ))
    db.commit()
    return {"message": "Mood checked in successfully. Thank you for sharing!"}
