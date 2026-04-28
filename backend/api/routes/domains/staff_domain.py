from fastapi import APIRouter
from backend.api.routes.admin import router as admin_router
from backend.api.routes.faculty_portal import router as faculty_portal_router
from backend.api.routes.reports import reports_router
from backend.api.routes.extended_routes import (
    placement_router, export_router, admin_analytics_router
)
from backend.api.routes.fees import router as fees_router

router = APIRouter(prefix="/staff", tags=["Staff Domain"])

router.include_router(admin_router, tags=["Admin Control"])
router.include_router(faculty_portal_router, tags=["Faculty Portal"])
router.include_router(reports_router, tags=["Reports"])
router.include_router(placement_router, tags=["Placement"])
router.include_router(export_router, tags=["Exports"])
router.include_router(admin_analytics_router, tags=["Admin Analytics"])
router.include_router(fees_router, tags=["Fee Management"])
