"""GPA/CGPA service + routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict
from backend.core.security import get_current_student
from backend.app.database import get_db
from backend.app.models import Mark, Subject

router = APIRouter(prefix="/gpa", tags=["GPA"])

GRADE_MAP = [
    (90, "O", 10), (80, "A+", 9), (70, "A", 8), (60, "B+", 7),
    (50, "B", 6), (40, "C", 5), (0, "F", 0),
]

def percentage_to_grade(pct):
    for threshold, letter, point in GRADE_MAP:
        if pct >= threshold:
            return {"letter": letter, "point": point}
    return {"letter": "F", "point": 0}

@router.get("/cgpa/")
def get_cgpa(student=Depends(get_current_student), db: Session = Depends(get_db)):
    print(f"[DEBUG] Calculating CGPA for student {student.id} ({student.username})")
    # Only use published marks. Average all assessments per subject-semester
    # so that CIA-1, CIA-2, and Model marks for the same subject are collapsed
    # into a single grade point entry rather than triple-counting credits.
    marks = db.query(Mark).filter(
        Mark.student_id == student.id,
        Mark.published == True,
    ).all()

    # Group raw scores by (semester, subject_id)
    from collections import defaultdict as _dd
    raw: dict = _dd(lambda: {"total_obtained": 0.0, "total_max": 0.0, "subj": None})
    for m in marks:
        key = (m.semester, m.subject_id)
        raw[key]["total_obtained"] += m.marks_obtained
        raw[key]["total_max"] += m.max_marks
        if raw[key]["subj"] is None:
            raw[key]["subj"] = db.query(Subject).filter(Subject.id == m.subject_id).first()

    sem_data = _dd(lambda: {"total_credits": 0, "weighted_points": 0.0, "subjects": []})
    for (sem, sid), d in raw.items():
        subj = d["subj"]
        if not subj or d["total_max"] == 0:
            continue
        pct = d["total_obtained"] / d["total_max"] * 100
        grade = percentage_to_grade(pct)
        sem_data[sem]["total_credits"] += subj.credits
        sem_data[sem]["weighted_points"] += grade["point"] * subj.credits
        sem_data[sem]["subjects"].append({
            "name": subj.name,
            "credits": subj.credits,
            "percentage": round(pct, 1),
            "grade": grade["letter"],
            "points": grade["point"],
        })

    semesters = []
    total_credits = total_weighted = 0
    for sem in sorted(sem_data.keys()):
        d = sem_data[sem]
        sgpa = round(d["weighted_points"] / d["total_credits"], 2) if d["total_credits"] > 0 else 0
        semesters.append({"semester": sem, "sgpa": sgpa, "credits": d["total_credits"], "subjects": d["subjects"]})
        total_credits += d["total_credits"]
        total_weighted += d["weighted_points"]

    cgpa_val = round(total_weighted / total_credits, 2) if total_credits > 0 else 0
    return {"cgpa": cgpa_val, "total_credits": total_credits, "semesters": semesters}

@router.get("/semester/{sem}/")
def semester_gpa(sem: str, student=Depends(get_current_student), db: Session = Depends(get_db)):
    # Aggregate all assessments per subject before computing grade (same logic as /cgpa)
    marks = db.query(Mark).filter(
        Mark.student_id == student.id,
        Mark.semester == sem,
        Mark.published == True,
    ).all()

    from collections import defaultdict as _dd
    raw = _dd(lambda: {"total_obtained": 0.0, "total_max": 0.0, "subj": None})
    for m in marks:
        raw[m.subject_id]["total_obtained"] += m.marks_obtained
        raw[m.subject_id]["total_max"] += m.max_marks
        if raw[m.subject_id]["subj"] is None:
            raw[m.subject_id]["subj"] = db.query(Subject).filter(Subject.id == m.subject_id).first()

    total_credits = weighted = 0
    subjects = []
    for sid, d in raw.items():
        subj = d["subj"]
        if not subj or d["total_max"] == 0:
            continue
        pct = d["total_obtained"] / d["total_max"] * 100
        grade = percentage_to_grade(pct)
        total_credits += subj.credits
        weighted += grade["point"] * subj.credits
        subjects.append({"name": subj.name, "grade": grade["letter"], "points": grade["point"], "credits": subj.credits})

    sgpa = round(weighted / total_credits, 2) if total_credits > 0 else 0
    return {"semester": sem, "sgpa": sgpa, "subjects": subjects}
