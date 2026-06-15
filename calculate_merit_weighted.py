"""
Script to calculate and update weighted merit points for all active students.
Formula:
  Attendance Percentage (10% weight)
  Internal Assessment Percentage (20% weight)
  Semester Examination Percentage (70% weight)
Scaled to 0-1000 points to align with Studvisor's tier thresholds.
"""
import os
import sys

# Ensure backend modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.database import SessionLocal
from backend.app.models import Student, Attendance, Mark, GPARecord, MeritLog
from backend.services.merit_service import TIER_THRESHOLDS

def calculate_weighted_merit():
    db = SessionLocal()
    try:
        students = db.query(Student).filter(Student.is_active == True).all()
        if not students:
            print("[ERROR] No active students found in the database.")
            return

        print(f"[START] Recalculating weighted merit points (Method 3) for {len(students)} students.")
        
        for student in students:
            old_points = student.merit_points
            old_tier = student.merit_tier
            
            # 1. Attendance Percentage (10% weight)
            att_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
            total_att = len(att_records)
            present_att = sum(1 for r in att_records if r.status == "P")
            attendance_pct = (present_att / total_att * 100) if total_att > 0 else 85.0 # fallback default
            
            # 2. Internal Assessment Percentage (20% weight)
            internal_types = ["Internal", "Assignment", "Lab", "Quiz", "Project", "CIA1", "CIA2", "Model"]
            internal_marks = db.query(Mark).filter(
                Mark.student_id == student.id,
                Mark.assessment_type.in_(internal_types)
            ).all()
            if internal_marks:
                total_int_obtained = sum(m.marks_obtained for m in internal_marks)
                total_int_max = sum(m.max_marks for m in internal_marks)
                internal_pct = (total_int_obtained / total_int_max * 100) if total_int_max > 0 else 80.0
            else:
                internal_pct = 80.0
                
            # 3. Semester Examination Percentage (70% weight)
            univ_marks = db.query(Mark).filter(Mark.student_id == student.id, Mark.assessment_type == "University").all()
            if univ_marks:
                total_univ_obtained = sum(m.marks_obtained for m in univ_marks)
                total_univ_max = sum(m.max_marks for m in univ_marks)
                exam_pct = (total_univ_obtained / total_univ_max * 100) if total_univ_max > 0 else 75.0
            else:
                # Fallback to CGPA from GPARecord
                latest_gpa = db.query(GPARecord).filter(GPARecord.student_id == student.id).order_by(GPARecord.semester.desc()).first()
                if latest_gpa:
                    exam_pct = latest_gpa.cgpa * 10.0
                else:
                    all_marks = db.query(Mark).filter(Mark.student_id == student.id).all()
                    if all_marks:
                        total_obtained = sum(m.marks_obtained for m in all_marks)
                        total_max = sum(m.max_marks for m in all_marks)
                        exam_pct = (total_obtained / total_max * 100) if total_max > 0 else 75.0
                    else:
                        exam_pct = 75.0
            
            # Compute weighted percentage
            weighted_score = (exam_pct * 0.70) + (internal_pct * 0.20) + (attendance_pct * 0.10)
            
            # Scale to 0-1000
            final_points = int(weighted_score * 10)
            
            # Update student record
            student.merit_points = final_points
            for threshold, tier in TIER_THRESHOLDS:
                if student.merit_points >= threshold:
                    student.merit_tier = tier
                    break
            
            # Log the recalculation details
            reason = f"Weighted Recalculation: Exam {exam_pct:.1f}% (70%), Internal {internal_pct:.1f}% (20%), Attendance {attendance_pct:.1f}% (10%)"
            log = MeritLog(
                student_id=student.id,
                points=final_points,
                reason=reason,
                institution_id=student.institution_id
            )
            db.add(log)
            print(f"  - {student.full_name} ({student.username}): {old_points} [{old_tier}] -> {student.merit_points} [{student.merit_tier}]")
            
        db.commit()
        print("\n[SUCCESS] Successfully recalculated and updated all student merit scores.")
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] An error occurred, rolled back changes: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    calculate_weighted_merit()
