import sys
import os
import io
import asyncio

# Fix encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app.models import Student
from backend.app.chatbot import process_chat

async def simulate_chatbot_suggestion():
    db = SessionLocal()
    try:
        # Pick student Aadil (ID: 32) who is now at high risk
        student = db.query(Student).filter(Student.id == 32).first()
        if not student:
            print("Student not found.")
            return

        print(f"--- SIMULATING CHATBOT FOR {student.full_name.upper()} ---")
        
        # Scenario 1: Student asks about performance
        message = "How is my academic performance looking?"
        print(f"Student: {message}")
        
        response = await process_chat(db, student, message)
        print(f"Nexus AI: {response}")
        
        print("\n" + "="*50 + "\n")
        
        # Scenario 2: Student asks about subjects
        message = "Which subjects should I focus on?"
        print(f"Student: {message}")
        response = await process_chat(db, student, message)
        print(f"Nexus AI: {response}")

    finally:
        db.close()

if __name__ == "__main__":
    sys.path.append(os.getcwd())
    asyncio.run(simulate_chatbot_suggestion())
