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
    "greeting": r"\b(hi|hello|hey|good morning|good evening)\b",
    "attendance_overall": r"\b(overall attendance|total attendance|my attendance|attendance percentage)\b",
    "attendance_subject": r"\b(subject.?wise|per subject|each subject|individual subject)\b",
    "bunk_check": r"\b(how many.*(miss|bunk|skip)|can i (miss|bunk|skip)|safe to bunk)\b",
    "reach_75": r"\b(reach 75|get to 75|need.*attend.*75|recover attendance|classes needed)\b",
    "marks": r"\b(my marks|show marks|what are my marks|internal marks|cia marks)\b",
    "cgpa": r"\b(cgpa|cumulative|overall gpa|my gpa)\b",
    "sgpa": r"\b(sgpa|semester gpa|this semester gpa)\b",
    "best_subject": r"\b(best subject|strongest|highest marks|top subject)\b",
    "weakest_subject": r"\b(weakest|worst subject|lowest marks|struggling)\b",
    "eligibility": r"\b(eligib|can i write exam|allowed to write|exam eligibility)\b",
    "profile": r"\b(my profile|who am i|my details|about me|my info)\b",
    "leave_status": r"\b(leave status|my leaves|pending leave|leave request)\b",
    "exam_schedule": r"\b(exam schedule|upcoming exam|next exam|when.*exam)\b",
    "help": r"\b(help|what can you do|capabilities|commands)\b",
    "thank": r"\b(thank|thanks|thx|appreciate)\b",
    "frustrated": r"\b(cant understand|hate|give up|impossible|stressed|overwhelmed|too hard|failing)\b",
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

def handle_greeting(student: Student) -> str:
    return f"Hey {student.full_name}! 👋 I'm Studvisor AI, your campus assistant. Ask me about attendance, marks, CGPA, exams, leave status, or anything academic!"


def handle_help() -> str:
    return """Here's what I can help you with:

📊 **Attendance** — "What is my attendance?", "Subject-wise attendance", "Can I bunk today?"
📈 **Marks & GPA** — "Show my marks", "What is my CGPA?", "Best/weakest subject"
📝 **Exams** — "Upcoming exams", "Am I eligible to write exams?"
📋 **Leave** — "My leave status"
👤 **Profile** — "Show my profile"
🔮 **AI Features** — "How many classes to reach 75%?", "Safe to bunk?"

Just ask naturally — I understand conversational queries!"""


def handle_attendance_overall(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "No attendance records found yet. Your faculty may not have started marking attendance."

    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    absent = sum(1 for r in records if r.status == "A")
    dl = total - present - absent
    pct = round(present / total * 100, 1)

    status = "✅ You're in great shape!" if pct >= 85 else "⚠️ Watch out — you're getting close to the threshold." if pct >= 75 else "🚨 CRITICAL — You're below the 75% eligibility threshold!"

    return f"""📊 **Overall Attendance Summary**

| Metric | Value |
|--------|-------|
| Total Classes | {total} |
| Present | {present} |
| Absent | {absent} |
| Duty Leave | {dl} |
| **Percentage** | **{pct}%** |

{status}"""
def handle_missed_today(db: Session, student: Student) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    records = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.date == today,
        Attendance.status == "A"
    ).all()
    
    if not records:
        return "You haven't missed any classes today! Keep up the good work. 🏆"
    
    lines = ["🚩 **Classes Missed Today**\n"]
    for r in records:
        subj = db.query(Subject).filter(Subject.id == r.subject_id).first()
        lines.append(f"- **{subj.name if subj else '?'}** ({r.slot or 'TBA'})")
    
    return "\n".join(lines)

def handle_attendance_subject(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "No attendance records found."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = ["📚 **Subject-wise Attendance**\n", "| Subject | Present | Total | Percentage | Status |", "|---------|---------|-------|------------|--------|"]
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        status = "✅" if pct >= 75 else "🚨"
        lines.append(f"| {subj.name if subj else '?'} | {d['present']} | {d['total']} | {pct}% | {status} |")

    return "\n".join(lines)


def handle_bunk_check(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "Not enough attendance data to calculate."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = ["🎯 **Bunk Safety Analysis**\n"]
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        p, t = d["present"], d["total"]
        buffer = 0
        while (p) / (t + buffer + 1) * 100 >= 75 and buffer < 50:
            buffer += 1

        if buffer >= 3:
            lines.append(f"✅ **{subj.name if subj else '?'}** — You can miss **{buffer}** more classes safely")
        elif buffer > 0:
            lines.append(f"⚠️ **{subj.name if subj else '?'}** — Only **{buffer}** class(es) of buffer remaining")
        else:
            lines.append(f"🚫 **{subj.name if subj else '?'}** — Cannot miss ANY more classes!")

    return "\n".join(lines)


def handle_reach_75(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    lines = ["📈 **Recovery Plan to Reach 75%**\n"]
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        p, t = d["present"], d["total"]
        pct = round(p / t * 100, 1) if t > 0 else 100

        if pct >= 75:
            lines.append(f"✅ **{subj.name if subj else '?'}** — Already at {pct}%, no recovery needed")
        else:
            needed = 0
            while (p + needed) / (t + needed) * 100 < 75 and needed < 200:
                needed += 1
            if needed < 200:
                lines.append(f"⚠️ **{subj.name if subj else '?'}** ({pct}%) — Attend next **{needed}** consecutive classes")
            else:
                lines.append(f"🚨 **{subj.name if subj else '?'}** ({pct}%) — Recovery not feasible with regular classes. Apply for OD/Medical.")

    return "\n".join(lines)


def handle_marks(db: Session, student: Student) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).order_by(Mark.semester, Mark.subject_id).all()
    if not marks:
        return "No marks found yet. Results may not be published."

    lines = ["📝 **Your Academic Marks**\n", "| Subject | Assessment | Obtained | Max | % | Grade |", "|---------|------------|----------|-----|---|-------|"]
    for m in marks:
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        pct = round(m.marks_obtained / m.max_marks * 100, 1) if m.max_marks > 0 else 0
        grade = percentage_to_grade(pct)
        lines.append(f"| {subj.name if subj else '?'} | {m.assessment_type} | {m.marks_obtained} | {m.max_marks} | {pct}% | {grade['letter']} |")

    return "\n".join(lines)


def handle_cgpa(db: Session, student: Student) -> str:
    result = gpa_service.get_cgpa(db, student.id)
    if not result["semesters"]:
        return "No marks data available for CGPA calculation."

    lines = [f"🎓 **Your CGPA: {result['cgpa']}**\n"]
    for s in result["semesters"]:
        lines.append(f"  Semester {s['semester']}: SGPA **{s['sgpa']}**")

    return "\n".join(lines)


def handle_best_subject(db: Session, student: Student) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "No marks data available."
    subj_avg = defaultdict(list)
    for m in marks:
        pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
        subj_avg[m.subject_id].append(pct)
    best_id = max(subj_avg, key=lambda x: sum(subj_avg[x]) / len(subj_avg[x]))
    subj = db.query(Subject).filter(Subject.id == best_id).first()
    avg = round(sum(subj_avg[best_id]) / len(subj_avg[best_id]), 1)
    return f"🌟 Your strongest subject is **{subj.name if subj else '?'}** with an average of **{avg}%**. Keep it up!"


def handle_weakest_subject(db: Session, student: Student) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "No marks data available."
    subj_avg = defaultdict(list)
    for m in marks:
        pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
        subj_avg[m.subject_id].append(pct)
    worst_id = min(subj_avg, key=lambda x: sum(subj_avg[x]) / len(subj_avg[x]))
    subj = db.query(Subject).filter(Subject.id == worst_id).first()
    avg = round(sum(subj_avg[worst_id]) / len(subj_avg[worst_id]), 1)
    return f"📉 Your weakest subject is **{subj.name if subj else '?'}** at **{avg}%**. Consider extra study sessions or peer tutoring."


def handle_eligibility(db: Session, student: Student) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    eligible = []
    not_eligible = []
    for sid, d in data.items():
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 100
        if pct >= 75:
            eligible.append(f"✅ {subj.name if subj else '?'} ({pct}%)")
        else:
            not_eligible.append(f"🚨 {subj.name if subj else '?'} ({pct}%)")

    result = "🎫 **Exam Eligibility Check**\n\n"
    if not_eligible:
        result += "**NOT ELIGIBLE (below 75%):**\n" + "\n".join(not_eligible)
        result += f"\n\n⚠️ You are NOT eligible for exams in {len(not_eligible)} subject(s). Contact your faculty advisor."
    else:
        result += "You are **eligible for all exams**! 🎉\n\n" + "\n".join(eligible)

    return result


def handle_profile(student: Student) -> str:
    return f"""👤 **Your Profile**

| Field | Value |
|-------|-------|
| Name | {student.full_name} |
| Username | {student.username} |
| Department | {student.department or 'N/A'} |
| Semester | {student.semester or 'N/A'} |
| Section | {student.section or 'N/A'} |
| Roll Number | {student.roll_number or 'N/A'} |
| Merit Points | {student.merit_points} |
| Merit Tier | {student.merit_tier or 'Novice'} |
| Email | {student.email or 'N/A'} |"""


def handle_leave_status(db: Session, student: Student) -> str:
    leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).order_by(LeaveRequest.applied_on.desc()).limit(5).all()
    if not leaves:
        return "You have no leave requests on record."
    lines = ["📋 **Recent Leave Requests**\n", "| Type | From | To | Status |", "|------|------|----|--------|"]
    for l in leaves:
        emoji = "✅" if "Approved" in l.status else "❌" if l.status == "Rejected" else "⏳"
        lines.append(f"| {l.leave_type} | {l.from_date} | {l.to_date} | {emoji} {l.status} |")
    return "\n".join(lines)


def handle_exam_schedule(db: Session, student: Student) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    exams = db.query(ExamSchedule).filter(ExamSchedule.exam_date >= today).order_by(ExamSchedule.exam_date).limit(10).all()
    if not exams:
        return "No upcoming exams scheduled. 🎉"
    lines = ["📅 **Upcoming Exams**\n", "| Subject | Type | Date | Venue |", "|---------|------|------|-------|"]
    for e in exams:
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first()
        lines.append(f"| {subj.name if subj else '?'} | {e.exam_type} | {e.exam_date} | {e.venue or 'TBA'} |")
    return "\n".join(lines)


def handle_frustrated(student: Student) -> str:
    return f"""I hear you, {student.full_name}. It's completely normal to feel this way — academics can be overwhelming sometimes. 💙

Here are some things that might help:
1. **Break it down** — Focus on one subject at a time, not everything at once
2. **Peer tutoring** — Use `/v2/ai/student/peer-mentors` to find classmates who can help
3. **Talk to someone** — Your faculty advisor or the campus counsellor is always available
4. **Study schedule** — I can help you create a day-by-day plan based on your exam dates

You've got this. Want me to create a recovery plan for your attendance or marks?"""


def handle_thank(student: Student) -> str:
    return f"You're welcome, {student.full_name}! Feel free to ask me anything anytime. Good luck with your studies! 🌟"


def handle_distressed(student: Student) -> str:
    return f"""{student.full_name}, I'm detecting that you're going through a really tough time. 💙 
Please know that you're not alone, and there's help available.

1. **Student Support Cell** — Open 24/7 for anyone feeling overwhelmed
2. **Campus Counsellor** — You can book an anonymous session via the 'Campus' tab
3. **Emergency Helpline** — Call 1800-Studvisor-CARE immediately if you need someone to talk to right now.

Academic pressure is real, but your well-being is much more important. Would you like me to notify your faculty advisor to reach out for a supportive chat?"""


# ─── MAIN CHAT DISPATCHER ───────────────────────────────────────────────────

def process_chat(db: Session, student: Student, message: str) -> str:
    """Main entry point for the AI chatbot. Detects intent and dispatches to handler."""
    emotion = detect_emotion(message)
    intent = detect_intent(message)

    # Emotion override: if frustrated/anxious/distressed, respond empathetically first
    if emotion == "distressed":
        return handle_distressed(student)
    if emotion == "frustrated":
        return handle_frustrated(student)

    handlers = {
        "greeting": lambda: handle_greeting(student),
        "help": lambda: handle_help(),
        "attendance_overall": lambda: handle_attendance_overall(db, student),
        "attendance_subject": lambda: handle_attendance_subject(db, student),
        "bunk_check": lambda: handle_bunk_check(db, student),
        "reach_75": lambda: handle_reach_75(db, student),
        "marks": lambda: handle_marks(db, student),
        "cgpa": lambda: handle_cgpa(db, student),
        "sgpa": lambda: handle_cgpa(db, student),
        "best_subject": lambda: handle_best_subject(db, student),
        "weakest_subject": lambda: handle_weakest_subject(db, student),
        "eligibility": lambda: handle_eligibility(db, student),
        "profile": lambda: handle_profile(student),
        "leave_status": lambda: handle_leave_status(db, student),
        "exam_schedule": lambda: handle_exam_schedule(db, student),
        "thank": lambda: handle_thank(student),
        "missed_today": lambda: handle_missed_today(db, student),
    }

    if intent in handlers:
        return handlers[intent]()

    # Fallback: unknown intent
    return (
        f"I'm not sure I understood that, {student.full_name}. "
        "Try asking about: attendance, marks, CGPA, exam schedule, leave status, "
        "bunk safety, or eligibility. Type **help** for a full list of commands."
    )

