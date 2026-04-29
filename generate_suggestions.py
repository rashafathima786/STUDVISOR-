import sys
import os
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.services.predictive_service import predictive_service
from backend.app.models import Student, Subject, Attendance

def generate_suggestions():
    db = SessionLocal()
    try:
        print("--- AI SUGGESTIONS FOR AT-RISK STUDENTS ---")
        print("Analyzing attendance and academic performance...\n")
        
        # Get at-risk students
        at_risk = predictive_service.batch_risk_assessment(db)
        
        if not at_risk:
            print("No students found with significant risk. (Check if records were added correctly)")
            return

        # Show top 5 for brevity
        for risk in at_risk[:5]:
            student_id = risk["student_id"]
            name = risk["student_name"]
            score = risk["combined_score"]
            level = risk["dropout_risk"]["risk_level"]
            signals = risk["dropout_risk"]["signals"] + risk["academic_risk"]["signals"]
            intervention = risk["recommended_intervention"]
            
            print(f"Student: {name} (ID: {student_id})")
            print(f"Risk Score: {score} | Level: {level}")
            print(f"Signals Identified:")
            for s in signals:
                print(f"  - {s}")
            print(f"AI Suggestion: {intervention}")
            print("-" * 50)
            
    finally:
        db.close()

if __name__ == "__main__":
    sys.path.append(os.getcwd())
    generate_suggestions()
