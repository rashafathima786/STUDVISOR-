"""Test configuration — seed test DB before running tests."""
import os
import pytest

# Force SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///./test_studvisor.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-ci"

from backend.app.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Create all tables before tests, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose() # Release connections for Windows
    if os.path.exists("test_studvisor.db"):
        try:
            os.remove("test_studvisor.db")
        except PermissionError:
            pass # Ignore if still locked, OS will clean it up or next run will overwrite
