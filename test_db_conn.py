import os
from sqlalchemy import create_engine
DATABASE_URL = "postgresql://studvisor:OaoR3bj9PacOdH59oZmSMXKIzLfFPqcq@dpg-d7pc6me7r5hc73du6q7g-a.oregon-postgres.render.com/studvisor"
# Handle SQLAlchemy 2.0+ requirement
DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Successfully connected to Render DB!")
except Exception as e:
    print(f"Connection failed: {e}")
