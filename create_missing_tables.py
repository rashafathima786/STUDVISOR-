from backend.app.database import engine, Base
from backend.app.models import * # Import all models to register them with Base

def create_tables():
    print("Creating missing tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    create_tables()
