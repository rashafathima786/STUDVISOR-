"""
Studvisor v2.0 — AI Chatbot Engine
Deterministic ERP queries + RAG fallback + Emotion-aware responses.
Context-injected per role via core/ai_context.py.
"""
from sqlalchemy.orm import Session
from collections import defaultdict
import re

from backend.app.models import Student, Attendance, Mark, Subject, LeaveRequest, ExamSchedule
from backend.services.gpa_service import gpa_service, percentage_to_grade


# ─── INTENT DETECTION ───────────────────────────────────────────────────────

INTENT_PATTERNS = {
    "greeting": r"\b(hi|hello|hey|good morning|good evening|greetings)\b",
    "attendance_subject": r"\b(subject.?wise|per subject|each subject|individual subject|attendance in each)\b",
    "attendance_recovery": r"\b(low attendance|how many classes to attend|lowest attendance|attendance recovery|less attendance|poor attendance|lowest)\b|which subject.*(low|less).*attendance",
    "bunk_check": r"\b(how many.*(miss|bunk|skip)|can i (miss|bunk|skip)|safe to bunk|bunk safety)\b",
    "reach_75": r"\b(reach 75|get to 75|need.*attend.*75|recover attendance|classes needed|reach target)\b",
    "attendance_overall": r"\b(attendance|overall attendance|total attendance|my attendance|attendance percentage|attendance summary)\b",
    "cgpa": r"\b(cgpa|cumulative|overall gpa|my gpa|total gpa)\b",
    "sgpa": r"\b(sgpa|semester gpa|this semester gpa|current gpa)\b",
    "best_subject": r"\b(best subject|strongest|highest marks|top subject|favorite subject)\b",
    "weakest_subject": r"\b(weakest|worst subject|lowest marks|struggling|hardest subject)\b",
    "marks": r"\b(marks|my marks|show marks|what are my marks|internal marks|cia marks|my results|show results)\b",
    "eligibility": r"(eligib|can i write exam|allowed to write|exam eligibility|hall ticket)",
    "holiday": r"\b(holiday|calendar|vacation|off day|working day)\b",
    "profile": r"\b(profile|my profile|who am i|my details|about me|my info|personal info)\b",
    "leave_status": r"\b(leave status|my leaves|pending leave|leave request|od status)\b",
    "od_help": r"\b(od assistance|missing od|classes missed without od|od leave check|uncovered absence|applied od yet|apply.*od)\b",
    "exam_schedule": r"\b(exam schedule|upcoming exam|next exam|when.*exam|exam dates)\b",
    "help": r"\b(help|what can you do|capabilities|commands|what do you do)\b",
    "thank": r"\b(thank|thanks|thx|appreciate|great job|good bot)\b",
    "frustrated": r"\b(cant understand|hate|give up|impossible|stressed|overwhelmed|too hard|failing|stupid bot)\b",
    "missed_today": r"\b(missed today|absent today|classes.*miss.*today|what did i miss)\b",
}


def detect_intent(message: str) -> str:
    lowered = message.lower().strip()
    for intent, pattern in INTENT_PATTERNS.items():
        if re.search(pattern, lowered):
            return intent
    return "unknown"


# ─── EMOTION DETECTION ───────────────────────────────────────────────────────

def detect_emotion(message: str) -> str:
    """Stage 1 of emotion-aware system. Uses SentimentService for robust detection."""
    from backend.services.sentiment_service import sentiment_service
    analysis = sentiment_service.analyze(message)
    
    if analysis["is_distress"]:
        return "distressed"
    if analysis["is_toxic"]:
        return "frustrated"
    
    # Fallback to simple matching for positive/anxious if sentiment service is neutral
    lowered = message.lower()
    anxious_words = ["stressed", "worried", "anxious", "nervous", "scared", "overwhelmed", "panic"]
    positive_words = ["great", "awesome", "happy", "excited", "love", "amazing", "perfect"]

    if any(w in lowered for w in anxious_words):
        return "anxious"
    if any(w in lowered for w in positive_words):
        return "positive"
    return "neutral"


# ─── RESPONSE GENERATORS ────────────────────────────────────────────────────

def handle_greeting(student: Student) -> dict:
    return {
        "reply": f"Hello {student.full_name.split()[0]}! 👋 I'm your Studvisor AI assistant. I've analyzed your current academic profile and I'm ready to help you with attendance, marks, or any ERP queries you have.\n\nHow can I support your studies today?",
        "actions": [
            {"label": "📊 Attendance Summary", "query": "show my attendance", "category": "attendance"},
            {"label": "📅 Academic Calendar", "query": "when is next holiday", "category": "calendar"},
            {"label": "📈 Performance Hub", "query": "what is my cgpa", "category": "academic"}
        ]
    }


def handle_help() -> dict:
    return {
        "reply": """I'm a high-fidelity academic assistant capable of tracking your entire ERP journey. You can ask me about:
        
✨ **Attendance**: Overall percentage, subject-wise breakdown, or bunk safety.
📈 **Performance**: CGPA/SGPA tracking and subject-wise marks analysis.
📅 **Planning**: Exam schedules, holidays, and academic calendar events.
📝 **Compliance**: OD status, leave requests, and exam eligibility.

What would you like to check first?""",
        "actions": [
            {"label": "📝 Exam Schedule", "query": "show exams", "category": "academic"},
            {"label": "📈 CGPA Check", "query": "what is my cgpa", "category": "academic"}
        ]
    }


def handle_attendance_overall(db: Session, student: Student) -> dict:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return {"reply": "- **ATTENDANCE**: Data Unavailable.", "actions": []}

    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    absent = sum(1 for r in records if r.status == "A")
    dl = total - present - absent
    pct = round(present / total * 100, 1)

    status = "STABLE" if pct >= 85 else "WARNING" if pct >= 75 else "CRITICAL"
    actions = [{"label": "View Full Report", "action": "navigate", "payload": "/attendance"}]
    if pct < 75:
        actions.append({"label": "Recovery Plan", "query": "how to recover attendance"})

    return {
        "reply": f"Your current overall attendance stands at **{pct}%** ({present} out of {total} sessions).\n\nDetails:\n- **Present**: {present}\n- **Absent**: {absent}\n- **Duty Leave**: {dl}\n\nYour current status is **{status}**. {'You are safely above the 75% requirement.' if pct >= 75 else 'You are currently below the required 75% threshold.'}",
        "actions": actions
    }
def handle_missed_today(db: Session, student: Student) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    records = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.date == today,
        Attendance.status == "A"
    ).all()
    
    if not records:
        return "You haven't missed any classes today! Your attendance record for today is spotless. ✨"
    
    missed = []
    for r in records:
        subj = db.query(Subject).filter(Subject.id == r.subject_id).first()
        missed.append(f"{subj.name if subj else '?'}(Slot {r.slot or 'TBA'})")
    
    return f"You were marked absent in the following sessions today:\n" + "\n".join([f"• {m}" for m in missed])

def handle_attendance_subject(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "- **ATTENDANCE**: No records found."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = []
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        status = "OK" if pct >= 75 else "LOW"
        lines.append(f"• **{subj.name if subj else '?'}**: {pct}% ({status})")

    return "\n".join(lines)


def handle_bunk_check(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "- **BUNK CHECK**: Insufficient Data."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = []
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        p, t = d["present"], d["total"]
        buffer = 0
        while (p) / (t + buffer + 1) * 100 >= 75 and buffer < 50:
            buffer += 1
        
        status = "SAFE" if buffer >= 3 else "WARN" if buffer > 0 else "CRIT"
        lines.append(f"• **{subj.name if subj else '?'}**: {buffer} classes ({status})")

    return "\n".join(lines)


def handle_reach_75(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "- **RECOVERY**: Insufficient Data."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = []
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        p, t = d["present"], d["total"]
        pct = round(p / t * 100, 1) if t > 0 else 100
        
        if pct < 75:
            needed = 0
            while (p + needed) / (t + needed) * 100 < 75 and needed < 200:
                needed += 1
            lines.append(f"• **{subj.name if subj else '?'}**: {pct}% (Requires **{needed}** more classes)")
        else:
            lines.append(f"• **{subj.name if subj else '?'}**: {pct}% (Safe)")

    return "\n".join(lines)


def handle_od_help(db: Session, student: Student) -> str:
    absences = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.status == "A").all()
    if not absences:
        return "- **OD CHECK**: 0 Absences. Action: None."
    
    od_leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id, LeaveRequest.leave_type == "OD", LeaveRequest.status.contains("Approved")).all()
    uncovered = []
    for a in absences:
        if not any(l.from_date <= a.date <= l.to_date for l in od_leaves):
            uncovered.append(a)
            
    if not uncovered:
        return "- **OD CHECK**: All absences covered. Status: OK."
    
    lines = ["- **UNCOVERED ABSENCES**:"]
    uncovered.sort(key=lambda x: x.date, reverse=True)
    for a in uncovered:
        subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
        lines.append(f"  - {a.date}: {subj.name if subj else '?'}(Hour {a.hour})")
            
    return "\n".join(lines)


def handle_marks(db: Session, student: Student) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "- **MARKS**: Data Unavailable."

    lines = []
    for m in marks:
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        pct = round(m.marks_obtained / m.max_marks * 100, 1) if m.max_marks > 0 else 0
        grade = percentage_to_grade(pct)
        lines.append(f"- **{subj.name if subj else '?'}**({m.assessment_type}): {m.marks_obtained}/{m.max_marks} ({pct}%) -> {grade['letter']}")

    return "\n".join(lines)


def handle_cgpa(db: Session, student: Student) -> str:
    result = gpa_service.get_cgpa(db, student.id)
    if not result["semesters"]:
        return "- **CGPA**: Data Unavailable."

    lines = [f"- **CURRENT CGPA**: {result['cgpa']}"]
    for s in result["semesters"]:
        lines.append(f"  - SEM {s['semester']} SGPA: {s['sgpa']}")

    return "\n".join(lines)


def handle_best_subject(db: Session, student: Student) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "- **BEST SUBJECT**: Data Unavailable."
    subj_avg = defaultdict(list)
    for m in marks:
        pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
        subj_avg[m.subject_id].append(pct)
    best_id = max(subj_avg, key=lambda x: sum(subj_avg[x]) / len(subj_avg[x]))
    subj = db.query(Subject).filter(Subject.id == best_id).first()
    avg = round(sum(subj_avg[best_id]) / len(subj_avg[best_id]), 1)
    return f"- **BEST SUBJECT**: {subj.name if subj else '?'}({avg}%)."


def handle_weakest_subject(db: Session, student: Student) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "- **WEAKEST SUBJECT**: Data Unavailable."
    subj_avg = defaultdict(list)
    for m in marks:
        pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
        subj_avg[m.subject_id].append(pct)
    worst_id = min(subj_avg, key=lambda x: sum(subj_avg[x]) / len(subj_avg[x]))
    subj = db.query(Subject).filter(Subject.id == worst_id).first()
    avg = round(sum(subj_avg[worst_id]) / len(subj_avg[worst_id]), 1)
    return f"- **WEAKEST SUBJECT**: {subj.name if subj else '?'}({avg}%)."


def handle_eligibility(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = ["- **EXAM ELIGIBILITY**:"]
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 100
        status = "ELIGIBLE" if pct >= 75 else "INELIGIBLE"
        lines.append(f"  - {subj.name if subj else '?'}: {status} ({pct}%)")

    return "\n".join(lines)


def handle_profile(student: Student) -> str:
    return f"""Here are your profile details as recorded in the system:

👤 **Name**: {student.full_name}
🆔 **Roll Number**: {student.roll_number or 'N/A'}
🏫 **Department**: {student.department or 'N/A'}
📅 **Semester**: {student.semester or 'N/A'}
🏆 **Merit Points**: {student.merit_points} ({student.merit_tier or 'Novice'})
📧 **Contact**: {student.email or 'N/A'}"""


def handle_leave_status(db: Session, student: Student) -> str:
    leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).order_by(LeaveRequest.applied_on.desc()).limit(5).all()
    if not leaves:
        return "- **LEAVES**: 0 Requests."
    lines = ["- **RECENT LEAVES**:"]
    for l in leaves:
        lines.append(f"  - {l.leave_type} ({l.from_date} to {l.to_date}): {l.status}")
    return "\n".join(lines)


def handle_exam_schedule(db: Session, student: Student) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    exams = db.query(ExamSchedule).filter(ExamSchedule.exam_date >= today).order_by(ExamSchedule.exam_date).limit(10).all()
    if not exams:
        return "- **EXAMS**: None Scheduled."
    lines = ["- **UPCOMING EXAMS**:"]
    for e in exams:
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first()
        lines.append(f"  - {e.exam_date}: {subj.name if subj else '?'}({e.exam_type}) @ {e.venue or 'TBA'}")
    return "\n".join(lines)


def handle_holiday(db: Session) -> str:
    from datetime import datetime
    from backend.app.models import AcademicCalendar
    today = datetime.now().strftime("%Y-%m-%d")
    next_holiday = db.query(AcademicCalendar).filter(AcademicCalendar.date >= today, AcademicCalendar.is_working_day == 0).order_by(AcademicCalendar.date).first()
    if not next_holiday:
        return "- **HOLIDAY**: None Scheduled."
    return f"- **NEXT HOLIDAY**: {next_holiday.holiday_name} ({next_holiday.date})."


def handle_frustrated(student: Student) -> str:
    return f"I can sense you're feeling a bit overwhelmed, {student.full_name.split()[0]}. I'm here to support you. Let's look at a Recovery Plan or I can help you connect with a faculty advisor to discuss any challenges you're facing."


def handle_thank(student: Student) -> str:
    return f"You're very welcome, {student.full_name.split()[0]}! Happy to help. Is there anything else I can assist you with?"


def handle_distressed(student: Student) -> dict:
    return {
        "reply": f"I'm concerned about you, {student.full_name.split()[0]}. Please know that you're not alone. I've triggered a priority support alert. You can call our 24/7 Support Cell at 1800-Studvisor-CARE immediately for professional assistance.",
        "actions": [{"label": "📞 Emergency Support", "action": "call", "payload": "18005550199"}]
    }


# ─── MAIN CHAT DISPATCHER ───────────────────────────────────────────────────

async def process_chat(db: Session, student: Student, message: str) -> dict:
    """Main entry point for the AI chatbot. Detects intent and dispatches to handler."""
    from backend.services.ai_service import ai_service
    from backend.core.ai_context import build_student_context

    emotion = detect_emotion(message)
    intent = detect_intent(message)

    # Emotion override: if frustrated/anxious/distressed, respond empathetically first
    if emotion == "distressed":
        return handle_distressed(student)
    if emotion == "frustrated":
        # We'll just return the reply for now, or adapt it to dict
        res = handle_frustrated(student)
        return {"reply": res, "actions": [{"label": "Talk to Counselor", "query": "connect me to counselor"}], "protocol": "Safety"}

    handlers = {
        "greeting": lambda: handle_greeting(student),
        "help": lambda: handle_help(),
        "attendance_overall": lambda: handle_attendance_overall(db, student),
        "attendance_subject": lambda: {"reply": handle_attendance_subject(db, student), "actions": [{"label": "Subject Breakdown", "action": "navigate", "payload": "/attendance"}]},
        "bunk_check": lambda: {"reply": handle_bunk_check(db, student), "actions": [{"label": "Simulate Bunk", "action": "navigate", "payload": "/attendance"}]},
        "reach_75": lambda: {"reply": handle_reach_75(db, student), "actions": []},
        "attendance_recovery": lambda: {"reply": handle_reach_75(db, student), "actions": []},
        "od_help": lambda: {"reply": handle_od_help(db, student), "actions": [{"label": "Apply OD", "action": "navigate", "payload": "/leave"}]},
        "marks": lambda: {"reply": handle_marks(db, student), "actions": [{"label": "Performance Analysis", "action": "navigate", "payload": "/performance"}]},
        "cgpa": lambda: {"reply": handle_cgpa(db, student), "actions": []},
        "sgpa": lambda: {"reply": handle_cgpa(db, student), "actions": []},
        "best_subject": lambda: {"reply": handle_best_subject(db, student), "actions": []},
        "weakest_subject": lambda: {"reply": handle_weakest_subject(db, student), "actions": []},
        "eligibility": lambda: {"reply": handle_eligibility(db, student), "actions": []},
        "profile": lambda: {"reply": handle_profile(student), "actions": [{"label": "Edit Profile", "action": "navigate", "payload": "/profile"}]},
        "leave_status": lambda: {"reply": handle_leave_status(db, student), "actions": [{"label": "My Requests", "action": "navigate", "payload": "/leave"}]},
        "exam_schedule": lambda: {"reply": handle_exam_schedule(db, student), "actions": [{"label": "Full Schedule", "action": "navigate", "payload": "/exams"}]},
        "holiday": lambda: {"reply": handle_holiday(db), "actions": []},
        "thank": lambda: {"reply": handle_thank(student), "actions": []},
        "missed_today": lambda: {"reply": handle_missed_today(db, student), "actions": []},
    }

    if intent in handlers:
        result = handlers[intent]()
        if "protocol" not in result:
            result["protocol"] = "Deterministic"
        return result

    # Fallback: Intelligence Ensemble v2 (Dynamic AI Answering)
    context = build_student_context(db, student.id)
    ai_result = await ai_service.ensemble_chat(message, context)
    return {
        "reply": ai_result["text"],
        "actions": ai_result["actions"],
        "protocol": ai_result["protocol"]
    }

