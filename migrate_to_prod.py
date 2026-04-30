"""
Studvisor Production Migration Script
This script initializes the PostgreSQL database schema for production.
Usage: DATABASE_URL=your_render_url python migrate_to_prod.py
"""
import os
import sys
from sqlalchemy import create_engine
from backend.app.database import Base
# Import all models to ensure they are registered with Base
from backend.app.models import *

def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        sys.exit(1)
    
    # Handle SQLAlchemy 2.0+ requirement for postgresql+psycopg
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)

    print(f"Connecting to database...")
    try:
        engine = create_engine(database_url)
        print("Creating all tables defined in models.py...")
        Base.metadata.create_all(bind=engine)
        print("SUCCESS: Database schema applied successfully.")
    except Exception as e:
        print(f"FAILED: An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
