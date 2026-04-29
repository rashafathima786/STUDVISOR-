"""
v2.0 AI-Powered Routes — Context-aware chat, risk prediction, question paper gen, peer matching.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json, asyncio

from backend.core.security import get_current_student, get_current_faculty, require_role
from backend.app.database import get_db
from backend.core.ai_context import build_student_context, build_faculty_context, build_admin_context
from backend.services.predictive_service import predictive_service
from backend.services.gamification_service import gamification_service

router = APIRouter(prefix="/v2/ai", tags=["AI Engine v2"])


class ChatRequest(BaseModel):
    query: str
    context_page: Optional[str] = None  # attendance, marks, gpa, etc.


class QuestionPaperRequest(BaseModel):
    subject_code: str
    exam_type: str = "CIA"  # CIA, Model, University
    total_marks: int = 50
    bloom_distribution: Optional[dict] = None  # {"remember": 20, "understand": 30, ...}


# ─── STUDENT AI ──────────────────────────────────────────────────────────────

@router.post("/student/chat")
async def student_chat(req: ChatRequest, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Context-aware AI chat for students using the premium Intelligence Ensemble."""
    from backend.services.ai_service import ai_service
    # We use the detailed context builder
    context = build_student_context(db, student.id)
    # Use ensemble chat which uses both Gemini and Groq
    ai_response = await ai_service.ensemble_chat(req.query, context)
    return {
        "response": ai_response,
        "context_page": req.context_page,
        "ai_provider": "Intelligence-Ensemble-v2",
    }


@router.post("/student/chat/stream")
async def student_chat_stream(req: ChatRequest, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """SSE streaming AI chat with context injection."""
    from backend.services.ai_service import ai_service
    system_prompt = build_student_context(db, student.id)
    
    async def generate():
        async for delta in ai_service.chat_stream(system_prompt, req.query):
            yield f"data: {delta}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/student/suggestions")
def chat_suggestions(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI-generated contextual question suggestions based on student state."""
    from backend.app.models import Attendance, Mark
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == "P")
    att_pct = round(present / total * 100, 1) if total > 0 else 100

    suggestions = [
        "What is my current CGPA?",
        "Show my attendance summary",
        "Which subjects need improvement?",
    ]

    if att_pct < 75:
        suggestions.insert(0, f"How many classes do I need to attend to reach 75%?")
        suggestions.append("Can I still get exam eligibility?")
    if att_pct >= 90:
        suggestions.append("Am I safe to take a day off?")

    return {"suggestions": suggestions}


@router.get("/student/safe-to-bunk")
def safe_to_bunk(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI-computed: which subjects have enough attendance buffer."""
    from backend.app.models import Attendance, Subject
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()

    subj_data = {}
    for r in records:
        if r.subject_id not in subj_data:
            subj = db.query(Subject).filter(Subject.id == r.subject_id).first()
            subj_data[r.subject_id] = {"name": subj.name if subj else "?", "total": 0, "present": 0}
        subj_data[r.subject_id]["total"] += 1
        if r.status == "P":
            subj_data[r.subject_id]["present"] += 1

    result = []
    for sid, d in subj_data.items():
        pct = d["present"] / d["total"] * 100 if d["total"] > 0 else 100
        # Calculate how many classes can be missed and still stay at 75%
        buffer = 0
        p, t = d["present"], d["total"]
        while p / (t + buffer + 1) * 100 >= 75 and buffer < 50:
            buffer += 1

        result.append({
            "subject": d["name"],
            "current_pct": round(pct, 1),
            "classes_can_miss": buffer,
            "safe": buffer > 0,
            "status": "✅ Safe" if buffer >= 3 else "⚠️ Risky" if buffer > 0 else "🚫 Cannot miss",
        })

    return {"subjects": sorted(result, key=lambda x: x["classes_can_miss"], reverse=True)}


@router.get("/student/recovery-plan")
def attendance_recovery_plan(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI plan to recover attendance in subjects below 75%."""
    from backend.app.models import Attendance, Subject
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()

    subj_data = {}
    for r in records:
        if r.subject_id not in subj_data:
            subj = db.query(Subject).filter(Subject.id == r.subject_id).first()
            subj_data[r.subject_id] = {"name": subj.name if subj else "?", "total": 0, "present": 0}
        subj_data[r.subject_id]["total"] += 1
        if r.status == "P":
            subj_data[r.subject_id]["present"] += 1

    plans = []
    for sid, d in subj_data.items():
        pct = d["present"] / d["total"] * 100 if d["total"] > 0 else 100
        if pct < 75:
            # Calculate classes needed
            needed = 0
            p, t = d["present"], d["total"]
            while (p + needed) / (t + needed) * 100 < 75:
                needed += 1
                if needed > 200:
                    needed = -1
                    break

            plans.append({
                "subject": d["name"],
                "current_pct": round(pct, 1),
                "classes_attended": d["present"],
                "total_classes": d["total"],
                "classes_needed": needed,
                "recovery_possible": needed != -1 and needed <= 30,
                "strategy": ("On track — keep attending regularly" if needed == 0
                    else f"Attend next {needed} consecutive classes with zero absences" if needed <= 30
                    else "Apply for OD/medical certificate to cover missed classes"),
            })

    return {"recovery_plans": plans, "critical_count": sum(1 for p in plans if not p["recovery_possible"])}


# ─── STUDENT GAMIFICATION ───────────────────────────────────────────────────

@router.get("/student/badges")
def student_badges(student=Depends(get_current_student), db: Session = Depends(get_db)):
    return {"badges": gamification_service.check_badges(db, student.id), "total_xp": gamification_service.get_xp(db, student.id)}

@router.get("/student/peer-mentors")
def peer_mentors(student=Depends(get_current_student), db: Session = Depends(get_db)):
    return {"mentors": gamification_service.find_peer_mentors(db, student.id)}


# ─── STUDENT RISK (self-check) ──────────────────────────────────────────────

@router.get("/student/my-risk-score")
def my_risk_score(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Student can see their own risk assessment (anonymized version)."""
    risk = predictive_service.compute_all_risks(db, student.id)
    return {
        "academic_health": "Good" if risk["combined_score"] < 0.3 else "Needs Attention" if risk["combined_score"] < 0.6 else "Critical",
        "areas_of_concern": [s for r in [risk["dropout_risk"], risk["academic_risk"]] for s in r["signals"]],
        "recommendation": risk["recommended_intervention"],
    }


# ─── FACULTY AI ──────────────────────────────────────────────────────────────

@router.post("/faculty/chat")
async def faculty_chat(req: ChatRequest, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    context = build_faculty_context(db, faculty.id)
    return {
        "response": f"[Faculty AI] Analyzing class data for your query: '{req.query}'",
        "ai_provider": "Studvisor-ai-v2",
    }


@router.get("/faculty/class-health")
def class_health(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    """AI summary: which students are at risk in faculty's classes."""
    from backend.app.models import Subject, Student, Attendance
    from sqlalchemy import func, case
    subject_codes = [s.strip() for s in (faculty.subjects_teaching or "").split(",") if s.strip()]
    if not subject_codes:
        return {"at_risk_students": [], "total_flagged": 0}

    subjects = db.query(Subject).filter(Subject.code.in_(subject_codes)).all()
    subject_ids = [subj.id for subj in subjects]
    subject_map = {subj.id: subj.name for subj in subjects}

    # Single aggregation query: total and present counts per (student, subject)
    rows = (
        db.query(
            Attendance.student_id,
            Attendance.subject_id,
            func.count(Attendance.id).label("total"),
            func.sum(case((Attendance.status == "P", 1), else_=0)).label("present"),
        )
        .filter(Attendance.subject_id.in_(subject_ids))
        .group_by(Attendance.student_id, Attendance.subject_id)
        .all()
    )

    # Bulk-fetch student names
    student_ids = list({r.student_id for r in rows})
    students = {s.id: s.full_name for s in db.query(Student).filter(Student.id.in_(student_ids)).all()}

    at_risk = []
    for r in rows:
        if r.total == 0:
            continue
        pct = r.present / r.total * 100
        if pct < 75:
            at_risk.append({
                "student": students.get(r.student_id, "?"),
                "subject": subject_map.get(r.subject_id, "?"),
                "attendance": round(pct, 1),
            })

    at_risk.sort(key=lambda x: x["attendance"])
    return {"at_risk_students": at_risk[:20], "total_flagged": len(at_risk)}


@router.post("/faculty/generate-question-paper")
def generate_question_paper(req: QuestionPaperRequest, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    """AI generates a question paper from syllabus topics with Bloom's taxonomy levels."""
    from backend.app.models import Subject, SyllabusTopic
    subject = db.query(Subject).filter(Subject.code == req.subject_code).first()
    if not subject:
        from fastapi import HTTPException
        raise HTTPException(404, "Subject not found")

    topics = db.query(SyllabusTopic).filter(SyllabusTopic.subject_id == subject.id).all()
    topic_names = [t.name for t in topics]

    # Generate structured question paper
    paper = {
        "subject": f"{subject.code} — {subject.name}",
        "exam_type": req.exam_type,
        "total_marks": req.total_marks,
        "duration": "1.5 hours" if req.exam_type == "CIA" else "3 hours",
        "parts": [
            {
                "name": "Part A — Short Answer",
                "marks_each": 2,
                "count": min(5, len(topic_names)),
                "questions": [f"Define the concept of {t} and state its significance." for t in topic_names[:5]],
            },
            {
                "name": "Part B — Descriptive",
                "marks_each": 10,
                "count": min(3, len(topic_names)),
                "questions": [f"Explain {t} in detail with examples and diagrams where applicable." for t in topic_names[:3]],
            },
            {
                "name": "Part C — Analytical",
                "marks_each": 15,
                "count": 1,
                "questions": [f"Compare and critically analyze the approaches to {topic_names[0] if topic_names else 'the core concept'} with real-world case studies."],
            },
        ],
        "syllabus_coverage": f"{len(topic_names)} topics covered",
        "note": "AI-generated draft — review and modify before use.",
    }

    return paper


# ─── ADMIN AI ────────────────────────────────────────────────────────────────

@router.get("/admin/risk-dashboard")
def admin_risk_dashboard(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """All at-risk students across the institution."""
    return {"at_risk_students": predictive_service.batch_risk_assessment(db)}


@router.post("/admin/chat")
def admin_chat(req: ChatRequest, _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    context = build_admin_context(db)
    return {
        "response": f"[Admin AI] Institutional analysis for: '{req.query}'",
        "ai_provider": "Studvisor-ai-v2",
    }


# ─── VOICE INTERACTION ──────────────────────────────────────────────────────

class VoiceRequest(BaseModel):
    audio_b64: str

@router.post("/voice/interact")
async def voice_interact(req: VoiceRequest, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Accept voice input, transcribe, process via chatbot, and return audio response."""
    from backend.services.voice_service import voice_service
    from backend.app.chatbot import process_chat
    
    transcript = await voice_service.transcribe_audio(req.audio_b64)
    ai_text = await process_chat(db, student, transcript)
    audio_out = await voice_service.generate_speech(ai_text)
    
    return {
        "transcript": transcript,
        "response_text": ai_text,
        "audio_response_b64": audio_out
    }


# ─── CONTENT MODERATION ──────────────────────────────────────────────────────

class ModerationRequest(BaseModel):
    text: str

@router.post("/moderation/check")
def moderation_check(req: ModerationRequest, _=Depends(require_role("admin"))):
    """Admin tool to check sentiment and toxicity of content."""
    from backend.services.sentiment_service import sentiment_service
    return sentiment_service.analyze(req.text)


# ─── ADVANCED PATHING ───────────────────────────────────────────────────────

@router.get("/student/pathway")
def get_student_pathway(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI recommends career paths and recovery steps based on academic performance."""
    from backend.services.predictive_service import predictive_service
    risk = predictive_service.compute_all_risks(db, student.id)
    
    # Analyze marks for "Career Strength"
    from backend.app.models import Mark, Subject
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    
    strengths = []
    for m in marks:
        if m.marks_obtained / m.max_marks >= 0.8:
            subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
            if subj: strengths.append(subj.name)
            
    recommendations = []
    if risk["combined_score"] > 0.4:
        recommendations.append({
            "type": "RECOVERY",
            "title": "Academic Booster Plan",
            "action": "Focus on attendance in subjects below 75%. Join peer mentoring groups.",
            "xp_reward": 200
        })
    
    if "Mathematics" in strengths or "Data Structures" in strengths:
        recommendations.append({
            "type": "CAREER",
            "title": "Data Scientist Track",
            "action": "You show strong analytical skills. Consider elective: Machine Learning.",
            "xp_reward": 500
        })
    elif "Communication" in strengths:
        recommendations.append({
            "type": "CAREER",
            "title": "Management Track",
            "action": "Excellent soft skills detected. Consider joining the Leadership Club.",
            "xp_reward": 300
        })
        
    return {
        "strengths": strengths[:3],
        "risk_level": risk["combined_score"],
        "recommendations": recommendations or [{
            "type": "GENERAL",
            "title": "Keep it up!",
            "action": "Stay consistent with your current study habits.",
            "xp_reward": 50
        }]
    }


@router.post("/student/placement-match")
async def placement_match(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI matches student profile with open placement drives."""
    from backend.app.models import PlacementDrive, Mark, Subject
    from backend.services.ai_service import ai_service
    
    drives = db.query(PlacementDrive).filter(PlacementDrive.status == "Open").all()
    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    
    # Simple heuristic + AI for the best match
    profile_summary = f"Student in {student.department}, CGPA logic, marks in {len(marks)} subjects."
    
    matches = []
    for d in drives:
        # Basic eligibility check
        eligible = student.department in (d.eligible_departments or "")
        
        if eligible:
            ai_critique = await ai_service.chat(
                f"Student Profile: {profile_summary}. Job: {d.company_name} - {d.role_title}. Requirements: CGPA {d.eligibility_cgpa}.",
                "Provide a 1-sentence fit analysis and a match percentage (0-100)."
            )
            matches.append({
                "company": d.company_name,
                "role": d.role_title,
                "package": d.package_lpa,
                "ai_fit_analysis": ai_critique,
                "eligible": True
            })
            
    return {"matches": sorted(matches, key=lambda x: x["package"], reverse=True)}


# ─── STUDENT STUDY SCHEDULE ─────────────────────────────────────────────────

@router.get("/student/study-schedule")
def study_schedule(daily_hours: int = 4, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """AI-generated personalized day-by-day study schedule."""
    from backend.services.study_schedule_service import study_scheduler
    return study_scheduler.generate(db, student.id, daily_hours)


# ─── FACULTY PLAGIARISM DETECTION ────────────────────────────────────────────

@router.get("/faculty/plagiarism-check/{assignment_id}")
def check_plagiarism(assignment_id: int, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    """Run plagiarism detection across all submissions for an assignment."""
    from backend.app.models import AssignmentSubmission, Student
    from backend.services.plagiarism_service import plagiarism_detector

    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()

    # Build text submissions (using file_url as text for demo; production would extract PDF text)
    sub_data = []
    for s in submissions:
        student = db.query(Student).filter(Student.id == s.student_id).first()
        text = s.file_url or f"Submission by student {s.student_id}"
        sub_data.append({"student_id": s.student_id, "student_name": student.full_name if student else "?", "text": text})

    results = plagiarism_detector.batch_compare(sub_data)
    return {"assignment_id": assignment_id, "total_submissions": len(submissions), "suspicious_pairs": results}


# ─── FACULTY ATTENDANCE TRENDS ───────────────────────────────────────────────

@router.get("/faculty/attendance-anomalies")
def attendance_anomalies(faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    """Detect students with sudden attendance drops in faculty's subjects."""
    from backend.app.models import Subject, Student, Attendance

    subject_codes = [s.strip() for s in (faculty.subjects_teaching or "").split(",") if s.strip()]
    if not subject_codes:
        return {"anomalies": []}

    subjects = db.query(Subject).filter(Subject.code.in_(subject_codes)).all()
    subject_ids = [subj.id for subj in subjects]
    subject_map = {subj.id: subj.name for subj in subjects}

    # Fetch all relevant attendance records in one query, ordered by date
    all_records = (
        db.query(Attendance.student_id, Attendance.subject_id, Attendance.date, Attendance.status)
        .filter(Attendance.subject_id.in_(subject_ids))
        .order_by(Attendance.student_id, Attendance.subject_id, Attendance.date)
        .all()
    )

    # Group in Python
    from itertools import groupby
    from operator import attrgetter

    grouped: dict = {}
    for r in all_records:
        key = (r.student_id, r.subject_id)
        grouped.setdefault(key, []).append(r.status)

    # Bulk-fetch student names
    student_ids = list({r.student_id for r in all_records})
    students = {s.id: s.full_name for s in db.query(Student).filter(Student.id.in_(student_ids)).all()}

    anomalies = []
    for (sid, subj_id), statuses in grouped.items():
        if len(statuses) < 10:
            continue
        mid = len(statuses) // 2
        first_pct = sum(1 for s in statuses[:mid] if s == "P") / mid * 100
        second_pct = sum(1 for s in statuses[mid:] if s == "P") / (len(statuses) - mid) * 100
        drop = first_pct - second_pct
        if drop > 20:
            anomalies.append({
                "student": students.get(sid, "?"),
                "subject": subject_map.get(subj_id, "?"),
                "first_half_pct": round(first_pct, 1),
                "second_half_pct": round(second_pct, 1),
                "drop": round(drop, 1),
                "severity": "CRITICAL" if drop > 40 else "HIGH" if drop > 30 else "MODERATE",
            })

    return {"anomalies": sorted(anomalies, key=lambda x: x["drop"], reverse=True)}


# ─── FACULTY EXAM READINESS ─────────────────────────────────────────────────

@router.get("/faculty/exam-readiness/{subject_code}")
def exam_readiness(subject_code: str, faculty=Depends(get_current_faculty), db: Session = Depends(get_db)):
    """Predict class performance on upcoming exam based on CIA scores."""
    from backend.app.models import Subject, Student, Mark
    subject = db.query(Subject).filter(Subject.code == subject_code).first()
    if not subject:
        from fastapi import HTTPException
        raise HTTPException(404, "Subject not found")

    marks = db.query(Mark).filter(Mark.subject_id == subject.id).all()
    student_avg = {}
    for m in marks:
        if m.student_id not in student_avg:
            student_avg[m.student_id] = []
        student_avg[m.student_id].append(m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0)

    # Bulk-fetch all student names in one query instead of one-per-student
    from backend.app.models import Student
    all_sids = list(student_avg.keys())
    student_map = {s.id: s.full_name for s in db.query(Student).filter(Student.id.in_(all_sids)).all()}

    predictions = []
    for sid, pcts in student_avg.items():
        avg = sum(pcts) / len(pcts)
        predictions.append({
            "student": student_map.get(sid, "?"),
            "cia_average": round(avg, 1),
            "predicted_grade": "O" if avg >= 90 else "A+" if avg >= 80 else "A" if avg >= 70 else "B+" if avg >= 60 else "B" if avg >= 50 else "C" if avg >= 40 else "F",
            "at_risk": avg < 40,
        })

    pass_rate = sum(1 for p in predictions if not p["at_risk"]) / len(predictions) * 100 if predictions else 0
    return {
        "subject": f"{subject.code} — {subject.name}",
        "total_students": len(predictions),
        "predicted_pass_rate": round(pass_rate, 1),
        "at_risk_count": sum(1 for p in predictions if p["at_risk"]),
        "predictions": sorted(predictions, key=lambda x: x["cia_average"], reverse=True),
    }


# ─── ADMIN TIMETABLE CONFLICTS ──────────────────────────────────────────────

@router.get("/admin/timetable-conflicts")
def timetable_conflicts(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Detect all scheduling conflicts in current timetable."""
    from backend.services.timetable_service import conflict_resolver
    return conflict_resolver.detect_conflicts(db)


@router.get("/admin/timetable-suggestions")
def timetable_suggestions(subject_id: int, section: str = "A", semester: int = 3,
                          _=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Find conflict-free slot alternatives."""
    from backend.services.timetable_service import conflict_resolver
    return {"suggestions": conflict_resolver.suggest_alternatives(db, subject_id, section, semester)}


# ─── ADMIN DEPARTMENT ANALYTICS ──────────────────────────────────────────────

@router.get("/admin/department-performance")
def department_perf(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Per-department KPIs."""
    from backend.services.advanced_analytics import analytics_engine
    return {"departments": analytics_engine.department_performance(db)}


@router.get("/admin/faculty-effectiveness")
def faculty_effectiveness(_=Depends(require_role("admin")), db: Session = Depends(get_db)):
    """Faculty effectiveness scores."""
    from backend.services.advanced_analytics import analytics_engine
    return {"faculty": analytics_engine.faculty_effectiveness(db)}

