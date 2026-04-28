from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.security import get_current_user
from backend.app.database import get_db
from backend.app.models import LectureLog, Subject, Student, Faculty
from typing import List

router = APIRouter(prefix="/lecture-logs", tags=["Lecture Logs"])

@router.get("/my-logs")
def get_student_lecture_logs(student=Depends(get_current_user), db: Session = Depends(get_db)):
    # Students see logs for subjects in their current semester
    # And potentially restricted by section if we had that mapping, 
    # but for now we filter by subject semester.
    
    # Get subjects in student's semester
    subjects = db.query(Subject).filter(Subject.semester == student.semester).all()
    subject_ids = [s.id for s in subjects]
    
    if not subject_ids:
        return {"logs": []}
    
    logs = db.query(LectureLog).filter(LectureLog.subject_id.in_(subject_ids)).order_by(LectureLog.date.desc(), LectureLog.hour.desc()).all()
    
    result = []
    for l in logs:
        subj = next((s for s in subjects if s.id == l.subject_id), None)
        fac = db.query(Faculty).filter(Faculty.id == l.faculty_id).first()
        result.append({
            "id": l.id,
            "subject": subj.name if subj else "?",
            "code": subj.code if subj else "?",
            "faculty": fac.name if fac else "?",
            "date": l.date,
            "hour": l.hour,
            "topic_covered": l.topic_covered,
            "methodology": l.methodology,
            "remarks": l.remarks,
            "created_at": l.created_at
        })
        
    return {"logs": result}
