import sqlite3
from datetime import datetime, timedelta

DB_PATH = 'studvisor.db'
SUBJECT_IDS = [56, 55]  # Software Testing and Project Work
INSTITUTION_ID = 'Studvisor_college'

def inject_more_low_attendance():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM students")
    student_ids = [row[0] for row in cursor.fetchall()]
    
    print(f"Injecting low attendance for {len(student_ids)} students in Subjects {SUBJECT_IDS}...")
    
    base_date = datetime.now()
    records_added = 0
    for student_id in student_ids:
        for subj_id in SUBJECT_IDS:
            # 1 Present, 4 Absent
            date_p = (base_date - timedelta(days=6)).strftime("%Y-%m-%d")
            cursor.execute("INSERT INTO attendance (student_id, subject_id, date, hour, status, institution_id) VALUES (?, ?, ?, ?, ?, ?)", 
                           (student_id, subj_id, date_p, 1, 'P', INSTITUTION_ID))
            for i in range(1, 5):
                date_a = (base_date - timedelta(days=i)).strftime("%Y-%m-%d")
                cursor.execute("INSERT INTO attendance (student_id, subject_id, date, hour, status, institution_id) VALUES (?, ?, ?, ?, ?, ?)", 
                               (student_id, subj_id, date_a, 1, 'A', INSTITUTION_ID))
            records_added += 5
        
    conn.commit()
    conn.close()
    print(f"Successfully added {records_added} attendance records.")

if __name__ == "__main__":
    inject_more_low_attendance()
