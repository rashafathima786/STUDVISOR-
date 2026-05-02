import os
import sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal
from backend.app.models import Admin, Faculty, Student

def export_credentials():
    db = SessionLocal()
    
    data = []
    
    # Get Admins
    admins = db.query(Admin).all()
    for admin in admins:
        data.append({
            "Role": "Admin",
            "Name": admin.full_name,
            "Username": admin.username,
            "Email": admin.email,
            "Default Password": os.getenv("SEED_ADMIN_PASSWORD", "admin123")
        })
        
    # Get Faculty
    faculties = db.query(Faculty).all()
    for faculty in faculties:
        data.append({
            "Role": "Faculty",
            "Name": faculty.name,
            "Username": faculty.username,
            "Email": faculty.email,
            "Default Password": os.getenv("SEED_FACULTY_PASSWORD", "faculty123")
        })
        
    # Get Students
    students = db.query(Student).all()
    for student in students:
        data.append({
            "Role": "Student",
            "Name": student.full_name,
            "Username": student.username,
            "Email": student.email,
            "Default Password": os.getenv("SEED_STUDENT_PASSWORD", "student123")
        })
        
    db.close()
    
    df = pd.DataFrame(data)
    
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "credentials.xlsx")
    df.to_excel(output_path, index=False)
    print(f"Credentials successfully exported to: {output_path}")

if __name__ == "__main__":
    export_credentials()
