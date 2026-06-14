"""
Studvisor v2.0 — AI Chatbot Engine
Deterministic ERP queries + RAG fallback + Emotion-aware responses.
Context-injected per role via core/ai_context.py.
"""
from sqlalchemy.orm import Session
from collections import defaultdict
import re
from typing import AsyncGenerator, Dict, List, Optional

from backend.app.models import (
    Student, Attendance, Mark, Subject, LeaveRequest, ExamSchedule,
    AcademicPolicy, AcademicTerm, Holiday
)
from backend.services.gpa_service import gpa_service, percentage_to_grade


# ─── DATABASE HELPERS ───────────────────────────────────────────────────────

def get_policy(db: Session, key: str, default: str) -> str:
    policy = db.query(AcademicPolicy).filter(AcademicPolicy.policy_key == key).first()
    return policy.value if policy else default

def get_current_term(db: Session) -> AcademicTerm:
    return db.query(AcademicTerm).filter(AcademicTerm.is_active == True).first()


# ─── INTENT DETECTION ───────────────────────────────────────────────────────

INTENT_PATTERNS = {
    "greeting": r"\b(hi|hello|hey|good morning|good evening|greetings)\b",
    "attendance_subject": r"\b(subject.?wise|per subject|each subject|individual subject|attendance in each)\b",
    "attendance_recovery": r"\b(low attendance|how many classes to attend|lowest attendance|attendance recovery|less attendance|poor attendance|lowest)\b|which subject.*(low|less).*attendance",
    "bunk_check": r"\b(how many.*(miss|bunk|skip)|can i (miss|bunk|skip)|safe to bunk|bunk safety)\b",
    "reach_75": r"\b(reach 75|get to 75|need.*attend.*75|recover attendance|classes needed|reach target|how many.*classes.*attend.*eligible|how (many|mnay).*(more|shud|attend).*eligible)\b",
    "attendance_overall": r"\b(attendance|overall attendance|total attendance|my attendance|attendance percentage|attendance summary)\b",
    "overall_performance": r"\b(overall performance|my performance|how am i doing|academic performance|academic summary|my academic|performance summary|how (is|are) my (studies|academics|results|performance))\b",
    "cgpa": r"\b(cgpa|cumulative|overall gpa|my gpa|total gpa)\b",
    "sgpa": r"\b(sgpa|semester gpa|this semester gpa|current gpa)\b",
    "best_subject": r"\b(best subject|strongest|highest marks|top subject|favorite subject)\b",
    "weakest_subject": r"\b(weakest|worst subject|lowest marks|struggling|hardest subject)\b",
    "low_marks": r"\b(less|low|poor|failing|bad).*(marks|score|results)\b",
    "academic_comparison": r"\b(better|worse|improvement|compared to previous|compare.*semesters).*(acadamic|performance|semester|sem)\b",
    "simulation": r"\b(taking|take|if i take).*(day|days).*(off|bunk|miss|absent)\b",
    "marks": r"\b(marks|my marks|show marks|what are my marks|internal marks|cia marks|my results|show results)\b",
    "eligibility": r"(eligib|can i write exam|allowed to write|exam eligibility|hall ticket)",
    "holiday": r"\b(holiday|calendar|vacation|off day|working day)\b",
    "upcoming_event": r"\b(upcoming|next).*(event|program|function|cultural|sports)\b",
    "profile": r"\b(profile|my profile|who am i|my details|about me|my info|personal info)\b",
    "leave_status": r"\b(leave status|my leaves|pending leave|leave request|od status)\b",
    "od_help": r"\b(od assistance|missing od|classes missed without od|od leave check|uncovered absence|applied od yet|days.*taken off.*havent applied od)\b",
    "apply_od": r"\b(can i apply for od|how (to|do i) apply for od|apply for od|apply od|od eligibility|eligibility for od|od guidelines|od requirements)\b",
    "exam_schedule": r"\b(exam schedule|upcoming exam|next exam|when.*exam|exam dates)\b",
    "help": r"\b(help|what can you do|capabilities|commands|what do you do)\b",
    "thank": r"\b(thank|thanks|thx|appreciate|great job|good bot)\b",
    "frustrated": r"\b(cant understand|hate|give up|impossible|stressed|overwhelmed|too hard|failing|stupid bot)\b",
    "missed_today": r"\b(missed today|absent today|classes.*miss.*today|what did i miss)\b",
}


def normalize_text(text: str) -> str:
    """Preprocessing layer to handle shorthands, typos, and character normalization."""
    # 1. Basic cleaning
    text = text.lower().strip()
    
    # 2. Character normalization (e.g., "helloooo" -> "hello")
    text = re.sub(r'(.)\1{2,}', r'\1', text)
    
    # 3. Common Shorthand & Student Typos (Custom Fixes)
    shorthand_map = {
        r"\bhw\b": "how",
        r"\br\b": "are",
        r"\bu\b": "you",
        r"\bur\b": "your",
        r"\bwht\b": "what",
        r"\bmnay\b": "many",
        r"\bshud\b": "should",
        r"\battnd\b": "attend",
        r"\beligibl\b": "eligible",
        r"\bclses\b": "classes",
        r"\battndnce\b": "attendance",
    }
    for pattern, replacement in shorthand_map.items():
        text = re.sub(pattern, replacement, text)
        
    return text


def detect_intent(message: str) -> str:
    normalized = normalize_text(message)
    for intent, pattern in INTENT_PATTERNS.items():
        if re.search(pattern, normalized):
            return intent
    return "unknown"


def is_subject_mentioned(db: Session, message: str, semester: Optional[int] = None) -> bool:
    return len(get_mentioned_subject_ids(db, message, semester)) > 0


def get_mentioned_subject_ids(db: Session, message: str, semester: Optional[int] = None) -> List[int]:
    normalized = normalize_text(message)
    # Tokenize the message into words
    message_words = set(re.findall(r'\b\w+\b', normalized))
    
    subjects = db.query(Subject).all()
    matched_ids = []
    
    # Common short names/aliases mapping
    aliases = {
        "math": ["mathematics", "maths"],
        "maths": ["mathematics", "math"],
        "phy": ["physics"],
        "chem": ["chemistry"],
        "cn": ["computer networks", "network", "networks"],
        "se": ["software engineering"],
        "dsa": ["data structures", "data structures and algorithms", "algorithms"],
        "dbms": ["database", "database management", "database management systems"],
        "os": ["operating systems", "operating system"],
    }
    
    # Phase 1: Strong matches (Exact/substring name, code, or alias)
    for subj in subjects:
        subj_name = normalize_text(subj.name)
        subj_code = subj.code.lower() if subj.code else ""
        
        # 1. Match full subject name using word boundaries to avoid false substring matches
        if subj_name:
            name_pattern = re.escape(subj_name)
            name_pattern = name_pattern.replace(r'\-', '-').replace('-', '[- ]')
            if re.search(rf"\b{name_pattern}\b", normalized):
                matched_ids.append(subj.id)
                continue
            
        # 2. Match subject code using word boundaries to avoid matching substrings (like "ca" in "can")
        if subj_code:
            code_pattern = re.escape(subj_code)
            code_pattern = code_pattern.replace(r'\-', '-').replace('-', '[- ]')
            if re.search(rf"\b{code_pattern}\b", normalized):
                matched_ids.append(subj.id)
                continue
            
        # 3. Handle common abbreviations/aliases
        matched_by_alias = False
        for alias, targets in aliases.items():
            if alias in message_words:
                if any(t in subj_name for t in targets):
                    matched_ids.append(subj.id)
                    matched_by_alias = True
                    break
        if matched_by_alias:
            continue

    # Phase 2: Loose token matching (fallback only)
    if not matched_ids:
        for subj in subjects:
            subj_name = normalize_text(subj.name)
            # Ignore common stop words
            stop_words = {"and", "of", "in", "for", "the", "to", "with", "a", "an", "on", "subject", "attendance", "marks", "grade", "gpa", "bunk", "class", "classes"}
            subj_tokens = [w for w in re.findall(r'\b\w+\b', subj_name) if w not in stop_words]
            
            # If the student typed a word that uniquely matches a significant word in the subject name
            # We require tokens to be at least 3 characters to avoid short word collision
            significant_tokens = [t for t in subj_tokens if len(t) >= 3]
            if significant_tokens:
                if any(token in message_words for token in significant_tokens):
                    matched_ids.append(subj.id)
                    continue
                
    # Prioritization: If multiple subjects match, but one belongs to the student's current semester,
    # filter the matched_ids to only include subjects from their semester.
    if semester is not None and matched_ids:
        enrolled_matches = [
            sid for sid in matched_ids
            if db.query(Subject).filter(Subject.id == sid).first().semester == semester
        ]
        if enrolled_matches:
            return enrolled_matches

    return matched_ids




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

def handle_greeting(user) -> dict:
    name = getattr(user, "full_name", getattr(user, "name", "User")).split()[0]
    if getattr(user, "user_role", "student") == "student":
        return {
            "reply": f"Hello {name}, how can I help with your ERP data today?",
            "actions": [
                {"label": "📊 Attendance Summary", "query": "show my attendance", "category": "attendance"},
                {"label": "📅 Academic Calendar", "query": "when is next holiday", "category": "calendar"},
                {"label": "📈 Performance Hub", "query": "what is my cgpa", "category": "academic"}
            ]
        }
    else:
        return {
            "reply": f"Hello Professor {name}, how can I assist with your academic administrative tasks today?",
            "actions": [
                {"label": "📅 My Timetable", "query": "show my timetable", "category": "calendar"},
                {"label": "📝 Leave Requests", "query": "view pending leaves", "category": "compliance"},
                {"label": "📊 Attendance Stats", "query": "show attendance stats", "category": "attendance"}
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
            {"label": "📊 Attendance Summary", "query": "show my attendance summary", "category": "attendance"},
            {"label": "📚 Subject Attendance", "query": "show my subject wise attendance", "category": "attendance"},
            {"label": "🛏️ Bunk Safety Check", "query": "how many classes can i bunk", "category": "attendance"},
            {"label": "📈 CGPA/SGPA Summary", "query": "what is my cgpa", "category": "academic"},
            {"label": "📝 Subjectwise Marks", "query": "show my marks", "category": "academic"},
            {"label": "📅 Exam Schedule", "query": "show exams", "category": "academic"},
            {"label": "🌴 Next Holiday", "query": "when is next holiday", "category": "calendar"},
            {"label": "🩹 Uncovered Absences (OD)", "query": "show uncovered absences", "category": "compliance"},
            {"label": "📬 Recent Leaves", "query": "show my leave status", "category": "compliance"},
            {"label": "📋 Exam Eligibility", "query": "am i eligible for exams", "category": "academic"}
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

    min_pct = float(get_policy(db, "min_attendance", "75"))
    status = "STABLE" if pct >= (min_pct + 10) else "WARNING" if pct >= min_pct else "CRITICAL"
    actions = [{"label": "View Full Report", "action": "navigate", "payload": "/attendance"}]
    if pct < min_pct:
        actions.append({"label": "Recovery Plan", "query": "how to recover attendance"})

    return {
        "reply": f"• **Overall Attendance**: {pct}%\n• **Present**: {present}\n• **Absent**: {absent}\n• **Status**: {status}",
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
        return "No missed classes today. Record is spotless! ✨"
    
    missed = []
    for r in records:
        subj = db.query(Subject).filter(Subject.id == r.subject_id).first()
        missed.append(f"• {subj.name if subj else '?'}(Slot {r.slot or 'TBA'})")
    
    return "Absent sessions today:\n" + "\n".join(missed)

def get_subject_names_str(db: Session, subject_ids: Optional[List[int]]) -> str:
    if not subject_ids:
        return "the specified subject(s)"
    names = []
    for sid in subject_ids:
        subj = db.query(Subject).filter(Subject.id == sid).first()
        if subj:
            names.append(subj.name)
    if not names:
        return "the specified subject(s)"
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + " and " + names[-1]

def get_no_records_reason(db: Session, student: Student, subject_ids: Optional[List[int]], query_type: str) -> str:
    if not subject_ids:
        return f"No {query_type} records found for the specified subject(s)."
    non_enrolled_names = []
    no_records_names = []
    for sid in subject_ids:
        subj = db.query(Subject).filter(Subject.id == sid).first()
        if subj:
            if query_type != "marks" and subj.semester != student.semester:
                non_enrolled_names.append(subj.name)
            else:
                no_records_names.append(subj.name)
    if non_enrolled_names:
        return f"You are not enrolled in {', '.join(non_enrolled_names)} in your current semester (Semester {student.semester})."
    if no_records_names:
        return f"No {query_type} records found for {', '.join(no_records_names)}."
    return f"No {query_type} records found for the specified subject(s)."

def handle_attendance_subject(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "- **ATTENDANCE**: No records found."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    min_pct = float(get_policy(db, "min_attendance", "75"))
    lines = []
    for sid, d in data.items():
        if subject_ids is not None and sid not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        target = subj.min_attendance_override if subj and subj.min_attendance_override else min_pct
        status = "OK" if pct >= target else "LOW"
        lines.append(f"• **{subj.name if subj else '?'}**: {pct}% ({status})")

    if not lines:
        return get_no_records_reason(db, student, subject_ids, "attendance")
    return "Subject-wise Attendance:\n" + "\n".join(lines)


def handle_bunk_check(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "- **BUNK CHECK**: Insufficient Data."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    min_pct = float(get_policy(db, "min_attendance", "75"))
    lines = []
    for sid, d in data.items():
        if subject_ids is not None and sid not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == sid).first()
        p, t = d["present"], d["total"]
        target = subj.min_attendance_override if subj and subj.min_attendance_override else min_pct
        buffer = 0
        while (p) / (t + buffer + 1) * 100 >= target and buffer < 50:
            buffer += 1
        
        status = "SAFE" if buffer >= 3 else "WARN" if buffer > 0 else "CRIT"
        lines.append(f"• **{subj.name if subj else '?'}**: {buffer} classes ({status})")

    if not lines:
        return get_no_records_reason(db, student, subject_ids, "bunk check")
    return "\n".join(lines)


def handle_reach_75(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "- **RECOVERY**: Insufficient Data."

    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    min_pct = float(get_policy(db, "min_attendance", "75"))
    lines = []
    for sid, d in data.items():
        if subject_ids is not None and sid not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == sid).first()
        p, t = d["present"], d["total"]
        pct = round(p / t * 100, 1) if t > 0 else 100
        target = subj.min_attendance_override if subj and subj.min_attendance_override else min_pct
        
        if pct < target:
            needed = 0
            while (p + needed) / (t + needed) * 100 < target and needed < 200:
                needed += 1
            lines.append(f"• **{subj.name if subj else '?'}**: {pct}% (Requires **{needed}** more classes)")
        else:
            lines.append(f"• **{subj.name if subj else '?'}**: {pct}% (Safe)")

    if not lines:
        return get_no_records_reason(db, student, subject_ids, "recovery")
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


def handle_apply_od() -> dict:
    return {
        "reply": (
            "Yes, you can apply for On Duty (OD) if you are eligible under your institution's guidelines. OD is generally granted for activities such as:\n\n"
            "Participating in technical events, workshops, or hackathons.\n"
            "Representing the college in sports or cultural events.\n"
            "Attending internships, placement activities, or official academic programs.\n\n"
            "To apply for OD:\n\n"
            "Open the OD Application section in the portal.\n"
            "Select the date(s) and reason for the request.\n"
            "Upload any supporting documents, if required.\n"
            "Submit the request for faculty/HOD approval.\n\n"
            "If you tell me the reason for your OD request, I can help determine whether you're likely eligible."
        ),
        "actions": [
            {"label": "📝 Apply for OD", "action": "navigate", "payload": "/leave"}
        ]
    }


def handle_marks(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "- **MARKS**: Data Unavailable."

    lines = []
    for m in marks:
        if subject_ids is not None and m.subject_id not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        pct = round(m.marks_obtained / m.max_marks * 100, 1) if m.max_marks > 0 else 0
        grade = percentage_to_grade(pct)
        lines.append(f"• **{subj.name if subj else '?'}** ({m.assessment_type}): {m.marks_obtained}/{m.max_marks} ({pct}%) -> {grade['letter']}")

    if not lines:
        return get_no_records_reason(db, student, subject_ids, "marks")
    return "Academic Marks:\n" + "\n".join(lines)




def handle_low_marks(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if not marks:
        return "- **LOW MARKS**: No data available."
    pass_pct = float(get_policy(db, "passing_marks", "40"))
    lines = []
    for m in marks:
        if subject_ids is not None and m.subject_id not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
        threshold = subj.passing_marks if subj and subj.passing_marks else pass_pct
        pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
        if pct < threshold:
            lines.append(f"• **{subj.name if subj else '?'}**: {m.marks_obtained}/{m.max_marks} ({round(pct,1)}%) in {m.assessment_type}")

    if not lines:
        if subject_ids is not None:
            return f"Great news! You have no marks below the passing threshold in the specified subject(s). 🌟"
        return f"Great news! You have no subjects with less than {pass_pct}% marks in the current record. 🌟"
    
    return "Here are the subjects where you have lower marks:\n" + "\n".join(lines)


def handle_academic_comparison(db: Session, student: Student) -> str:
    result = gpa_service.get_cgpa(db, student.id)
    sems = result["semesters"]
    if len(sems) < 2:
        return "I need data from at least two semesters to perform a comparison. Currently, I only see your latest performance."

    latest = sems[-1]
    previous = sems[-2]
    diff = round(latest["sgpa"] - previous["sgpa"], 2)

    if diff > 0:
        return f"Yes! You are showing improvement. Your SGPA increased from **{previous['sgpa']}** (Sem {previous['semester']}) to **{latest['sgpa']}** (Sem {latest['semester']}). That's an increase of **{diff}** points! 📈"
    elif diff < 0:
        return f"Your performance has dipped slightly compared to the previous semester. Your SGPA went from **{previous['sgpa']}** to **{latest['sgpa']}**. Let's identify the areas needing focus to bounce back. 📉"
    else:
        return f"Your academic performance is consistent. You maintained an SGPA of **{latest['sgpa']}** across both Sem {previous['semester']} and Sem {latest['semester']}."


def handle_simulation(db: Session, student: Student, message: str) -> str:
    # Extract number of days from message
    match = re.search(r"(\d+)\s*day", message.lower())
    days = int(match.group(1)) if match else 1
    
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if not records:
        return "I don't have enough attendance data to run a simulation for you yet."

    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    current_pct = round(present / total * 100, 1)

    # Use policy for classes per day or default to 6
    classes_per_day = int(get_policy(db, "classes_per_day", "6"))
    min_pct = float(get_policy(db, "min_attendance", "75"))

    simulated_absences = days * classes_per_day
    new_total = total + simulated_absences
    new_pct = round(present / new_total * 100, 1)
    drop = round(current_pct - new_pct, 1)

    status = "SAFE" if new_pct >= min_pct else "RISKY"
    emoji = "✅" if status == "SAFE" else "⚠️"

    reply = (
        f"**Attendance Simulation ({days} Day{'s' if days > 1 else ''} Off)**:\n"
        f"• Current: **{current_pct}%**\n"
        f"• Simulated: **{new_pct}%** (Drop of {drop}%)\n"
        f"• Status: {emoji} **{status}**\n\n"
    )
    
    if new_pct < min_pct:
        reply += f"Warning: This will push your attendance below the mandatory {min_pct}% threshold. I recommend attending all current sessions instead."
    else:
        reply += f"You will still be above the {min_pct}% eligibility criteria even after taking {days} day{'s' if days > 1 else ''} off."
    
    return reply

def handle_cgpa(db: Session, student: Student) -> str:
    result = gpa_service.get_cgpa(db, student.id)
    if not result["semesters"]:
        return "- **CGPA**: Data Unavailable."

    lines = [f"- **CURRENT CGPA**: {result['cgpa']}"]
    for s in result["semesters"]:
        lines.append(f"  - SEM {s['semester']} SGPA: {s['sgpa']}")

    return "\n".join(lines)


def handle_overall_performance(db: Session, student: Student) -> dict:
    """Comprehensive academic performance summary: attendance + CGPA + best/weakest subject."""
    lines = []

    # ── Attendance ──────────────────────────────────────────
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if records:
        total = len(records)
        present = sum(1 for r in records if r.status == "P")
        absent = total - present
        pct = round(present / total * 100, 1)
        min_pct = float(get_policy(db, "min_attendance", "75"))
        att_status = "STABLE" if pct >= (min_pct + 10) else "WARNING" if pct >= min_pct else "CRITICAL"
        lines.append(f"Overall Attendance: {pct}%")
        lines.append(f"Present: {present}")
        lines.append(f"Absent: {absent}")
        lines.append(f"Status: {att_status}")
    else:
        lines.append("Overall Attendance: N/A")
        lines.append("Present: 0")
        lines.append("Absent: 0")
        lines.append("Status: NO DATA")

    # ── CGPA ────────────────────────────────────────────────
    result = gpa_service.get_cgpa(db, student.id)
    if result["semesters"]:
        lines.append(f"Current CGPA: {result['cgpa']}")
        for s in result["semesters"]:
            lines.append(f"Sem {s['semester']} SGPA: {s['sgpa']}")
    else:
        lines.append("Current CGPA: N/A")

    # ── Best & Weakest Subject ───────────────────────────────
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    if marks:
        subj_avg = defaultdict(list)
        for m in marks:
            pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
            subj_avg[m.subject_id].append(pct)

        best_id = max(subj_avg, key=lambda x: sum(subj_avg[x]) / len(subj_avg[x]))
        worst_id = min(subj_avg, key=lambda x: sum(subj_avg[x]) / len(subj_avg[x]))

        best_subj = db.query(Subject).filter(Subject.id == best_id).first()
        worst_subj = db.query(Subject).filter(Subject.id == worst_id).first()
        best_avg = round(sum(subj_avg[best_id]) / len(subj_avg[best_id]), 1)
        worst_avg = round(sum(subj_avg[worst_id]) / len(subj_avg[worst_id]), 1)

        lines.append(f"Best Subject: {best_subj.name if best_subj else '?'} ({best_avg}%)")
        lines.append(f"Weakest Subject: {worst_subj.name if worst_subj else '?'} ({worst_avg}%)")

    actions = [
        {"label": "📊 Full Attendance", "query": "show subject wise attendance", "category": "attendance"},
        {"label": "📈 CGPA Details", "query": "what is my cgpa", "category": "academic"},
        {"label": "📋 Exam Eligibility", "query": "am i eligible for exams", "category": "academic"},
        {"label": "📝 My Marks", "query": "show my marks", "category": "academic"},
    ]

    return {
        "reply": "\n".join(lines),
        "actions": actions
    }


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


def handle_eligibility(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    data = defaultdict(lambda: {"total": 0, "present": 0})
    for r in records:
        data[r.subject_id]["total"] += 1
        if r.status == "P":
            data[r.subject_id]["present"] += 1

    min_pct = float(get_policy(db, "min_attendance", "75"))
    lines = []
    for sid, d in data.items():
        if subject_ids is not None and sid not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == sid).first()
        pct = round(d["present"] / d["total"] * 100, 1) if d["total"] > 0 else 100
        target = subj.min_attendance_override if subj and subj.min_attendance_override else min_pct
        status = "ELIGIBLE" if pct >= target else "INELIGIBLE"
        lines.append(f"• **{subj.name if subj else '?'}**: {status} ({pct}%)")

    if not lines:
        return get_no_records_reason(db, student, subject_ids, "eligibility")
    return "Exam Eligibility:\n" + "\n".join(lines)




def handle_profile(student: Student) -> str:
    return f"""• **Name**: {student.full_name}
• **Roll Number**: {student.roll_number or 'N/A'}
• **Department**: {student.department or 'N/A'}
• **Semester**: {student.semester or 'N/A'}
• **Merit Points**: {student.merit_points} ({student.merit_tier or 'Novice'})
• **Contact**: {student.email or 'N/A'}"""


def handle_leave_status(db: Session, student: Student) -> str:
    leaves = db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).order_by(LeaveRequest.applied_on.desc()).limit(5).all()
    if not leaves:
        return "- **LEAVES**: 0 Requests."
    lines = ["- **RECENT LEAVES**:"]
    for l in leaves:
        lines.append(f"  - {l.leave_type} ({l.from_date} to {l.to_date}): {l.status}")
    return "\n".join(lines)


def handle_exam_schedule(db: Session, student: Student, subject_ids: Optional[List[int]] = None) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    exams = db.query(ExamSchedule).filter(ExamSchedule.exam_date >= today).order_by(ExamSchedule.exam_date).limit(10).all()
    if not exams:
        return "- **EXAMS**: None Scheduled."
    lines = []
    for e in exams:
        if subject_ids is not None and e.subject_id not in subject_ids:
            continue
        subj = db.query(Subject).filter(Subject.id == e.subject_id).first()
        lines.append(f"• **{e.exam_date}**: {subj.name if subj else '?'} ({e.exam_type}) @ {e.venue or 'TBA'}")
    if not lines:
        return get_no_records_reason(db, student, subject_ids, "exams scheduled")
    return "Upcoming Exams:\n" + "\n".join(lines)




def handle_holiday(db: Session) -> str:
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Priority 1: Check new Holidays table
    h = db.query(Holiday).filter(Holiday.date >= today).order_by(Holiday.date).first()
    if h:
        return f"- **NEXT HOLIDAY**: {h.name} ({h.date}) [{h.type}]"

    # Priority 2: Fallback to AcademicCalendar
    next_holiday = db.query(AcademicCalendar).filter(AcademicCalendar.date >= today, AcademicCalendar.is_working_day == 0).order_by(AcademicCalendar.date).first()
    if not next_holiday:
        return "- **HOLIDAY**: None Scheduled."
    return f"- **NEXT HOLIDAY**: {next_holiday.holiday_name} ({next_holiday.date})."


def handle_upcoming_event(db: Session) -> str:
    from datetime import datetime
    from backend.app.models import Event
    today = datetime.now().strftime("%Y-%m-%d")
    event = db.query(Event).filter(Event.event_date >= today).order_by(Event.event_date).first()
    if not event:
        return "There are no upcoming events scheduled in the campus calendar at the moment."
    return f"The next campus event is **{event.title}** scheduled for **{event.event_date}** at **{event.venue or 'TBA'}**.\n\n{event.description or ''}"


def handle_frustrated(user) -> str:
    name = getattr(user, "full_name", getattr(user, "name", "User")).split()[0]
    return f"I can sense you're feeling a bit overwhelmed, {name}. Please take a deep breath—I'm right here to support you. Let's look at a Recovery Plan together, or I can help you connect with a faculty advisor to discuss any challenges you're facing."


def handle_thank(user) -> str:
    name = getattr(user, "full_name", getattr(user, "name", "User")).split()[0]
    return f"You're very welcome, {name}! Happy to help. Let me know if there's anything else I can assist you with!"


def handle_distressed(user) -> dict:
    name = getattr(user, "full_name", getattr(user, "name", "User")).split()[0]
    return {
        "reply": f"I'm really concerned about you, {name}. Please know that you're not alone and there are people who want to help. I've triggered a priority support alert, and you can call our 24/7 Support Cell at 1800-Studvisor-CARE immediately for professional, caring assistance. We're here for you.",
        "actions": [{"label": "📞 Emergency Support", "action": "call", "payload": "18005550199"}]
    }


# ─── MAIN CHAT DISPATCHER ───────────────────────────────────────────────────

async def process_chat(db: Session, user, message: str) -> dict:
    """Main entry point for the AI chatbot. Detects intent and dispatches to handler."""
    from backend.services.ai_service import ai_service
    from backend.core.ai_context import build_student_context, build_faculty_context

    emotion = detect_emotion(message)
    intent = detect_intent(message)
    is_student = getattr(user, "user_role", "student") == "student"

    subject_ids = None
    student_sem = getattr(user, "semester", None) if is_student else None
    if is_student and is_subject_mentioned(db, message, student_sem):
        subject_ids = get_mentioned_subject_ids(db, message, student_sem)
        if intent == "attendance_overall":
            intent = "attendance_subject"

    # Emotion override
    if emotion == "distressed":
        return handle_distressed(user) if is_student else {"reply": "I'm here to help, Professor. If you're feeling stressed, please reach out to the staff wellness coordinator.", "protocol": "Safety"}
    
    if emotion == "frustrated" and is_student:
        res = handle_frustrated(user)
        return {"reply": res, "actions": [{"label": "Talk to Counselor", "query": "connect me to counselor"}], "protocol": "Safety"}

    # Unified handlers for all roles
    handlers = {
        "greeting": lambda: handle_greeting(user),
        "help": lambda: handle_help(),
        "holiday": lambda: {"reply": handle_holiday(db), "actions": []},
        "upcoming_event": lambda: {"reply": handle_upcoming_event(db), "actions": [{"label": "Campus Events", "action": "navigate", "payload": "/events"}]},
        "thank": lambda: {"reply": handle_thank(user), "actions": []},
    }

    # Student-only deterministic handlers
    if is_student:
        handlers.update({
            "attendance_overall": lambda: handle_attendance_overall(db, user),
            "attendance_subject": lambda: {"reply": handle_attendance_subject(db, user, subject_ids=subject_ids), "actions": []},
            "bunk_check": lambda: {"reply": handle_bunk_check(db, user, subject_ids=subject_ids), "actions": []},
            "reach_75": lambda: {"reply": handle_reach_75(db, user, subject_ids=subject_ids), "actions": []},
            "attendance_recovery": lambda: {"reply": handle_reach_75(db, user, subject_ids=subject_ids), "actions": []},
            "cgpa": lambda: {"reply": handle_cgpa(db, user), "actions": [{"label": "📊 Semester Breakdown", "query": "show my sgpa", "category": "academic"}]},
            "sgpa": lambda: {"reply": handle_cgpa(db, user), "actions": []},
            "marks": lambda: {"reply": handle_marks(db, user, subject_ids=subject_ids), "actions": []},
            "low_marks": lambda: {"reply": handle_low_marks(db, user, subject_ids=subject_ids), "actions": []},
            "best_subject": lambda: {"reply": handle_best_subject(db, user), "actions": []},
            "weakest_subject": lambda: {"reply": handle_weakest_subject(db, user), "actions": []},
            "eligibility": lambda: {"reply": handle_eligibility(db, user, subject_ids=subject_ids), "actions": []},
            "profile": lambda: {"reply": handle_profile(user), "actions": []},
            "leave_status": lambda: {"reply": handle_leave_status(db, user), "actions": []},
            "od_help": lambda: {"reply": handle_od_help(db, user), "actions": []},
            "apply_od": lambda: handle_apply_od(),
            "exam_schedule": lambda: {"reply": handle_exam_schedule(db, user, subject_ids=subject_ids), "actions": []},
            "missed_today": lambda: {"reply": handle_missed_today(db, user), "actions": []},
            "simulation": lambda: {"reply": handle_simulation(db, user, message), "actions": []},
            "academic_comparison": lambda: {"reply": handle_academic_comparison(db, user), "actions": []},
            "overall_performance": lambda: handle_overall_performance(db, user),
        })

    if intent in handlers:
        result = handlers[intent]()
        if "protocol" not in result:
            result["protocol"] = "Deterministic"
        return result

    # Fallback to AI Ensemble
    if is_student:
        context = build_student_context(db, user.id)
    else:
        context = build_faculty_context(db, user.id)
        
    ensemble_result = await ai_service.ensemble_chat(message, context)
    return {
        "reply": ensemble_result.get("text", "[AI] Unable to process query."),
        "actions": ensemble_result.get("actions", []),
        "protocol": ensemble_result.get("protocol", "Ensemble")
    }


async def process_chat_stream(db: Session, user, message: str) -> AsyncGenerator[Dict, None]:
    """Streaming entry point for the AI chatbot. Yields meta then chunks."""
    from backend.services.ai_service import ai_service
    from backend.core.ai_context import build_student_context, build_faculty_context

    emotion = detect_emotion(message)
    intent = detect_intent(message)
    is_student = getattr(user, "user_role", "student") == "student"

    subject_ids = None
    student_sem = getattr(user, "semester", None) if is_student else None
    if is_student and is_subject_mentioned(db, message, student_sem):
        subject_ids = get_mentioned_subject_ids(db, message, student_sem)
        if intent == "attendance_overall":
            intent = "attendance_subject"

    # Emotion override
    if emotion == "distressed":
        res = handle_distressed(user) if is_student else {"reply": "I'm here to help, Professor. If you're feeling stressed, please reach out to the staff wellness coordinator.", "actions": []}
        yield {"type": "meta", "actions": res.get("actions", []), "protocol": "Safety"}
        yield {"type": "chunk", "token": res.get("reply", res)}
        return

    # Unified handlers for all roles
    handlers = {
        "greeting": lambda: handle_greeting(user),
        "help": lambda: handle_help(),
        "holiday": lambda: {"reply": handle_holiday(db), "actions": []},
        "upcoming_event": lambda: {"reply": handle_upcoming_event(db), "actions": [{"label": "Campus Events", "action": "navigate", "payload": "/events"}]},
        "thank": lambda: {"reply": handle_thank(user), "actions": []},
    }

    # Student-only deterministic handlers
    if is_student:
        handlers.update({
            "attendance_overall": lambda: handle_attendance_overall(db, user),
            "attendance_subject": lambda: {"reply": handle_attendance_subject(db, user, subject_ids=subject_ids), "actions": []},
            "bunk_check": lambda: {"reply": handle_bunk_check(db, user, subject_ids=subject_ids), "actions": []},
            "reach_75": lambda: {"reply": handle_reach_75(db, user, subject_ids=subject_ids), "actions": []},
            "attendance_recovery": lambda: {"reply": handle_reach_75(db, user, subject_ids=subject_ids), "actions": []},
            "cgpa": lambda: {"reply": handle_cgpa(db, user), "actions": [{"label": "📊 Semester Breakdown", "query": "show my sgpa", "category": "academic"}]},
            "sgpa": lambda: {"reply": handle_cgpa(db, user), "actions": []},
            "marks": lambda: {"reply": handle_marks(db, user, subject_ids=subject_ids), "actions": []},
            "low_marks": lambda: {"reply": handle_low_marks(db, user, subject_ids=subject_ids), "actions": []},
            "best_subject": lambda: {"reply": handle_best_subject(db, user), "actions": []},
            "weakest_subject": lambda: {"reply": handle_weakest_subject(db, user), "actions": []},
            "eligibility": lambda: {"reply": handle_eligibility(db, user, subject_ids=subject_ids), "actions": []},
            "profile": lambda: {"reply": handle_profile(user), "actions": []},
            "leave_status": lambda: {"reply": handle_leave_status(db, user), "actions": []},
            "od_help": lambda: {"reply": handle_od_help(db, user), "actions": []},
            "apply_od": lambda: handle_apply_od(),
            "exam_schedule": lambda: {"reply": handle_exam_schedule(db, user, subject_ids=subject_ids), "actions": []},
            "missed_today": lambda: {"reply": handle_missed_today(db, user), "actions": []},
            "simulation": lambda: {"reply": handle_simulation(db, user, message), "actions": []},
            "academic_comparison": lambda: {"reply": handle_academic_comparison(db, user), "actions": []},
            "overall_performance": lambda: handle_overall_performance(db, user),
        })

    if intent in handlers:
        result = handlers[intent]()
        yield {"type": "meta", "actions": result.get("actions", []), "protocol": "Deterministic"}
        yield {"type": "chunk", "token": result["reply"]}
        return

    # Fallback to AI Service Stream
    stream_actions = []
    is_academic_query = any(k in message.upper() for k in ["ATTENDANCE", "BUNK", "CGPA", "GPA", "MARKS", "LEAVE", "PROFILE", "EXAM"])
    if is_academic_query:
        if any(k in message.upper() for k in ["ATTENDANCE", "BUNK"]):
            stream_actions.append({"label": "View Attendance", "action": "navigate", "payload": "/attendance"})
        if any(k in message.upper() for k in ["EXAM", "SCHEDULE"]):
            stream_actions.append({"label": "Check Exams", "action": "navigate", "payload": "/exams"})
        if any(k in message.upper() for k in ["LEAVE", "REQUEST"]):
            stream_actions.append({"label": "My Requests", "action": "navigate", "payload": "/leave"})
        if any(k in message.upper() for k in ["PROFILE"]):
            stream_actions.append({"label": "Edit Profile", "action": "navigate", "payload": "/profile"})

    yield {"type": "meta", "actions": stream_actions, "protocol": "Ensemble Stream"}
    context = build_student_context(db, user.id) if is_student else build_faculty_context(db, user.id)
    async for token in ai_service.ensemble_chat_stream(message, context):
        yield {"type": "chunk", "token": token}

