from backend.app.database import engine, Base
from backend.app.models import LectureLog

print("Manually creating tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
