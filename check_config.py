from backend.core.config import get_settings
settings = get_settings()
print(f"DATABASE_URL: {settings.DATABASE_URL}")
