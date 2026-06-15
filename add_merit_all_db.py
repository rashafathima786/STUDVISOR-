"""
Script to add merit points directly in the database for all active students.
Usage: python add_merit_all_db.py [points] [reason]
Example: python add_merit_all_db.py 100 "Semester Welcome Bonus"
"""
import os
import sys

# Ensure backend modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.database import SessionLocal
from backend.app.models import Student, MeritLog
from backend.services.merit_service import TIER_THRESHOLDS

def add_merit_to_all_db(points: int, reason: str):
    db = SessionLocal()
    try:
        students = db.query(Student).filter(Student.is_active == True).all()
        if not students:
            print("[ERROR] No active students found in the database.")
            return

        print(f"[START] Awarding {points} merit points to {len(students)} active students.")
        print(f"Reason: {reason}\n")
        
        for student in students:
            old_points = student.merit_points
            student.merit_points += points
            
            # Recalculate tier
            for threshold, tier in TIER_THRESHOLDS:
                if student.merit_points >= threshold:
                    student.merit_tier = tier
                    break
            
            # Log the merit award
            log = MeritLog(
                student_id=student.id,
                points=points,
                reason=reason,
                institution_id=student.institution_id
            )
            db.add(log)
            print(f"  - {student.full_name} ({student.username}): {old_points} -> {student.merit_points} [{student.merit_tier}]")
            
        db.commit()
        print("\n[SUCCESS] Successfully updated all student records and committed changes.")
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] An error occurred, rolled back changes: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    points = 100
    reason = "Universal Academic Merit Boost"
    
    if len(sys.argv) > 1:
        try:
            points = int(sys.argv[1])
        except ValueError:
            print(f"[WARNING] Invalid points argument '{sys.argv[1]}'. Defaulting to 100.")
            
    if len(sys.argv) > 2:
        reason = sys.argv[2]
        
    add_merit_to_all_db(points, reason)
