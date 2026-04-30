"""Placement, Courses, Internships, Campus Modules, WebSocket, Streaming Chat, Export, Admin Analytics."""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, List
from backend.core.security import get_current_student, require_role
from backend.app.database import get_db
from backend.app.models import *
import json, asyncio, csv, io

# ─── PLACEMENT ───────────────────────────────────────────────────────────────
placement_router = APIRouter(prefix="/placement", tags=["Placement"])

@placement_router.get("/drives/")
def list_drives(db: Session = Depends(get_db)):
    drives = db.query(PlacementDrive).filter(PlacementDrive.status == "Open").all()
    return {"drives": [{"id": d.id, "company": d.company_name, "role": d.role_title, "package": d.package_lpa, "min_cgpa": d.eligibility_cgpa, "date": d.drive_date} for d in drives]}

@placement_router.post("/apply/{drive_id}/")
def apply(drive_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive: raise HTTPException(404, "Drive not found")
    if db.query(PlacementApplication).filter(PlacementApplication.drive_id == drive_id, PlacementApplication.student_id == student.id).first():
        raise HTTPException(400, "Already applied")
    db.add(PlacementApplication(drive_id=drive_id, student_id=student.id))
    db.commit()
    return {"message": f"Applied to {drive.company_name}"}

@placement_router.get("/my-applications/")
def my_apps(student=Depends(get_current_student), db: Session = Depends(get_db)):
    apps = db.query(PlacementApplication).filter(PlacementApplication.student_id == student.id).all()
    result = []
    for a in apps:
        d = db.query(PlacementDrive).filter(PlacementDrive.id == a.drive_id).first()
        result.append({"company": d.company_name if d else "?", "role": d.role_title if d else "?", "status": a.status})
    return {"applications": result}

# ─── COURSES ─────────────────────────────────────────────────────────────────
courses_router = APIRouter(prefix="/courses", tags=["Courses"])

@courses_router.get("/available/")
def available(student=Depends(get_current_student), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.semester == student.semester).all()
    enrolled = {e.subject_id for e in db.query(CourseEnrollment).filter(CourseEnrollment.student_id == student.id, CourseEnrollment.status == "Enrolled").all()}
    return {"subjects": [{"id": s.id, "code": s.code, "name": s.name, "credits": s.credits, "enrolled": s.id in enrolled} for s in subjects]}

@courses_router.post("/enroll/")
def enroll(subject_id: int, student=Depends(get_current_student), db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj: raise HTTPException(404, "Subject not found")
    db.add(CourseEnrollment(student_id=student.id, subject_id=subject_id, semester=student.semester, academic_year="2025-2026"))
    db.commit()
    return {"message": f"Enrolled in {subj.name}"}

# ─── INTERNSHIPS ─────────────────────────────────────────────────────────────
internships_router = APIRouter(prefix="/internships", tags=["Internships"])

@internships_router.get("/my/")
def my_internships(student=Depends(get_current_student), db: Session = Depends(get_db)):
    interns = db.query(Internship).filter(Internship.student_id == student.id).all()
    return {"internships": [{"id": i.id, "company": i.company_name, "role": i.role, "stipend": i.stipend, "status": i.status} for i in interns]}

# ─── CAMPUS MODULES (Clubs, Hostel, Transport, Scholarships, DM) ────────────
campus_router = APIRouter(tags=["Campus"])

@campus_router.get("/clubs/")
def clubs(db: Session = Depends(get_db)):
    return {"clubs": []}  # Populated via seed

@campus_router.get("/hostel/my-room/")
def my_room(student=Depends(get_current_student)):
    return {"room": None}

@campus_router.get("/transport/routes/")
def bus_routes(db: Session = Depends(get_db)):
    return {"routes": []}

@campus_router.get("/scholarships/")
def scholarships(db: Session = Depends(get_db)):
    return {"scholarships": []}

@campus_router.get("/messages/inbox/")
def inbox(student=Depends(get_current_student)):
    return {"messages": []}

# ─── WEBSOCKET ───────────────────────────────────────────────────────────────
websocket_router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active: Dict[int, List[WebSocket]] = {}
    async def connect(self, ws: WebSocket, uid: int):
        await ws.accept()
        self.active.setdefault(uid, []).append(ws)
    def disconnect(self, ws: WebSocket, uid: int):
        if uid in self.active: self.active[uid] = [w for w in self.active[uid] if w != ws]
    async def send_to_user(self, uid: int, data: dict):
        for ws in self.active.get(uid, []):
            try: await ws.send_json(data)
            except: pass

manager = ConnectionManager()

@websocket_router.websocket("/ws/{uid}")
async def ws_endpoint(ws: WebSocket, uid: int):
    await manager.connect(ws, uid)
    try:
        while True:
            data = await ws.receive_text()
            if json.loads(data).get("type") == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(ws, uid)

# ─── CHAT STREAM ─────────────────────────────────────────────────────────────
chat_stream_router = APIRouter(prefix="/chat-stream", tags=["AI Stream"])

@chat_stream_router.post("/")
async def stream_chat(query: str = ""):
    async def gen():
        for word in f"AI response to: {query}".split():
            yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            await asyncio.sleep(0.04)
    return StreamingResponse(gen(), media_type="text/event-stream")

# ─── EXPORT ──────────────────────────────────────────────────────────────────
export_router = APIRouter(prefix="/export", tags=["Export"])

@export_router.get("/attendance/csv/")
def export_attendance(student=Depends(get_current_student), db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["Date", "Hour", "Subject ID", "Status"])
    for r in records: w.writerow([r.date, r.hour, r.subject_id, r.status])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=attendance.csv"})

# ─── ADMIN ANALYTICS ────────────────────────────────────────────────────────
admin_analytics_router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

@admin_analytics_router.get("/at-risk-students/")
def at_risk(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    from backend.services.predictive_service import predictive_service
    return {"data": predictive_service.batch_risk_assessment(db)}

@admin_analytics_router.get("/audit-logs/")
def audit_logs(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return {"logs": [{"actor": l.actor_username, "action": l.action, "resource": l.resource_type, "time": str(l.timestamp)} for l in logs]}
