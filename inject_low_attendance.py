import sqlite3
from datetime import datetime, timedelta
import random

DB_PATH = 'studvisor.db'
SUBJECT_ID = 57  # Machine Learning (6BCA-ML)
INSTITUTION_ID = 'Studvisor_college'

def inject_low_attendance():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Get all student IDs
    cursor.execute("SELECT id FROM students")
    student_ids = [row[0] for row in cursor.fetchall()]
    
    print(f"Injecting low attendance for {len(student_ids)} students in Subject ID {SUBJECT_ID}...")
    
    # 2. For each student, insert 1 'P' and 4 'A' records
    # We'll use dates from the last 7 days
    base_date = datetime.now()
    
    records_added = 0
    for student_id in student_ids:
        # 1 Present record
        date_p = (base_date - timedelta(days=6)).strftime("%Y-%m-%d")
        cursor.execute("""
            INSERT INTO attendance (student_id, subject_id, date, hour, status, institution_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (student_id, SUBJECT_ID, date_p, 1, 'P', INSTITUTION_ID))
        
        # 4 Absent records
        for i in range(1, 5):
            date_a = (base_date - timedelta(days=i)).strftime("%Y-%m-%d")
            cursor.execute("""
                INSERT INTO attendance (student_id, subject_id, date, hour, status, institution_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (student_id, SUBJECT_ID, date_a, 1, 'A', INSTITUTION_ID))
        
        records_added += 5
        
    conn.commit()
    conn.close()
    print(f"Successfully added {records_added} attendance records.")

if __name__ == "__main__":
    inject_low_attendance()
