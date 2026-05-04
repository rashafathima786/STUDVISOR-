"""
Studvisor v3.0 — Main Application Factory
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

# ── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Database Initialization ─────────────────────────────────────────────
    from backend.app.database import Base, engine
    from backend.app import models
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Studvisor — Unified Campus Intelligence Platform",
    description="AI-powered Student ERP with multi-role auth, predictive analytics, gamification, and 80+ endpoints",
    version="3.0.0",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware ────────────────────────────────────────────────────────────────
from backend.app.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from backend.middleware.role_guard import RoleGuardMiddleware
from backend.middleware.audit_log import AuditLogMiddleware

app.add_middleware(AuditLogMiddleware)
app.add_middleware(RoleGuardMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

cors_origins = os.getenv("CORS_ORIGINS", "https://studvisor.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
from backend.api.routes.domains.core_domain import router as core_domain
from backend.api.routes.domains.academic_domain import router as academic_domain
from backend.api.routes.domains.user_domain import router as user_domain
from backend.api.routes.domains.campus_domain import router as campus_domain
from backend.api.routes.domains.staff_domain import router as staff_domain

# Root level domain registration (all prefixed by /api via include_router if desired, 
# but here we keep them as defined in domain files)
DOMAINS = [
    core_domain,
    academic_domain,
    user_domain,
    campus_domain,
    staff_domain,
]

for domain in DOMAINS:
    app.include_router(domain)

# ── Exception Handlers ───────────────────────────────────────────────────────
@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail, "data": None, "error": exc.detail})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback; traceback.print_exc()
    return JSONResponse(status_code=500, content={"success": False, "message": "Internal server error", "data": None, "error": str(exc)})

# ── Root & Health ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"success": True, "message": "Studvisor v3.0 — Unified Campus Intelligence Platform", "version": "3.0.0"}

@app.get("/health/")
def health():
    return {"success": True, "status": "ok", "version": "3.0.0"}

