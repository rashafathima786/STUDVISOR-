from fastapi import APIRouter
from backend.api.routes.student import router as student_router
from backend.api.routes.leave import router as leave_router
from backend.api.routes.features import (
    merit_router, achievement_router, notification_router, leaderboard_router
)
from backend.api.routes.misc_routes import documents_router
from backend.api.routes.library import router as library_router

router = APIRouter(prefix="/user", tags=["User Domain"])

router.include_router(student_router, tags=["Profile"])
router.include_router(leave_router, tags=["Leave"])
router.include_router(merit_router, tags=["Merit"])
router.include_router(achievement_router, tags=["Achievements"])
router.include_router(notification_router, tags=["Notifications"])
router.include_router(leaderboard_router, tags=["Leaderboard"])
router.include_router(documents_router, tags=["Documents"])
router.include_router(library_router, tags=["Library"])
