"""
Seed historical and ongoing academic data for students updated to the 6th semester.
Run: python -m backend.seed_semesters
"""
import sys
import os
import random
from datetime import datetime, timedelta

# Adjust python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal, engine
from backend.app.models import Student, Subject, Mark, Attendance, GPARecord

GRADE_MAP = [
    (90, "O", 10), (80, "A+", 9), (70, "A", 8), (60, "B+", 7),
    (50, "B", 6), (40, "C", 5), (0, "F", 0),
]

def percentage_to_grade(pct):
    for threshold, letter, point in GRADE_MAP:
        if pct >= threshold:
            return {"letter": letter, "point": point}
    return {"letter": "F", "point": 0}

def get_subjects_for_student(db, student, semester):
    # Try exact match by department and semester
    subjects = db.query(Subject).filter(
        Subject.semester == semester,
        Subject.department == student.department
    ).all()
    
    if not subjects:
        # Fallback to CSE subjects for that semester (CSE has subjects for all semesters)
        subjects = db.query(Subject).filter(
            Subject.semester == semester,
            Subject.department == "CSE"
        ).all()
        
    if not subjects:
        # Final fallback to any subjects for that semester
        subjects = db.query(Subject).filter(
            Subject.semester == semester
        ).all()
        
    return subjects

def seed_data():
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        print(f"[SEED] Found {len(students)} students to update and seed.")
        
        # 1. Update all students to 6th semester
        for student in students:
            student.semester = 6
        db.commit()
        print("[SEED] Updated all students to semester 6.")
        
        total_marks_added = 0
        total_attendance_added = 0
        total_gpa_added = 0
        
        # Let's seed for each student
        for student_idx, student in enumerate(students):
            inst = student.institution_id or "Studvisor_college"
            
            # Clear old records first to avoid duplicates or inconsistent states
            db.query(Mark).filter(Mark.student_id == student.id).delete()
            db.query(Attendance).filter(Attendance.student_id == student.id).delete()
            db.query(GPARecord).filter(GPARecord.student_id == student.id).delete()
            db.commit()
            
            cumulative_credits = 0
            cumulative_weighted_points = 0.0
            
            # Seed semesters 1 to 5 (historical)
            for sem in range(1, 6):
                subjects = get_subjects_for_student(db, student, sem)
                if not subjects:
                    print(f"  [WARN] No subjects found for student {student.username} in semester {sem}")
                    continue
                
                sem_credits = 0
                sem_weighted_points = 0.0
                
                for subj in subjects:
                    credits = subj.credits if (subj.credits and subj.credits > 0) else 3
                    
                    # Seed marks for this subject in this semester
                    # We will seed Internal, Assignment, and Lab marks
                    obtained_internal = round(random.uniform(60, 95), 1)
                    obtained_assignment = round(random.uniform(30, 48), 1)
                    obtained_lab = round(random.uniform(30, 48), 1)
                    
                    m_int = Mark(
                        institution_id=inst,
                        student_id=student.id,
                        subject_id=subj.id,
                        marks_obtained=obtained_internal,
                        max_marks=100.0,
                        assessment_type="Internal",
                        semester=str(sem),
                        published=True
                    )
                    m_asn = Mark(
                        institution_id=inst,
                        student_id=student.id,
                        subject_id=subj.id,
                        marks_obtained=obtained_assignment,
                        max_marks=50.0,
                        assessment_type="Assignment",
                        semester=str(sem),
                        published=True
                    )
                    m_lab = Mark(
                        institution_id=inst,
                        student_id=student.id,
                        subject_id=subj.id,
                        marks_obtained=obtained_lab,
                        max_marks=50.0,
                        assessment_type="Lab",
                        semester=str(sem),
                        published=True
                    )
                    db.add_all([m_int, m_asn, m_lab])
                    total_marks_added += 3
                    
                    # Calculate percentage for GPA
                    total_obtained = obtained_internal + obtained_assignment + obtained_lab
                    total_max = 200.0
                    pct = (total_obtained / total_max) * 100
                    grade = percentage_to_grade(pct)
                    
                    sem_credits += credits
                    sem_weighted_points += grade["point"] * credits
                    
                    # Seed Attendance: 20 slots spaced in time for this semester
                    # Spacing: sem 1 (900 days ago), sem 2 (720 days ago), sem 3 (540 days ago), etc.
                    base_days_ago = 900 - (sem - 1) * 180
                    for day in range(1, 21):
                        date_str = (datetime.now() - timedelta(days=base_days_ago + day)).strftime("%Y-%m-%d")
                        status = random.choices(["P", "A", "DL"], weights=[88, 10, 2])[0]
                        is_od = (status == "DL")
                        
                        att = Attendance(
                            institution_id=inst,
                            student_id=student.id,
                            subject_id=subj.id,
                            date=date_str,
                            hour=random.choice([1, 2, 3, 4]),
                            status=status,
                            is_od=is_od
                        )
                        db.add(att)
                        total_attendance_added += 1
                
                # Calculate SGPA and cumulative CGPA
                sgpa = round(sem_weighted_points / sem_credits, 2) if sem_credits > 0 else 0.0
                cumulative_credits += sem_credits
                cumulative_weighted_points += sem_weighted_points
                cgpa = round(cumulative_weighted_points / cumulative_credits, 2) if cumulative_credits > 0 else 0.0
                
                gpa_rec = GPARecord(
                    institution_id=inst,
                    student_id=student.id,
                    semester=sem,
                    gpa=sgpa,
                    cgpa=cgpa
                )
                db.add(gpa_rec)
                total_gpa_added += 1
            
            # Seed semester 6 (ongoing semester)
            # Student is currently in semester 6, so they have ongoing attendance and ongoing marks
            sem6_subjects = get_subjects_for_student(db, student, 6)
            for subj in sem6_subjects:
                # Seed only Internal 1 / partial marks for ongoing semester
                obtained_internal = round(random.uniform(55, 95), 1)
                m_int = Mark(
                    institution_id=inst,
                    student_id=student.id,
                    subject_id=subj.id,
                    marks_obtained=obtained_internal,
                    max_marks=100.0,
                    assessment_type="Internal",
                    semester="6",
                    published=True
                )
                db.add(m_int)
                total_marks_added += 1
                
                # Seed attendance for current semester (last 30 days)
                for day in range(1, 15):
                    date_str = (datetime.now() - timedelta(days=day)).strftime("%Y-%m-%d")
                    status = random.choices(["P", "A", "DL"], weights=[85, 12, 3])[0]
                    is_od = (status == "DL")
                    
                    att = Attendance(
                        institution_id=inst,
                        student_id=student.id,
                        subject_id=subj.id,
                        date=date_str,
                        hour=random.choice([1, 2, 3]),
                        status=status,
                        is_od=is_od
                    )
                    db.add(att)
                    total_attendance_added += 1
            
            db.commit()
            if (student_idx + 1) % 5 == 0 or (student_idx + 1) == len(students):
                print(f"  [OK] Processed {student_idx + 1}/{len(students)} students...")
                
        print(f"\n[SUCCESS] Seeding complete!")
        print(f"  - Total Marks records added: {total_marks_added}")
        print(f"  - Total Attendance records added: {total_attendance_added}")
        print(f"  - Total GPA records added: {total_gpa_added}")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
