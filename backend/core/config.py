"""
Studvisor v2.0 — Centralized configuration using pydantic-settings.
Single source of truth for all environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "Studvisor"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./studvisor.db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # ── Auth ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-this-in-production-immediately"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Rate Limiting ────────────────────────────────────────────────────
    RATE_LIMIT_DEFAULT: str = "200/minute"
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_CHAT: str = "30/minute"
    RATE_LIMIT_PAYMENT: str = "5/minute"

    # ── AI ───────────────────────────────────────────────────────────────
    AI_PROVIDER: str = "ollama"  # ollama | anthropic | openai
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    AI_MODEL: str = "llama3"
    AI_MAX_TOKENS: int = 2048
    AI_TEMPERATURE: float = 0.3

    # ── File Storage ─────────────────────────────────────────────────────
    S3_BUCKET_NAME: Optional[str] = None
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None
    MAX_UPLOAD_SIZE_MB: int = 50

    # ── Email ────────────────────────────────────────────────────────────
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # ── Redis ────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_ATTENDANCE: int = 300  # 5 min
    CACHE_TTL_DASHBOARD: int = 600  # 10 min

    # ── Deployment ───────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ALLOWED_HOSTS: str = "*"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

