import sqlite3
from datetime import datetime, timedelta

DB_PATH = 'studvisor.db'
INSTITUTION_ID = 'Studvisor_college'

def inject_smart_low_attendance():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Clear previous messy injection for subjects 55, 56, 57 (Optional but cleaner)
    # cursor.execute("DELETE FROM attendance WHERE subject_id IN (55, 56, 57)")
    
    # 2. Get all students and their semesters
    cursor.execute("SELECT id, semester FROM students")
    students = cursor.fetchall()
    
    print(f"Injecting semester-appropriate low attendance for {len(students)} students...")
    
    base_date = datetime.now()
    records_added = 0
    
    for student_id, semester in students:
        # Find 3 subjects for this semester
        cursor.execute("SELECT id, name FROM subjects WHERE semester = ? LIMIT 3", (semester,))
        subjects = cursor.fetchall()
        
        if not subjects:
            continue
            
        for subj_id, sname in subjects:
            # 1 Present, 4 Absent for each of the 3 subjects
            # Present record
            date_p = (base_date - timedelta(days=6)).strftime("%Y-%m-%d")
            cursor.execute("""
                INSERT INTO attendance (student_id, subject_id, date, hour, status, institution_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (student_id, subj_id, date_p, 1, 'P', INSTITUTION_ID))
            
            # Absent records
            for i in range(1, 5):
                date_a = (base_date - timedelta(days=i)).strftime("%Y-%m-%d")
                cursor.execute("""
                    INSERT INTO attendance (student_id, subject_id, date, hour, status, institution_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (student_id, subj_id, date_a, 1, 'A', INSTITUTION_ID))
            
            records_added += 5
            
    conn.commit()
    conn.close()
    print(f"Successfully added {records_added} attendance records.")

if __name__ == "__main__":
    inject_smart_low_attendance()
