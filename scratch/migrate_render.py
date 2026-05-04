import sqlalchemy
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

print(f"Connecting to {DATABASE_URL.split('@')[-1]}...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Migrating chat_history table...")
    try:
        # Check if faculty_id exists
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='chat_history' AND column_name='faculty_id'"))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE chat_history ADD COLUMN faculty_id INTEGER REFERENCES faculty(id)"))
            print("Added faculty_id column.")
        
        # Check if user_role exists
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='chat_history' AND column_name='user_role'"))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE chat_history ADD COLUMN user_role TEXT DEFAULT 'student'"))
            print("Added user_role column.")
            
        # Drop NOT NULL on student_id
        conn.execute(text("ALTER TABLE chat_history ALTER COLUMN student_id DROP NOT NULL"))
        print("Dropped NOT NULL on student_id.")
        
        # Update indexes
        conn.execute(text("DROP INDEX IF EXISTS ix_chat_student_session"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_user_session ON chat_history (student_id, faculty_id, session_id)"))
        
        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Error: {e}")
