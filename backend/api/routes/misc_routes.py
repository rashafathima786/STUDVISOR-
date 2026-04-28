"""Calendar, Documents, Bunk Alerts, Anon Chat — lightweight routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import AcademicCalendar, Attendance, Subject, AnonPost, AnonReaction
from collections import defaultdict
from pydantic import BaseModel

# Calendar
calendar_router = APIRouter(prefix="/calendar", tags=["Calendar"])
@calendar_router.get("/")
def get_calendar(db: Session = Depends(get_db)):
    days = db.query(AcademicCalendar).order_by(AcademicCalendar.date).all()
    return {"calendar": [{"date": d.date, "day": d.day_name, "working": d.is_working_day, "holiday": d.holiday_name, "note": d.note} for d in days]}

# Documents
documents_router = APIRouter(prefix="/documents", tags=["Documents"])
@documents_router.get("/")
def list_docs(student=Depends(get_current_student)):
    return {"documents": [{"type": "Bonafide Certificate", "url": f"/reports/bonafide/{student.id}"}, {"type": "Marksheet", "url": f"/reports/marksheet/{student.id}"}, {"type": "Attendance Certificate", "url": f"/reports/attendance-cert/{student.id}"}]}

# Bunk Alerts
bunk_alerts_router = APIRouter(prefix="/bunk-alerts", tags=["Bunk Alerts"])
@bunk_alerts_router.get("/")
def bunk_alerts(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"t": 0, "p": 0})
    for r in records:
        data[r.subject_id]["t"] += 1
        if r.status == "P": data[r.subject_id]["p"] += 1
    alerts = []
    for sid, d in data.items():
        pct = round(d["p"]/d["t"]*100, 1) if d["t"] > 0 else 100
        if pct < 75:
            subj = db.query(Subject).filter(Subject.id == sid).first()
            alerts.append({"subject": subj.name if subj else "?", "pct": pct, "level": "critical" if pct < 65 else "warning"})
    return {"alerts": alerts}

# Anonymous Chat / Campus Wall
anon_chat_router = APIRouter(prefix="/anon", tags=["Anonymous"])

class AnonPostCreate(BaseModel):
    content: str
    category: str = "general"

@anon_chat_router.get("/posts")
def list_posts(
    category: str = None, 
    sort: str = "recent", 
    student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    from backend.services.anonymity_service import compute_anon_id
    current_hash = compute_anon_id(student.id)
    
    query = db.query(AnonPost).filter(AnonPost.moderated == False)
    
    if category and category != "all":
        query = query.filter(AnonPost.category.ilike(category))
    
    if sort == "recent":
        query = query.order_by(AnonPost.created_at.desc())
    else:
        # Default fallback
        query = query.order_by(AnonPost.created_at.desc())
        
    posts = query.limit(50).all()
    result = []
    for p in posts:
        reactions = db.query(AnonReaction).filter(AnonReaction.post_id == p.id).all()
        reaction_counts = defaultdict(int)
        for r in reactions: reaction_counts[r.reaction_type] += 1
        
        result.append({
            "id": p.id, 
            "content": p.content, 
            "category": p.category, 
            "reactions": dict(reaction_counts), 
            "date": str(p.created_at),
            "is_mine": p.session_hash == current_hash,
            "censored_content": p.censored_content
        })
    return {"posts": result}

@anon_chat_router.post("/posts")
def create_post(data: AnonPostCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    from backend.services.sentiment_service import sentiment_service
    from backend.services.anonymity_service import compute_anon_id
    import hashlib
    
    # Analyze sentiment
    analysis = sentiment_service.analyze(data.content)
    
    session_hash = compute_anon_id(student.id)
    post = AnonPost(
        session_hash=session_hash, 
        content=data.content, 
        category=data.category,
        moderated=analysis["needs_moderation"],
        toxicity_score=analysis["toxicity_score"]
    )
    db.add(post)
    db.commit()
    
    return {
        "message": "Posted anonymously", 
        "moderated": post.moderated,
        "warning": "Post pending moderation due to community guidelines" if post.moderated else None
    }

class ReactionCreate(BaseModel):
    reaction_type: str

@anon_chat_router.post("/posts/{pid}/react")
def react(pid: int, data: ReactionCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    from backend.services.anonymity_service import compute_anon_id
    session_hash = compute_anon_id(student.id)
    
    # Check if already reacted
    existing = db.query(AnonReaction).filter(
        AnonReaction.post_id == pid,
        AnonReaction.session_hash == session_hash,
        AnonReaction.reaction_type == data.reaction_type
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Reaction removed"}
    
    new_react = AnonReaction(
        post_id=pid,
        session_hash=session_hash,
        reaction_type=data.reaction_type
    )
    db.add(new_react)
    db.commit()
    return {"message": "Reaction added"}

@anon_chat_router.post("/posts/{pid}/flag")
def flag(pid: int, db: Session = Depends(get_db)):
    post = db.query(AnonPost).filter(AnonPost.id == pid).first()
    if not post:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.flagged_count is None:
        post.flagged_count = 0
        
    post.flagged_count += 1
    if post.flagged_count > 5:
        post.moderated = True
    db.commit()
    return {"message": "Post flagged", "flagged_count": post.flagged_count}
