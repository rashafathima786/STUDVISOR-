import sqlite3
import os

# Root DB path
db_path = "studvisor.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"[MIGRATE] Updating {db_path}...")
    try:
        cursor.execute("ALTER TABLE anon_posts ADD COLUMN toxicity_score FLOAT DEFAULT 0.0")
        print("  [OK] Added toxicity_score")
    except sqlite3.OperationalError:
        print("  [SKIP] toxicity_score already exists")
        
    try:
        cursor.execute("ALTER TABLE anon_posts ADD COLUMN censored_content TEXT")
        print("  [OK] Added censored_content")
    except sqlite3.OperationalError:
        print("  [SKIP] censored_content already exists")
        
    conn.commit()
    conn.close()
    print("[DONE] Migration complete.")
else:
    print(f"[ERROR] Database not found at {os.path.abspath(db_path)}")
