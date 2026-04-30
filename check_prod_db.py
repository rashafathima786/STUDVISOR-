import os
import sqlalchemy
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Use the URL from your environment
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("Error: No DATABASE_URL found in your .env file!")
    exit()

# Clean and fix for SQLAlchemy/psycopg compatibility
db_url = db_url.strip()
if db_url.startswith("postgresql://") and "psycopg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgres://") and "psycopg" not in db_url:
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)

print(f"Connecting to: {db_url.split('@')[-1]}") 

try:
    engine = create_engine(db_url, connect_args={"connect_timeout": 5})
    with engine.connect() as conn:
        # Check connection
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()
        print("Connection Successful!")
        print(f"PostgreSQL Version: {version[0]}")
        
        # Check tables
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
        tables = result.fetchall()
        
        if tables:
            print(f"Found {len(tables)} tables:")
            for table in tables:
                # Get record count for each table
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM {table[0]}"))
                count = count_res.fetchone()[0]
                print(f"   - {table[0]}: {count} records")
        else:
            print("No tables found in the database.")

except Exception as e:
    print("Connection Failed!")
    print(f"Error: {e}")
