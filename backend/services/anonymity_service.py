"""
v2.0 Anonymity Service — ADR-003 Rotating HMAC for Campus Wall.
Provides irreversible but session-stable anonymity.
"""
import hmac
import hashlib
import os
from datetime import datetime
from pathlib import Path

SALT_DIR = Path(__file__).parent.parent / "data"
SALT_FILE = SALT_DIR / "anon_salt.bin"

def get_daily_salt() -> bytes:
    """Gets or creates a 32-byte salt that rotates every 24 hours."""
    SALT_DIR.mkdir(parents=True, exist_ok=True)
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    if SALT_FILE.exists():
        # Check if it was created today
        mtime = datetime.utcfromtimestamp(SALT_FILE.stat().st_mtime).strftime("%Y-%m-%d")
        if mtime == today:
            with open(SALT_FILE, "rb") as f:
                return f.read()
    
    # Generate new salt
    salt = os.urandom(32)
    with open(SALT_FILE, "wb") as f:
        f.write(salt)
    return salt

def compute_anon_id(student_id: int) -> str:
    """Computes a daily-rotating HMAC of the student ID."""
    salt = get_daily_salt()
    return hmac.new(
        salt, 
        str(student_id).encode(), 
        hashlib.sha256
    ).hexdigest()[:16]
