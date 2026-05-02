"""Faculty portal — attendance marking, grade upload, assignments, leave approval, announcements, AI insights."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from collections import defaultdict
from backend.core.security import get_current_faculty, require_role
from backend.app.database import get_db
from backend.app.models import *
from backend.app.schemas import LectureLogCreate

from datetime import datetime, timedelta

router = APIRouter(prefix="/faculty-portal", tags=["Faculty Portal"])

def verify_subject_ownership(faculty, subject_id: int, db: Session):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    codes = [s.strip() for s in (faculty.subjects_teaching or "").split(",") if s.strip()]
    if subject.code not in codes:
        raise HTTPException(status_code=403, detail=f"You do not teach {subject.code}")
    return subject

@router.get("/dashboard/")
def dashboard(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    subject_codes = [s.strip() for s in (faculty.subjects_teaching or "").split(",") if s.strip()]
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    return {"name": faculty.name, "department": faculty.department, "subjects_count": len(subject_codes), "pending_leaves": pending_leaves}

@router.get("/timetable/")
def faculty_timetable(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    slots = db.query(TimetableSlot, Subject.name)\
        .join(Subject, TimetableSlot.subject_id == Subject.id)\
        .filter(TimetableSlot.faculty_id == faculty.id)\
        .order_by(TimetableSlot.day, TimetableSlot.hour).all()
    
    result = [{"day": s.day, "hour": s.hour, "subject": name, "room": s.room, "section": s.section} for s, name in slots]
    return {"timetable": result}

@router.get("/my-subjects/")
def get_my_subjects(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    codes = [s.strip() for s in (faculty.subjects_teaching or "").split(",") if s.strip()]
    subjects = db.query(Subject).filter(Subject.code.in_(codes)).all()
    return {"subjects": [{"id": s.id, "name": s.name, "code": s.code} for s in subjects]}

@router.get("/students-by-subject/{sid}/")
def get_students_by_subject(sid: int, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    verify_subject_ownership(faculty, sid, db)
    subject = db.query(Subject).filter(Subject.id == sid).first()
    # In a real system, we'd check enrollment. Here we assume all students in same semester/dept.
    # We can filter by department if needed, but semester is more standard for subject enrollment.
    students = db.query(Student).filter(Student.semester == subject.semester).order_by(Student.full_name).all()
    return {"students": [{"id": s.id, "name": s.full_name, "username": s.username, "department": s.department, "semester": s.semester} for s in students]}

class AttendanceMarkRequest(BaseModel):
    subject_id: int
    date: str
    hour: int
    entries: List[dict]  # [{"student_id": 1, "status": "P"}, ...]

@router.post("/attendance/mark/")
def mark_attendance(data: AttendanceMarkRequest, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    verify_subject_ownership(faculty, data.subject_id, db)
    count = 0
    for entry in data.entries:
        existing = db.query(Attendance).filter(Attendance.student_id == entry["student_id"], Attendance.subject_id == data.subject_id, Attendance.date == data.date, Attendance.hour == data.hour).first()
        if existing:
            existing.status = entry["status"]
            existing.amended_by = faculty.id
        else:
            db.add(Attendance(student_id=entry["student_id"], subject_id=data.subject_id, date=data.date, hour=data.hour, status=entry["status"], marked_by=faculty.id))
        count += 1
    db.commit()
    return {"message": f"Attendance marked for {count} students"}

@router.put("/attendance/amend/{record_id}/")
def amend_attendance(record_id: int, new_status: str, reason: str, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    record = db.query(Attendance).filter(Attendance.id == record_id).first()
    if not record: raise HTTPException(status_code=404, detail="Record not found")
    
    # Ownership check
    verify_subject_ownership(faculty, record.subject_id, db)

    # 24-hour check (assume session end at 17:00)
    session_end = datetime.strptime(record.date, "%Y-%m-%d").replace(hour=17, minute=0, second=0)
    if datetime.utcnow() > session_end + timedelta(hours=24):
        raise HTTPException(status_code=403, detail="24-hour amendment window expired. Submit HOD approval request.")

    if not reason.strip():
        raise HTTPException(status_code=400, detail="Amendment reason is required")

    record.status = new_status
    record.amended_by = faculty.id
    record.amended_at = datetime.utcnow()
    db.commit()
    return {"message": "Attendance amended", "record_id": record_id}

@router.post("/attendance/request-amendment/")
def request_amendment(record_id: int, new_status: str, reason: str, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    """Faculty requests HOD approval to amend an old record (>24h)."""
    record = db.query(Attendance).filter(Attendance.id == record_id).first()
    if not record: raise HTTPException(404, "Record not found")
    verify_subject_ownership(faculty, record.subject_id, db)
    
    req = AttendanceAmendmentRequest(
        attendance_id=record_id,
        faculty_id=faculty.id,
        new_status=new_status,
        reason=reason,
        institution_id=faculty.institution_id
    )
    db.add(req)
    db.commit()
    return {"message": "Amendment request submitted to HOD", "request_id": req.id}

@router.get("/hod/attendance/pending/")
def hod_pending_amendments(faculty=Depends(require_role("hod")), db: Session = Depends(get_db)):
    """HOD reviews pending attendance amendment requests."""
    # Optimized with joins
    results = db.query(
        AttendanceAmendmentRequest, 
        Attendance, 
        Subject.name, 
        Faculty.name
    ).join(Attendance, AttendanceAmendmentRequest.attendance_id == Attendance.id)\
     .join(Subject, Attendance.subject_id == Subject.id)\
     .join(Faculty, AttendanceAmendmentRequest.faculty_id == Faculty.id)\
     .filter(AttendanceAmendmentRequest.status == "Pending").all()

    formatted = []
    for req, att, subj_name, fac_name in results:
        formatted.append({
            "id": req.id, 
            "faculty": fac_name, 
            "subject": subj_name, 
            "date": att.date,
            "old_status": att.status, 
            "new_status": req.new_status,
            "reason": req.reason
        })
    return {"pending_amendments": formatted}

@router.put("/hod/attendance/approve/{req_id}/")
def hod_approve_amendment(req_id: int, approve: bool = True, remarks: str = "", faculty=Depends(require_role("hod")), db: Session = Depends(get_db)):
    """HOD approves or rejects the amendment."""
    req = db.query(AttendanceAmendmentRequest).filter(AttendanceAmendmentRequest.id == req_id).first()
    if not req: raise HTTPException(404, "Request not found")
    
    req.status = "Approved" if approve else "Rejected"
    req.hod_remarks = remarks
    req.processed_at = datetime.utcnow()
    
    if approve:
        att = db.query(Attendance).filter(Attendance.id == req.attendance_id).first()
        if att:
            att.status = req.new_status
            att.amended_by = req.faculty_id
            att.amended_at = datetime.utcnow()
            
    db.commit()
    return {"message": f"Amendment request {req.status}"}

@router.get("/attendance/defaulters/")
def defaulters(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    from sqlalchemy import func, case
    
    subject_codes = [s.strip() for s in (faculty.subjects_teaching or "").split(",") if s.strip()]
    if not subject_codes:
        return {"defaulters": []}

    subjects = db.query(Subject).filter(Subject.code.in_(subject_codes)).all()
    subject_ids = [s.id for s in subjects]
    
    # Fully optimized single query with Student join
    stats = db.query(
        Attendance.student_id,
        Attendance.subject_id,
        Student.full_name,
        func.count(Attendance.id).label("total"),
        func.sum(case((Attendance.status == 'P', 1), else_=0)).label("present")
    ).join(Student, Attendance.student_id == Student.id)\
     .filter(Attendance.subject_id.in_(subject_ids))\
     .group_by(Attendance.student_id, Attendance.subject_id, Student.full_name).all()

    result = []
    for s_id, sub_id, name, total, present in stats:
        if total == 0: continue
        pct = round((present / total) * 100, 1)
        if pct < 75:
            subject = next((sub for sub in subjects if sub.id == sub_id), None)
            result.append({
                "student": name,
                "subject": subject.name if subject else "Unknown",
                "attendance": pct
            })
            
    return {"defaulters": sorted(result, key=lambda x: x["attendance"])}

class MarkUploadEntry(BaseModel):
    student_id: int
    marks_obtained: float
    max_marks: float = 100

class MarkUploadRequest(BaseModel):
    subject_id: int
    assessment_type: str
    semester: str
    entries: List[MarkUploadEntry]

@router.post("/marks/upload/")
def upload_marks(data: MarkUploadRequest, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    verify_subject_ownership(faculty, data.subject_id, db)
    count = 0
    for entry in data.entries:
        db.add(Mark(
            student_id=entry.student_id, 
            subject_id=data.subject_id, 
            marks_obtained=entry.marks_obtained, 
            max_marks=entry.max_marks, 
            assessment_type=data.assessment_type, 
            semester=data.semester, 
            uploaded_by=faculty.id,
            published=False
        ))
        count += 1
    db.commit()
    return {"message": f"Uploaded marks for {count} students (unpublished)"}

@router.post("/marks/publish/")
def publish_marks(subject_id: int, assessment_type: str, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    verify_subject_ownership(faculty, subject_id, db)
    marks = db.query(Mark).filter(Mark.subject_id == subject_id, Mark.assessment_type == assessment_type, Mark.published == False).all()
    for m in marks:
        m.published = True
        m.date_published = datetime.utcnow()
    db.commit()
    return {"message": f"Published {len(marks)} records"}

@router.get("/marks/statistics/{subject_id}/")
def mark_statistics(subject_id: int, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    marks = db.query(Mark).filter(Mark.subject_id == subject_id).all()
    if not marks: return {"statistics": None}
    percentages = [m.marks_obtained / m.max_marks * 100 for m in marks if m.max_marks > 0]
    if not percentages: return {"statistics": None}
    import statistics as stats
    return {"count": len(percentages), "mean": round(stats.mean(percentages), 1), "median": round(stats.median(percentages), 1), "stdev": round(stats.stdev(percentages), 1) if len(percentages) > 1 else 0, "highest": round(max(percentages), 1), "lowest": round(min(percentages), 1), "pass_rate": round(sum(1 for p in percentages if p >= 40) / len(percentages) * 100, 1)}

@router.get("/leave/pending/")
def pending_leave(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    # Optimized with join
    leaves = db.query(LeaveRequest, Student.full_name)\
        .join(Student, LeaveRequest.student_id == Student.id)\
        .filter(LeaveRequest.status == "Pending")\
        .order_by(LeaveRequest.applied_on.desc()).all()
    
    result = []
    for l, name in leaves:
        result.append({
            "id": l.id, 
            "student": name, 
            "type": l.leave_type, 
            "from": l.from_date, 
            "to": l.to_date, 
            "reason": l.reason
        })
    return {"pending": result}

@router.put("/leave/{lid}/approve/")
def approve_leave(lid: int, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == lid).first()
    if not leave: raise HTTPException(404, "Not found")
    leave.status = "Faculty_Approved"
    leave.faculty_advisor_id = faculty.id
    db.commit()
    return {"message": "Leave approved by faculty"}

@router.get("/hod/leave/pending/")
def hod_pending_leave(faculty=Depends(require_role("hod")), db: Session = Depends(get_db)):
    """HOD sees leaves already approved by faculty advisor, awaiting HOD sign-off."""
    # Optimized with join
    leaves = db.query(LeaveRequest, Student.full_name)\
        .join(Student, LeaveRequest.student_id == Student.id)\
        .filter(LeaveRequest.status == "Faculty_Approved")\
        .order_by(LeaveRequest.applied_on.desc()).all()
    
    result = []
    for l, name in leaves:
        result.append({
            "id": l.id, 
            "student": name, 
            "type": l.leave_type, 
            "from": l.from_date, 
            "to": l.to_date, 
            "reason": l.reason
        })
    return {"pending": result}

@router.put("/hod/leave/{lid}/approve/")
def hod_approve_leave(lid: int, faculty=Depends(require_role("hod")), db: Session = Depends(get_db)):
    
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == lid).first()
    if not leave: raise HTTPException(status_code=404, detail="Not found")
    if leave.status != "Faculty_Approved":
        raise HTTPException(status_code=400, detail="Leave must be faculty-approved first")
        
    leave.status = "HOD_Approved"
    # Assuming the 'faculty' object here is the HOD
    db.commit()
    return {"message": "Leave fully approved by HOD"}

@router.put("/leave/{lid}/reject/")
def reject_leave(lid: int, reason: str = "", faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == lid).first()
    if not leave: raise HTTPException(404, "Not found")
    leave.status = "Rejected"
    db.commit()
    return {"message": "Leave rejected"}

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_scope: Optional[str] = "all"

@router.post("/announcements/")
def create_announcement(data: AnnouncementCreate, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    db.add(Announcement(title=data.title, content=data.content, target_scope=data.target_scope, created_by=faculty.id))
    db.commit()
    return {"message": "Announcement created"}

@router.get("/assignments/")
def faculty_assignments(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.faculty_id == faculty.id).order_by(Assignment.created_at.desc()).all()
    return {"assignments": [{"id": a.id, "title": a.title, "due": a.due_date, "submissions": db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == a.id).count()} for a in assignments]}

class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    max_marks: float = 100

@router.post("/assignments/")
def create_assignment(data: AssignmentCreate, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    verify_subject_ownership(faculty, data.subject_id, db)
    a = Assignment(faculty_id=faculty.id, subject_id=data.subject_id, title=data.title, description=data.description, due_date=data.due_date, max_marks=data.max_marks)
    db.add(a)
    db.commit()
    return {"message": "Assignment created", "id": a.id}

@router.post('/assignments/check-plagiarism/{assignment_id}/')
def check_plagiarism(assignment_id: int, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    from backend.services.plagiarism_service import plagiarism_detector
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).all()
    if len(submissions) < 2:
        return {'message': 'Not enough submissions to compare', 'results': []}
    batch = []
    for s in submissions:
        student = db.query(Student).filter(Student.id == s.student_id).first()
        batch.append({'student_id': s.student_id, 'student_name': student.full_name if student else '?', 'text': s.submission_text or ''})
    results = plagiarism_detector.batch_compare(batch)
    return {'assignment_id': assignment_id, 'suspicious_pairs': results}

@router.post("/lecture-logs/")
def create_lecture_log(data: LectureLogCreate, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    verify_subject_ownership(faculty, data.subject_id, db)
    log = LectureLog(
        faculty_id=faculty.id,
        institution_id=faculty.institution_id,
        subject_id=data.subject_id,
        date=data.date,
        hour=data.hour,
        topic_covered=data.topic_covered,
        methodology=data.methodology,
        remarks=data.remarks
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Lecture log recorded", "id": log.id}

@router.get("/lecture-logs/")
def get_faculty_lecture_logs(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    # Optimized with join
    logs = db.query(LectureLog, Subject)\
        .join(Subject, LectureLog.subject_id == Subject.id)\
        .filter(LectureLog.faculty_id == faculty.id)\
        .order_by(LectureLog.date.desc(), LectureLog.hour.desc()).all()
    
    result = []
    for l, subj in logs:
        result.append({
            "id": l.id,
            "subject": subj.name,
            "code": subj.code,
            "date": l.date,
            "hour": l.hour,
            "topic_covered": l.topic_covered,
            "methodology": l.methodology,
            "remarks": l.remarks,
            "created_at": l.created_at
        })
    return {"logs": result}

