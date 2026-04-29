
import sys
import os
sys.path.append(os.getcwd())

from backend.app.database import SessionLocal
from backend.app.models import Assignment, Subject
from datetime import datetime, timedelta

def seed():
    db = SessionLocal()
    try:
        # Get some subjects
        subjects = db.query(Subject).all()
        if not subjects:
            print("No subjects found. Please seed subjects first.")
            return

        # Check if assignments already exist
        if db.query(Assignment).count() > 0:
            print("Assignments already seeded.")
            return

        assignments = [
            Assignment(
                title="OS Lab Report",
                description="Complete the memory management lab report including paging and segmentation analysis.",
                due_date=(datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M"),
                max_marks=100,
                subject_id=subjects[0].id if len(subjects) > 0 else None
            ),
            Assignment(
                title="DB Systems Quiz 3",
                description="Quiz covering Normalization (1NF, 2NF, 3NF, BCNF) and SQL Joins.",
                due_date=(datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
                max_marks=50,
                subject_id=subjects[1].id if len(subjects) > 1 else None
            ),
            Assignment(
                title="Computer Networks Project",
                description="Develop a simple TCP/IP chat application with multiple client support.",
                due_date=(datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d %H:%M"),
                max_marks=200,
                subject_id=subjects[2].id if len(subjects) > 2 else None
            ),
            Assignment(
                title="Data Structures Assignment 4",
                description="Implementation of AVL Trees and Heap Sort in C++.",
                due_date=(datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d %H:%M"),
                max_marks=100,
                subject_id=subjects[3].id if len(subjects) > 3 else None
            )
        ]

        db.add_all(assignments)
        db.commit()
        print("Successfully seeded 4 assignments.")
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
