"""Marks routes — student marks view."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import Mark, Subject

router = APIRouter(prefix="/marks", tags=["Marks"])

@router.get("/")
def get_marks(student=Depends(get_current_student), db: Session = Depends(get_db)):
    marks = db.query(Mark).filter(Mark.student_id == student.id, Mark.published == True).order_by(Mark.semester, Mark.subject_id).all()
    result = []
    for m in marks:
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        pct = round(m.marks_obtained / m.max_marks * 100, 1) if m.max_marks > 0 else 0
        result.append({"id": m.id, "subject": subj.name if subj else "?", "code": subj.code if subj else "?", "assessment": m.assessment_type, "obtained": m.marks_obtained, "max": m.max_marks, "percentage": pct, "semester": m.semester})
    return {"marks": result}
