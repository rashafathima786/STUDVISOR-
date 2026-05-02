import sys
import os
import io
import asyncio

# Fix encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app.models import Student
from backend.app.chatbot import process_chat, normalize_text

async def verify_fix():
    db = SessionLocal()
    try:
        # Use student with ID 32 (Aadil) or any student with some attendance data
        student = db.query(Student).first()
        if not student:
            print("No students found in database.")
            return

        print(f"--- VERIFYING CHATBOT RECOGNITION FIX FOR {student.full_name.upper()} ---")
        
        # Test 1: Normalization check
        test_inputs = [
            "hw mnay more classes shud i attend",
            "wht clses shud i attnd to be eligibl",
            "helloooo bot help meeee"
        ]
        
        print("\n[STEP 1] Testing Normalization Layer:")
        for inp in test_inputs:
            norm = normalize_text(inp)
            print(f"  Input: {inp}")
            print(f"  Norm : {norm}")
        
        # Test 2: Intent Recognition (Recovery Plan)
        print("\n[STEP 2] Testing Intent Recognition:")
        message = "how mnay more classes shud i attend to to be eligible"
        print(f"Student: {message}")
        
        response = await process_chat(db, student, message)
        print(f"Chatbot Protocol: {response.get('protocol')}")
        print(f"Chatbot Reply:\n{response.get('reply')}")
        
        if "Requires" in str(response.get('reply')) or "Safe" in str(response.get('reply')):
            print("\n✅ SUCCESS: Recovery calculation recognized even with typos!")
        else:
            print("\n❌ FAILURE: Recovery calculation NOT recognized.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure backend is in path
    sys.path.append(os.getcwd())
    asyncio.run(verify_fix())
