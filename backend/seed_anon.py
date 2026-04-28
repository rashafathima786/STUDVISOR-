import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal
from backend.app.models import AnonPost
import datetime

db = SessionLocal()

posts = [
    {"content": "Welcome to Nexus General! Let's build the future together.", "category": "General"},
    {"content": "Just had the best coffee at the campus cafe! ☕", "category": "General"},
    {"content": "Can anyone help me with Data Structures unit 3?", "category": "Questions"},
    {"content": "The new library renovation looks amazing. Much better lighting!", "category": "General"},
    {"content": "Hackathon registrations are closing tonight. Don't miss out!", "category": "Clubs"},
    {"content": "I accidentally wore two different shoes to class today... nobody noticed (I hope) 👟", "category": "Confessions"},
]

print("[SEED] Seeding anonymous posts...")
for p in posts:
    db.add(AnonPost(
        content=p["content"],
        category=p["category"],
        session_hash="SEED_POST_" + p["content"][:10],
        moderated=False,
        toxicity_score=0.1,
        censored_content=p["content"] # Just for demo
    ))

db.commit()
db.close()
print("[OK] Anonymous posts seeded.")
