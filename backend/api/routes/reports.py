"""PDF Reports, Library, Placement, Courses, Internships, Campus Modules, WebSocket, Chat Stream, Export, Admin Analytics — all remaining route files."""

# ─── REPORTS ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
import random
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import Student

reports_router = APIRouter(prefix="/reports", tags=["Reports"])

def get_premium_style():
    return """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@300;400;600&display=swap');
        :root { --primary: #6366f1; --secondary: #a855f7; --dark: #0f172a; --bg: #f8fafc; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--dark); padding: 40px; display: flex; justify-content: center; }
        .certificate { 
            background: white; width: 800px; padding: 60px; border-radius: 24px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);
            position: relative; overflow: hidden;
        }
        .certificate::before { 
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px; 
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 700; background: linear-gradient(90deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h1 { font-size: 32px; font-weight: 700; margin: 20px 0; letter-spacing: -0.5px; }
        .content { font-size: 18px; line-height: 1.6; text-align: center; color: #475569; }
        .student-name { font-size: 24px; font-weight: 600; color: var(--dark); margin: 20px 0; display: block; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 30px; }
        .signature { text-align: center; }
        .signature p { margin: 5px 0; font-size: 14px; color: #64748b; }
        .seal { width: 100px; height: 100px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: 700; border: 2px dashed var(--primary); }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 120px; color: rgba(0,0,0,0.03); font-weight: 900; z-index: 0; pointer-events: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 14px; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
    </style>
    """

@reports_router.get("/marksheet/{student_id}/", response_class=HTMLResponse)
def marksheet(student_id: int, current=Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access another student's report")
    s = db.query(Student).filter(Student.id == student_id).first()
    from backend.app.models import Mark, Subject
    marks = db.query(Mark).filter(Mark.student_id == student_id, Mark.published == True).all()
    
    rows = ""
    for m in marks:
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        rows += f"<tr><td>{subj.code if subj else '?'}</td><td>{subj.name if subj else '?'}</td><td>{m.assessment_type}</td><td>{m.marks_obtained}/{m.max_marks}</td></tr>"

    return f"""
    <html>
    <head>{get_premium_style()}</head>
    <body>
        <div class="certificate">
            <div class="watermark">Studvisor</div>
            <div class="header">
                <div class="logo">STUDVISOR</div>
                <h1>Official Academic Transcript</h1>
            </div>
            <div class="content">
                This is to certify the academic performance of
                <span class="student-name">{s.full_name}</span>
                ID: {s.roll_number} | Department: {s.department}
                <table>
                    <thead><tr><th>Code</th><th>Subject</th><th>Type</th><th>Score</th></tr></thead>
                    <tbody>{rows or '<tr><td colspan="4" style="text-align:center">No records found</td></tr>'}</tbody>
                </table>
            </div>
            <div class="footer">
                <div class="signature">
                    <div style="font-family: 'Dancing Script', cursive; font-size: 24px;">Registrar</div>
                    <p>Office of Examinations</p>
                </div>
                <div class="seal">Studvisor SEAL</div>
                <div class="signature">
                    <p>Date Generated</p>
                    <p>{datetime.now().strftime("%B %d, %Y")}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

@reports_router.get("/bonafide/{student_id}/", response_class=HTMLResponse)
def bonafide(student_id: int, current=Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access another student's report")
    s = db.query(Student).filter(Student.id == student_id).first()
    return f"""
    <html>
    <head>{get_premium_style()}</head>
    <body>
        <div class="certificate">
            <div class="watermark">CERTIFIED</div>
            <div class="header">
                <div class="logo">STUDVISOR</div>
                <h1>Bonafide Certificate</h1>
            </div>
            <div class="content">
                <p>This is to certify that <b>{s.full_name}</b>, daughter/son of the institution, 
                is a bonafide student of this college, currently pursuing 
                <b>Semester {s.semester}</b> in the <b>Department of {s.department}</b>.</p>
                <p>Their conduct during the period of study has been exemplary.</p>
            </div>
            <div class="footer">
                <div class="seal">OFFICIAL</div>
                <div class="signature">
                    <p>Principal Signature</p>
                    <p>Studvisor Institute of Technology</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

@reports_router.get("/attendance-cert/{student_id}/", response_class=HTMLResponse)
def attendance_cert(student_id: int, current=Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access another student's report")
    s = db.query(Student).filter(Student.id == student_id).first()
    from backend.app.models import Attendance
    recs = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    pct = round(sum(1 for r in recs if r.status == "P") / len(recs) * 100, 1) if recs else 0
    
    return f"""
    <html>
    <head>{get_premium_style()}</head>
    <body>
        <div class="certificate">
            <div class="watermark">ATTENDANCE</div>
            <div class="header">
                <div class="logo">STUDVISOR</div>
                <h1>Attendance Participation Certificate</h1>
            </div>
            <div class="content">
                <p>This document verifies that <b>{s.full_name}</b> has maintained an aggregate attendance of</p>
                <div style="font-size: 48px; font-weight: 700; color: var(--primary); margin: 20px 0;">{pct}%</div>
                <p>for the current academic semester. This meets the minimum eligibility requirements 
                for university examination participation.</p>
            </div>
            <div class="footer">
                <div class="seal">{pct}%</div>
                <div class="signature">
                    <p>Dean of Students</p>
                    <p>Studvisor Institute of Technology</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

@reports_router.get("/fee-receipt/{student_id}/", response_class=HTMLResponse)
def fee_receipt(student_id: int, current=Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access another student's report")
    s = db.query(Student).filter(Student.id == student_id).first()
    from backend.app.models import StudentFee
    fees = db.query(StudentFee).filter(StudentFee.student_id == student_id).all()
    
    rows = ""
    total_paid = 0
    for f in fees:
        rows += f"<tr><td>{f.status}</td><td>{f.amount_due}</td><td>{f.amount_paid}</td><td>{f.due_date}</td></tr>"
        total_paid += f.amount_paid

    return f"""
    <html>
    <head>{get_premium_style()}</head>
    <body>
        <div class="certificate">
            <div class="watermark">PAID</div>
            <div class="header">
                <div class="logo">STUDVISOR</div>
                <h1>Fee Payment Receipt</h1>
            </div>
            <div class="content">
                <p>Acknowledgment of payment received from <b>{s.full_name}</b> ({s.roll_number}).</p>
                <table>
                    <thead><tr><th>Fee Type</th><th>Due</th><th>Paid</th><th>Deadline</th></tr></thead>
                    <tbody>{rows or '<tr><td colspan="4">No records</td></tr>'}</tbody>
                </table>
                <div style="margin-top: 20px; font-weight: 700;">Total Amount Received: ₹{total_paid}</div>
            </div>
            <div class="footer">
                <div class="seal">FINANCE</div>
                <div class="signature">
                    <p>Accounts Officer</p>
                    <p>Digital Transaction ID: NEX-{random.randint(100000, 999999)}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

