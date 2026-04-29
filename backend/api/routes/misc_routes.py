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
    
    if category and category.lower() != "all":
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
            "reaction_count": len(reactions),
            "date": str(p.created_at),
            "created_at": str(p.created_at),
            "is_mine": p.session_hash == current_hash,
            "censored_content": p.censored_content,
            "session_hash": p.session_hash,
            "reply_count": db.query(AnonPost).filter(AnonPost.parent_id == p.id).count()
        })
    return {"posts": result}

@anon_chat_router.post("/posts")
async def create_post(data: AnonPostCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    from backend.services.sentiment_service import sentiment_service
    from backend.services.anonymity_service import compute_anon_id
    from backend.services.ai_service import ai_service
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
    db.refresh(post)

    # ── AI ENSEMBLE ASSISTANT TRIGGER ───────────────────────────────────────
    if data.category in ["Questions", "General"]:
        try:
            # 1. Get DB Context for this student (Personal + Campus)
            from backend.app.models import Attendance, ExamSchedule, Announcement, Subject
            from backend.services.gpa_service import gpa_service
            from datetime import datetime
            
            # Personal Context (Enhanced with Subject-wise data)
            att_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
            total_pct = "N/A"
            subject_details = "No data."
            
            if att_records:
                total_pct = round(sum(1 for r in att_records if r.status == "P")/len(att_records)*100, 1)
                # Subject breakdown
                from collections import defaultdict
                subj_data = defaultdict(lambda: {"t": 0, "p": 0})
                for r in att_records:
                    subj_data[r.subject_id]["t"] += 1
                    if r.status == "P": subj_data[r.subject_id]["p"] += 1
                
                details = []
                for sid, d in subj_data.items():
                    s = db.query(Subject).filter(Subject.id == sid).first()
                    p = round(d["p"]/d["t"]*100, 1)
                    details.append(f"{s.name if s else '?'}: {p}%")
                subject_details = " | ".join(details)

            cgpa = gpa_service.get_cgpa(db, student.id).get("cgpa", "N/A")
            
            # Campus Context
            upcoming_exams = db.query(ExamSchedule, Subject).join(Subject, ExamSchedule.subject_id == Subject.id)\
                .filter(ExamSchedule.exam_date >= datetime.now().strftime("%Y-%m-%d")).limit(2).all()
            exam_info = ", ".join([f"{s.name} on {e.exam_date}" for e, s in upcoming_exams]) if upcoming_exams else "No upcoming exams."
            
            recent_ann = db.query(Announcement).order_by(Announcement.created_at.desc()).limit(2).all()
            ann_info = " | ".join([f"{a.title}: {a.content[:100]}" for a in recent_ann]) if recent_ann else "No recent news."

            db_context = (
                f"Student Identity: {student.full_name} (ID: {student.id}). "
                f"Attendance: Overall {total_pct}%. Breakdown: {subject_details}. "
                f"Academic Stats: CGPA is {cgpa}. "
                f"Campus Schedule: Upcoming exams: {exam_info}. "
                f"Recent News: {ann_info}."
            )

            # 2. Call Ensemble Chat (Gemini Draft -> Groq Refine)
            ai_response = await ai_service.ensemble_chat(data.content, db_context)
            
            ai_post = AnonPost(
                session_hash="NEXUS_AI_BOT",
                content=ai_response,
                category=data.category,
                parent_id=post.id
            )
            db.add(ai_post)
            db.commit()
            print(f"DEBUG: Nexus AI Response generated and saved successfully.")
        except Exception as ai_err:
            print(f"AI Ensemble Auto-reply failed: {ai_err}")

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
