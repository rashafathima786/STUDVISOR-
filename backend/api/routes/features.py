"""All campus feature routes in one file — complaints, notifications, merit, timetable, analytics, assignments, exams, syllabus, notes, polls, events, announcements, faculty, lost-found, achievements, leaderboard."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from collections import defaultdict
from pydantic import BaseModel
from typing import Optional, Dict
from backend.core.security import get_current_student, require_role
from backend.app.database import get_db
from backend.app.models import *

# Create all routers
complaint_router = APIRouter(prefix="/complaints", tags=["Complaints"])
notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])
merit_router = APIRouter(prefix="/merit", tags=["Merit"])
timetable_router = APIRouter(prefix="/timetable", tags=["Timetable"])
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])
assignment_router = APIRouter(prefix="/assignments", tags=["Assignments"])
exam_router = APIRouter(prefix="/exams", tags=["Exams"])
syllabus_router = APIRouter(prefix="/syllabus", tags=["Syllabus"])
notes_router = APIRouter(prefix="/notes", tags=["Notes"])
poll_router = APIRouter(prefix="/polls", tags=["Polls"])
event_router = APIRouter(prefix="/events", tags=["Events"])
announcement_router = APIRouter(prefix="/announcements", tags=["Announcements"])
faculty_router = APIRouter(prefix="/faculty", tags=["Faculty Directory"])
lost_found_router = APIRouter(prefix="/lost-found", tags=["Lost & Found"])
achievement_router = APIRouter(prefix="/achievements", tags=["Achievements"])
leaderboard_router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])
peer_matching_router = APIRouter(prefix="/peer-matching", tags=["AI Peer Matching"])
helpdesk_router = APIRouter(prefix="/helpdesk", tags=["Helpdesk"])

# ─── HELPDESK ───────────────────────────────────────────────────────────────
@helpdesk_router.get("/faqs/")
def get_faqs():
    return {"faqs": [
        {"id": 1, "question": "How do I apply for OD?", "answer": "Navigate to the Services Hub, select Leave & OD Portal, and fill out the request form with necessary documents."},
        {"id": 2, "question": "Where can I find my semester results?", "answer": "Results are available in the Academics Hub under the 'Results' section once published by the HOD."},
        {"id": 3, "question": "How to pay tuition fees online?", "answer": "Go to the Financial Terminal (Fees) and use the secure payment gateway to pay your pending dues."},
        {"id": 4, "question": "Whom should I contact for library issues?", "answer": "You can contact the Librarian at cabin L-102 or use the ticket system in the Helpdesk."},
        {"id": 5, "question": "Can I update my profile details?", "answer": "Basic profile details can be updated in Settings. For critical changes, contact the Registrar office."}
    ]}

@helpdesk_router.get("/stats/")
def get_helpdesk_stats(student=Depends(get_current_student), db: Session = Depends(get_db)):
    active_tickets = db.query(Complaint).filter(Complaint.student_id == student.id, Complaint.status != "Resolved").count()
    resolved_tickets = db.query(Complaint).filter(Complaint.student_id == student.id, Complaint.status == "Resolved").count()
    return {"active_tickets": active_tickets, "resolved_tickets": resolved_tickets}

# ─── PEER MATCHING ──────────────────────────────────────────────────────────
@peer_matching_router.get("/matches/")
async def find_matches(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI matches student with others who are strong in subjects where this student is weak."""
    from backend.app.models import Mark, Subject
    from backend.services.ai_service import ai_service
    
    # Find student's weak subjects (avg < 50)
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    subject_marks = defaultdict(list)
    for m in marks:
        subject_marks[m.subject_id].append(m.marks_obtained / m.max_marks * 100)
    
    weak_subjects = []
    for sid, pcts in subject_marks.items():
        if sum(pcts)/len(pcts) < 50:
            subj = db.query(Subject).filter(Subject.id == sid).first()
            if subj: weak_subjects.append(subj.name)
            
    if not weak_subjects:
        return {"matches": [], "message": "You are performing great in all subjects! You can be a mentor."}
        
    # Find other students who are strong in these subjects
    potential_matches = []
    for ws_name in weak_subjects:
        subj = db.query(Subject).filter(Subject.name == ws_name).first()
        if not subj: continue
        
        strong_students = db.query(Student.full_name, Student.department, func.avg(Mark.marks_obtained/Mark.max_marks*100).label("avg_score"))\
            .join(Mark, Mark.student_id == Student.id)\
            .filter(Mark.subject_id == subj.id, Student.id != student.id)\
            .group_by(Student.id)\
            .having(func.avg(Mark.marks_obtained/Mark.max_marks*100) >= 80)\
            .limit(3).all()
            
        for s in strong_students:
            potential_matches.append({
                "name": s.full_name,
                "department": s.department,
                "strong_in": ws_name,
                "expertise_level": "Expert" if s.avg_score >= 90 else "Advanced",
                "match_reason": f"They scored {s.avg_score:.0f}% in {ws_name}."
            })
            
    return {"weak_subjects": weak_subjects, "matches": potential_matches[:10]}

# ─── COMPLAINTS ──────────────────────────────────────────────────────────────
@complaint_router.get("/")
def list_complaints(student=Depends(get_current_student), db: Session = Depends(get_db)):
    items = db.query(Complaint).filter(Complaint.student_id == student.id).order_by(Complaint.created_at.desc()).all()
    return {"complaints": [{"id": c.id, "title": c.title, "category": c.category, "urgency": c.urgency, "status": c.status, "response": c.admin_response} for c in items]}

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str = "general"
    urgency: str = "Medium"

@complaint_router.post("/")
def create_complaint(data: ComplaintCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    from backend.services.sentiment_service import sentiment_service
    analysis = sentiment_service.analyze(data.description)
    
    # Auto-escalate if sentiment is highly negative or contains toxic keywords
    urgency = data.urgency
    if analysis["sentiment"] == "Negative" and analysis["score"] > 0.8:
        urgency = "High"
        
    c = Complaint(
        student_id=student.id, 
        title=data.title, 
        description=data.description, 
        category=data.category, 
        urgency=urgency,
        # Store sentiment metadata if possible (need column)
    )
    db.add(c)
    db.commit()
    return {"message": "Complaint submitted", "id": c.id, "ai_urgency_assigned": urgency}

# ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
@notification_router.get("/")
def list_notifs(student=Depends(get_current_student), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == student.id).order_by(Notification.created_at.desc()).limit(50).all()
    return {"notifications": [{"id": n.id, "title": n.title, "body": n.body, "type": n.type, "read": n.read_at is not None, "created_at": str(n.created_at)} for n in notifs]}

# ─── MERIT ───────────────────────────────────────────────────────────────────
@merit_router.get("/my/")
def my_merit(student=Depends(get_current_student), db: Session = Depends(get_db)):
    logs = db.query(MeritLog).filter(MeritLog.student_id == student.id).order_by(MeritLog.created_at.desc()).all()
    return {"points": student.merit_points, "tier": student.merit_tier, "history": [{"points": l.points, "reason": l.reason, "date": str(l.created_at)} for l in logs]}

@merit_router.get("/status/")
def my_merit_status(student=Depends(get_current_student)):
    return {"points": student.merit_points, "tier": student.merit_tier}

# ─── TIMETABLE ───────────────────────────────────────────────────────────────
@timetable_router.get("/today/")
def get_today_timetable(student=Depends(get_current_student), db: Session = Depends(get_db)):
    from datetime import datetime
    today = datetime.now().strftime("%A")  # e.g. "Monday"
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.semester == student.semester,
        TimetableSlot.day == today
    ).order_by(TimetableSlot.hour).all()
    result = []
    for s in slots:
        subj = db.query(Subject).filter(Subject.id == s.subject_id).first()
        fac = db.query(Faculty).filter(Faculty.id == s.faculty_id).first()
        result.append({"day": s.day, "hour": s.hour, "subject": subj.name if subj else "?", "code": subj.code if subj else "?", "faculty": fac.name if fac else "?", "room": s.room})
    return {"timetable": result, "day": today}

@timetable_router.get("/")
def get_timetable(student=Depends(get_current_student), db: Session = Depends(get_db)):
    slots = db.query(TimetableSlot).filter(TimetableSlot.semester == student.semester).order_by(TimetableSlot.day, TimetableSlot.hour).all()
    result = []
    for s in slots:
        subj = db.query(Subject).filter(Subject.id == s.subject_id).first()
        fac = db.query(Faculty).filter(Faculty.id == s.faculty_id).first()
        result.append({"day": s.day, "hour": s.hour, "subject": subj.name if subj else "?", "code": subj.code if subj else "?", "faculty": fac.name if fac else "?", "room": s.room})
    return {"timetable": result}

@timetable_router.post("/generate/")
def generate_timetable(semester: int, section: str, _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Admin triggers AI timetable generation for a section."""
    from backend.services.timetable_service import conflict_resolver
    count = conflict_resolver.generate_timetable(db, semester, section)
    return {"message": f"Successfully generated {count} slots for {section} (Semester {semester})"}

# ─── ANALYTICS ───────────────────────────────────────────────────────────────
class PredictCgpaRequest(BaseModel):
    expected_marks: Dict[int, float]

@analytics_router.get("/performance/")
def get_performance(student=Depends(get_current_student), db: Session = Depends(get_db)):
    from backend.services.analytics_service import analytics_service
    res = analytics_service.get_performance_summary(db, student.id)
    if not res: raise HTTPException(404, "Student performance data not found")
    return res

@analytics_router.post("/predict-cgpa/")
def predict_cgpa_post(data: PredictCgpaRequest, student=Depends(get_current_student), db: Session = Depends(get_db)):
    from backend.services.analytics_service import analytics_service
    return analytics_service.predict_future_cgpa(db, student.id, data.expected_marks)

@analytics_router.get("/performance/")
async def student_performance_overview(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Summary of student performance for the dashboard."""
    print(f"[DEBUG] Fetching performance overview for student {student.id} ({student.username})")
    from backend.services.gpa_service import gpa_service
    
    # 1. Get CGPA
    cgpa_data = gpa_service.get_cgpa(db, student.id)
    cgpa = cgpa_data.get("cgpa", 0.0)
    
    # 2. Get Overall Attendance
    from backend.app.models import Attendance
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    att_pct = round(present / total * 100, 1) if total > 0 else 0
    
    # 3. Generate Insight
    performance_text = "Good"
    if cgpa >= 9.0: performance_text = "Excellent"
    elif cgpa >= 8.0: performance_text = "Very Good"
    elif cgpa < 6.0: performance_text = "Needs Improvement"
    
    insight = f"Based on your {cgpa} CGPA and {att_pct}% attendance, you are performing at a '{performance_text}' level."
    if att_pct < 75:
        insight += " Warning: Low attendance might impact your eligibility for exams."
    elif cgpa >= 8.5:
        insight += " You are eligible for the Dean's Honor List."
        
    return {
        "recent_performance": performance_text,
        "ai_insight": insight
    }

# ─── ASSIGNMENTS ─────────────────────────────────────────────────────────────
@assignment_router.get("/")
def list_assignments(student=Depends(get_current_student), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).order_by(Assignment.due_date.desc()).all()
    submissions = {s.assignment_id for s in db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student.id).all()}
    
    result = []
    for a in assignments:
        subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
        sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == a.id, AssignmentSubmission.student_id == student.id).first()
        
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "max_marks": a.max_marks,
            "subject": subj.name if subj else "General",
            "status": "Submitted" if sub else "Pending",
            "submitted": sub is not None,
            "submitted_at": str(sub.submitted_at) if sub else None,
            "grade": sub.grade if sub else None
        })
    return {"assignments": result}

@assignment_router.post("/{aid}/submit/")
def submit_assignment(aid: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    if not db.query(Assignment).filter(Assignment.id == aid).first():
        raise HTTPException(404, "Assignment not found")
    existing = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == aid, AssignmentSubmission.student_id == student.id).first()
    if existing: raise HTTPException(400, "Already submitted")
    db.add(AssignmentSubmission(assignment_id=aid, student_id=student.id))
    db.commit()
    return {"message": "Assignment submitted"}

# ─── EXAMS ───────────────────────────────────────────────────────────────────
@exam_router.get("/")
def list_exams(db: Session = Depends(get_db)):
    exams = db.query(ExamSchedule).order_by(ExamSchedule.exam_date).all()
    result = []
    for e in exams:
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first()
        result.append({"id": e.id, "subject": subj.name if subj else "?", "type": e.exam_type, "date": e.exam_date, "time": e.start_time, "venue": e.venue})
    return {"exams": result}

@exam_router.get("/upcoming/")
def upcoming_exams(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    today = datetime.now().strftime("%Y-%m-%d")
    week = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    exams = db.query(ExamSchedule).filter(ExamSchedule.exam_date >= today, ExamSchedule.exam_date <= week).all()
    result = []
    for e in exams:
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first()
        result.append({"subject": subj.name if subj else "?", "type": e.exam_type, "date": e.exam_date, "venue": e.venue})
    return {"upcoming": result}

# ─── SYLLABUS ────────────────────────────────────────────────────────────────
@syllabus_router.get("/")
def get_syllabus(student=Depends(get_current_student), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.semester == student.semester).all()
    result = []
    for s in subjects:
        topics = db.query(SyllabusTopic).filter(SyllabusTopic.subject_id == s.id).order_by(SyllabusTopic.unit).all()
        result.append({"subject": s.name, "code": s.code, "topics": [{"unit": t.unit, "name": t.name, "hours": t.hours} for t in topics]})
    return {"syllabus": result}

# ─── NOTES ───────────────────────────────────────────────────────────────────
@notes_router.get("/")
def list_notes(db: Session = Depends(get_db)):
    notes = db.query(Note).order_by(Note.created_at.desc()).limit(50).all()
    return {"notes": [{"id": n.id, "title": n.title, "file_url": n.file_url, "helpful": n.helpful_count, "not_helpful": n.not_helpful_count} for n in notes]}

@notes_router.post("/{nid}/rate/")
def rate_note(nid: int, helpful: bool = True, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == nid).first()
    if not note: raise HTTPException(404, "Note not found")
    if helpful: note.helpful_count += 1
    else: note.not_helpful_count += 1
    db.commit()
    return {"message": "Rated"}

# ─── POLLS ───────────────────────────────────────────────────────────────────
@poll_router.get("/")
def list_polls(db: Session = Depends(get_db)):
    polls = db.query(Poll).order_by(Poll.created_at.desc()).limit(20).all()
    result = []
    for p in polls:
        options = db.query(PollOption).filter(PollOption.poll_id == p.id).all()
        result.append({"id": p.id, "question": p.question, "options": [{"id": o.id, "text": o.option_text, "votes": o.vote_count} for o in options]})
    return {"polls": result}

@poll_router.post("/{pid}/vote/")
def vote(pid: int, option_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    existing = db.query(PollVote).filter(PollVote.poll_id == pid, PollVote.student_id == student.id).first()
    if existing: raise HTTPException(400, "Already voted")
    option = db.query(PollOption).filter(PollOption.id == option_id, PollOption.poll_id == pid).first()
    if not option: raise HTTPException(404, "Option not found")
    db.add(PollVote(poll_id=pid, student_id=student.id, option_id=option_id))
    option.vote_count += 1
    db.commit()
    return {"message": "Vote recorded"}

@event_router.get("/")
def list_events(db: Session = Depends(get_db)):
    return {"events": [{
        "id": e.id, 
        "title": e.title, 
        "description": e.description, 
        "date": e.event_date,
        "event_date": e.event_date,
        "venue": e.venue,
        "location": e.venue
    } for e in db.query(Event).order_by(Event.event_date.desc()).all()]}

@event_router.post("/{eid}/rsvp/")
def rsvp(eid: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    if db.query(EventRSVP).filter(EventRSVP.event_id == eid, EventRSVP.student_id == student.id).first():
        raise HTTPException(400, "Already RSVP'd")
    db.add(EventRSVP(event_id=eid, student_id=student.id))
    db.commit()
    return {"message": "RSVP confirmed"}

# ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
@announcement_router.get("/")
def list_announcements(db: Session = Depends(get_db)):
    return {"announcements": [{"id": a.id, "title": a.title, "content": a.content, "scope": a.target_scope, "date": str(a.created_at)} for a in db.query(Announcement).order_by(Announcement.created_at.desc()).limit(20).all()]}

# ─── FACULTY DIRECTORY ───────────────────────────────────────────────────────
@faculty_router.get("/directory/")
def faculty_directory(db: Session = Depends(get_db)):
    return {"faculty": [{"id": f.id, "name": f.name, "department": f.department, "designation": f.designation, "subjects": f.subjects_teaching, "cabin": f.cabin, "email": f.email} for f in db.query(Faculty).filter(Faculty.is_active == True).order_by(Faculty.name).all()]}

# ─── LOST & FOUND ────────────────────────────────────────────────────────────
@lost_found_router.get("/")
def list_lost_found(db: Session = Depends(get_db)):
    return {"items": [{
        "id": i.id, 
        "item": i.item_name, 
        "item_name": i.item_name, 
        "description": i.description, 
        "type": i.type, 
        "location": i.location, 
        "status": i.status, 
        "date": str(i.created_at)
    } for i in db.query(LostFound).order_by(LostFound.created_at.desc()).limit(30).all()]}

class LostFoundCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    type: str = "lost"
    location: Optional[str] = None

@lost_found_router.post("/")
def report_item(data: LostFoundCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    item = LostFound(student_id=student.id, **data.model_dump())
    db.add(item)
    db.commit()
    return {"message": "Item reported", "id": item.id}

# ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────
@achievement_router.get("/my/")
def my_achievements(student=Depends(get_current_student), db: Session = Depends(get_db)):
    achs = db.query(Achievement).filter(Achievement.student_id == student.id).order_by(Achievement.earned_at.desc()).all()
    return {"achievements": [{"badge": a.badge_name, "xp": a.xp, "earned": str(a.earned_at)} for a in achs]}

@achievement_router.get("/")
def all_achievements(student=Depends(get_current_student), db: Session = Depends(get_db)):
    return my_achievements(student, db)

# ─── LEADERBOARD ─────────────────────────────────────────────────────────────
@leaderboard_router.get("/")
def leaderboard(db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.is_active == True).order_by(Student.merit_points.desc()).limit(25).all()
    return {"leaderboard": [{"rank": i+1, "name": s.full_name, "department": s.department, "points": s.merit_points, "tier": s.merit_tier} for i, s in enumerate(students)]}

# ─── PLACEMENT DRIVES (student view) ─────────────────────────────────────────
placement_student_router = APIRouter(prefix="/placement", tags=["Placement Student"])

@placement_student_router.get("/drives/")
def list_placement_drives(db: Session = Depends(get_db)):
    drives = db.query(PlacementDrive).filter(PlacementDrive.status == "Open").order_by(PlacementDrive.drive_date).all()
    return {"drives": [{
        "id": d.id, "company": d.company_name, "role": d.role_title,
        "package_lpa": d.package_lpa, "description": d.description,
        "requirements": d.job_requirements,
        "min_cgpa": d.eligibility_cgpa, "departments": d.eligible_departments,
        "backlogs": d.eligibility_backlog,
        "drive_date": d.drive_date, "last_date": d.last_date_apply, "status": d.status,
        "location": d.location, "company_rating": d.company_rating, "company_logo_url": d.company_logo_url
    } for d in drives]}

@placement_student_router.post("/apply/{drive_id}")
def apply_to_drive(drive_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    existing = db.query(PlacementApplication).filter(
        PlacementApplication.drive_id == drive_id,
        PlacementApplication.student_id == student.id
    ).first()
    if existing:
        return {"message": "Already applied", "id": existing.id}
    app = PlacementApplication(drive_id=drive_id, student_id=student.id, institution_id=student.institution_id)
    db.add(app)
    db.commit()
    return {"message": "Application submitted", "id": app.id}

@placement_student_router.get("/my-applications/")
def my_placement_applications(student=Depends(get_current_student), db: Session = Depends(get_db)):
    apps = db.query(PlacementApplication).filter(PlacementApplication.student_id == student.id).all()
    drives = {d.id: d for d in db.query(PlacementDrive).all()}
    return {"applications": [{
        "id": a.id, "drive_id": a.drive_id,
        "company_name": drives[a.drive_id].company_name if a.drive_id in drives else "Unknown",
        "role_title": drives[a.drive_id].role_title if a.drive_id in drives else "Role",
        "package_lpa": drives[a.drive_id].package_lpa if a.drive_id in drives else None,
        "location": drives[a.drive_id].location if a.drive_id in drives else "Unknown",
        "company_logo_url": drives[a.drive_id].company_logo_url if a.drive_id in drives else None,
        "status": a.status, "applied_at": str(a.applied_at)
    } for a in apps]}

# ─── FEES (student view) ──────────────────────────────────────────────────────
fees_student_router = APIRouter(prefix="/fees", tags=["Fees Student"])

@fees_student_router.get("/my-fees/")
def my_fees_legacy(student=Depends(get_current_student), db: Session = Depends(get_db)):
    fees = db.query(StudentFee).filter(StudentFee.student_id == student.id).all()
    structures = {fs.id: fs for fs in db.query(FeeStructure).all()}
    return {
        "fees": [{
            "id": f.id, "fee_name": structures.get(f.fee_structure_id, {}).name if f.fee_structure_id and f.fee_structure_id in structures else "Fee",
            "category": structures.get(f.fee_structure_id, {}).category if f.fee_structure_id and f.fee_structure_id in structures else "General",
            "amount_due": f.amount_due, "amount_paid": f.amount_paid,
            "due_date": str(f.due_date), "status": f.status
        } for f in fees]
    }

@fees_student_router.get("/summary/")
def fee_summary_v2(student=Depends(get_current_student), db: Session = Depends(get_db)):
    fees = db.query(StudentFee).filter(StudentFee.student_id == student.id).all()
    total_due = sum(f.amount_due for f in fees)
    total_paid = sum(f.amount_paid for f in fees)
    overdue_count = sum(1 for f in fees if f.status == "Overdue")
    return {
        "total_due": total_due,
        "total_paid": total_paid,
        "total_balance": total_due - total_paid,
        "overdue_count": overdue_count
    }

@fees_student_router.post("/pay/")
def pay_fee_v2(fee_id: int, amount: float, student=Depends(get_current_student), db: Session = Depends(get_db)):
    fee = db.query(StudentFee).filter(StudentFee.id == fee_id, StudentFee.student_id == student.id).first()
    if not fee: raise HTTPException(404, "Fee record not found")
    fee.amount_paid += amount
    if fee.amount_paid >= fee.amount_due: fee.status = "Paid"
    
    payment = Payment(student_id=student.id, student_fee_id=fee_id, amount=amount, payment_method="Gateway")
    db.add(payment)
    db.commit()
    return {"message": "Payment successful", "balance": fee.amount_due - fee.amount_paid}

@fees_student_router.get("/payments/")
def payment_history_v2(student=Depends(get_current_student), db: Session = Depends(get_db)):
    history = db.query(Payment).filter(Payment.student_id == student.id).order_by(Payment.paid_at.desc()).all()
    return {"payments": [{
        "id": p.id, "amount": p.amount, "payment_method": p.payment_method,
        "transaction_id": p.transaction_id, "paid_at": str(p.paid_at),
        "receipt_number": f"REC-{p.id:05d}"
    } for p in history]}

# ─── LIBRARY (student view) ───────────────────────────────────────────────────
library_student_router = APIRouter(prefix="/library", tags=["Library Student"])

@library_student_router.get("/books/")
def list_books(search: str = "", db: Session = Depends(get_db)):
    q = db.query(LibraryBook)
    if search:
        q = q.filter(LibraryBook.title.ilike(f"%{search}%") | LibraryBook.author.ilike(f"%{search}%"))
    books = q.order_by(LibraryBook.title).limit(50).all()
    return {"books": [{
        "id": b.id, "title": b.title, "author": b.author, "isbn": b.isbn,
        "category": b.category, "department": b.department,
        "available": b.available_copies, "total": b.total_copies, "shelf": b.shelf_location
    } for b in books]}

@library_student_router.get("/my-books/")
def my_issued_books(student=Depends(get_current_student), db: Session = Depends(get_db)):
    issues = db.query(BookIssue).filter(BookIssue.student_id == student.id).order_by(BookIssue.issue_date.desc()).all()
    books = {b.id: b for b in db.query(LibraryBook).all()}
    return {"issued_books": [{
        "id": i.id, "book": books[i.book_id].title if i.book_id in books else "Unknown",
        "author": books[i.book_id].author if i.book_id in books else "",
        "issued": i.issue_date, "due": i.due_date, "returned": i.return_date,
        "status": i.status, "fine": i.fine_amount
    } for i in issues]}

# ─── LEAVE (student view) ────────────────────────────────────────────────────
leave_student_router = APIRouter(prefix="/leave", tags=["Leave Student"])

class LeaveCreate(BaseModel):
    leave_type: str
    from_date: str
    to_date: str
    reason: Optional[str] = None

@leave_student_router.get("/my/")
def my_leaves(student=Depends(get_current_student), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).order_by(LeaveRequest.applied_on.desc()).all()
    return {"leaves": [{
        "id": l.id, "type": l.leave_type, "from": l.from_date, "to": l.to_date,
        "reason": l.reason, "status": l.status, "applied": str(l.applied_on)
    } for l in leaves]}

@leave_student_router.post("/apply/")
def apply_leave(data: LeaveCreate, student=Depends(get_current_student), db: Session = Depends(get_db)):
    leave = LeaveRequest(student_id=student.id, institution_id=student.institution_id, **data.model_dump())
    db.add(leave)
    db.commit()
    return {"message": "Leave applied", "id": leave.id}

