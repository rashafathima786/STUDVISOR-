import sqlite3
import os

# Paths to databases
ERP_DB = 'erp_system.db'
STUDVISOR_DB = 'studvisor.db'

def migrate_subjects():
    if not os.path.exists(ERP_DB):
        print(f"Error: {ERP_DB} not found.")
        return
    if not os.path.exists(STUDVISOR_DB):
        print(f"Error: {STUDVISOR_DB} not found.")
        return

    # Connect to databases
    erp_conn = sqlite3.connect(ERP_DB)
    stud_conn = sqlite3.connect(STUDVISOR_DB)
    
    erp_cursor = erp_conn.cursor()
    stud_cursor = stud_conn.cursor()
    
    # 1. Fetch subjects from erp_system.db
    # Schema: (id, code, name, credits, semester)
    erp_cursor.execute("SELECT code, name, credits, semester FROM subjects")
    erp_subjects = erp_cursor.fetchall()
    
    print(f"Found {len(erp_subjects)} subjects in {ERP_DB}.")
    
    # 2. Insert into studvisor.db
    # Schema: (id, code, institution_id, name, credits, semester, department, is_lab)
    # We will use 'default' for institution_id and 'BCA' for department.
    
    success_count = 0
    update_count = 0
    
    for code, name, credits, semester in erp_subjects:
        is_lab = 1 if "Lab" in name or "LAB" in name else 0
        department = "BCA"
        institution_id = "Studvisor_college"
        
        # Check if subject code already exists
        stud_cursor.execute("SELECT id FROM subjects WHERE code = ?", (code,))
        existing = stud_cursor.fetchone()
        
        if existing:
            # Update existing record
            stud_cursor.execute("""
                UPDATE subjects 
                SET name = ?, credits = ?, semester = ?, department = ?, is_lab = ?, institution_id = ?
                WHERE code = ?
            """, (name, credits, semester, department, is_lab, institution_id, code))
            update_count += 1
        else:
            # Insert new record
            stud_cursor.execute("""
                INSERT INTO subjects (code, name, credits, semester, department, is_lab, institution_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (code, name, credits, semester, department, is_lab, institution_id))
            success_count += 1
            
    stud_conn.commit()
    
    erp_conn.close()
    stud_conn.close()
    
    print(f"Migration completed:")
    print(f" - New subjects added: {success_count}")
    print(f" - Existing subjects updated: {update_count}")

if __name__ == "__main__":
    migrate_subjects()
