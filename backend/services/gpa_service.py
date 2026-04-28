"""GPA/CGPA computation service."""
from sqlalchemy.orm import Session
from collections import defaultdict
from backend.app.models import Mark, Subject

GRADE_MAP = [(90,"O",10),(80,"A+",9),(70,"A",8),(60,"B+",7),(50,"B",6),(40,"C",5),(0,"F",0)]

def percentage_to_grade(pct):
    for t, l, p in GRADE_MAP:
        if pct >= t: return {"letter": l, "point": p}
    return {"letter": "F", "point": 0}

class GPAService:
    def get_cgpa(self, db: Session, student_id: int) -> dict:
        marks = db.query(Mark).filter(Mark.student_id == student_id).all()
        sem_data = defaultdict(lambda: {"tc": 0, "wp": 0})
        for m in marks:
            subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
            if not subj: continue
            pct = m.marks_obtained / m.max_marks * 100 if m.max_marks > 0 else 0
            grade = percentage_to_grade(pct)
            sem_data[m.semester]["tc"] += subj.credits
            sem_data[m.semester]["wp"] += grade["point"] * subj.credits
        tc = tw = 0
        semesters = []
        for sem in sorted(sem_data.keys()):
            d = sem_data[sem]
            sgpa = round(d["wp"] / d["tc"], 2) if d["tc"] > 0 else 0
            semesters.append({"semester": sem, "sgpa": sgpa})
            tc += d["tc"]; tw += d["wp"]
        return {"cgpa": round(tw / tc, 2) if tc > 0 else 0, "semesters": semesters}

gpa_service = GPAService()
