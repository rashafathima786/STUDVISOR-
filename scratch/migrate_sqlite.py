import sqlite3
import os

db_path = "studvisor.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Migrating chat_history table...")
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(chat_history)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "faculty_id" not in columns:
            cursor.execute("ALTER TABLE chat_history ADD COLUMN faculty_id INTEGER REFERENCES faculty(id)")
            print("Added faculty_id column.")
        
        if "user_role" not in columns:
            cursor.execute("ALTER TABLE chat_history ADD COLUMN user_role TEXT DEFAULT 'student'")
            print("Added user_role column.")
            
        # SQLite doesn't support DROP NOT NULL easily, but we can try to re-create the table if needed.
        # However, for SQLite, often NOT NULL is just enforced if specified.
        # Let's check if student_id is NOT NULL
        # In SQLite, PRAGMA table_info returns 1 if NOT NULL
        
        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
else:
    print("studvisor.db not found.")
