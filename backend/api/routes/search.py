"""
Global Search API — integrated search across all system modules.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Student, Faculty, Event, LibraryBook, PlacementDrive, Subject
from typing import List, Dict

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/")
def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """Search for anything: student names, books, events, or faculty."""
    q_filter = f"%{q}%"
    
    # 1. Students
    students = db.query(Student).filter(Student.full_name.ilike(q_filter)).limit(5).all()
    
    # 2. Faculty
    faculty = db.query(Faculty).filter(Faculty.name.ilike(q_filter)).limit(5).all()
    
    # 3. Library
    books = db.query(LibraryBook).filter(LibraryBook.title.ilike(q_filter)).limit(5).all()
    
    # 4. Events
    events = db.query(Event).filter(Event.title.ilike(q_filter)).limit(5).all()
    
    # 5. Placement
    drives = db.query(PlacementDrive).filter(PlacementDrive.company_name.ilike(q_filter)).limit(5).all()
    
    # 6. Subjects
    subjects = db.query(Subject).filter(Subject.name.ilike(q_filter)).limit(5).all()
    
    return {
        "query": q,
        "results": {
            "students": [{"id": s.id, "name": s.full_name, "dept": s.department} for s in students],
            "faculty": [{"id": f.id, "name": f.name, "dept": f.department} for f in faculty],
            "books": [{"id": b.id, "title": b.title, "author": b.author} for b in books],
            "events": [{"id": e.id, "title": e.title, "date": str(e.event_date)} for e in events],
            "placement": [{"id": d.id, "company": d.company_name, "role": d.role_title} for d in drives],
            "subjects": [{"id": s.id, "name": s.name, "code": s.code} for s in subjects]
        }
    }
