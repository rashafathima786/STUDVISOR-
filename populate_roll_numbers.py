"""
Script to populate missing roll numbers for students in the database.
Uses the pattern: 21<DEPT_CODE><100 + ID>
"""
import os
import sys

# Ensure backend modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.database import SessionLocal
from backend.app.models import Student

def get_dept_code(dept_name):
    if not dept_name:
        return "GEN"
    
    name_clean = dept_name.strip().upper()
    if "COMPUTER SCIENCE" in name_clean or name_clean == "CSE":
        return "CSE"
    if "ELECTRONICS" in name_clean or name_clean == "ECE":
        return "ECE"
    if "MECHANICAL" in name_clean or name_clean == "MECH":
        return "MECH"
    if "CIVIL" in name_clean:
        return "CIVIL"
    if "ELECTRICAL" in name_clean or name_clean == "EEE":
        return "EEE"
    if name_clean == "BCA":
        return "BCA"
        
    # Fallback to first 3 letters
    clean_alphanum = "".join([c for c in name_clean if c.isalnum()])
    return clean_alphanum[:3]

def populate_roll_numbers():
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        updated_count = 0
        
        print("[START] Checking and populating missing roll numbers.")
        
        for student in students:
            if not student.roll_number:
                dept_code = get_dept_code(student.department)
                generated_roll = f"21{dept_code}{100 + student.id}"
                
                # Check for uniqueness, just in case
                duplicate = db.query(Student).filter(Student.roll_number == generated_roll, Student.id != student.id).first()
                if duplicate:
                    generated_roll = f"21{dept_code}{200 + student.id}"
                
                student.roll_number = generated_roll
                updated_count += 1
                print(f"  - Assigned roll number to student '{student.full_name}' (ID: {student.id}, Dept: {student.department}): {student.roll_number}")
                
        if updated_count > 0:
            db.commit()
            print(f"\n[SUCCESS] Successfully assigned and committed roll numbers for {updated_count} students.")
        else:
            print("\n[INFO] No students were missing roll numbers.")
            
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] An error occurred, changes rolled back: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_roll_numbers()
