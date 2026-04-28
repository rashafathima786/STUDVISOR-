"""Route registry — all routers exported for main.py."""
from .auth import router as auth_router
from .student import router as student_router
from .attendance import router as attendance_router
from .marks import router as marks_router
from .leave import router as leave_router
from .gpa import router as gpa_router
from .chat import router as chat_router
from .fees import router as fees_router
from .admin import router as admin_router
from .faculty_portal import router as faculty_portal_router
from .reports import reports_router
from .library import router as library_router
from .ai_engine import router as ai_engine_router

from .misc_routes import calendar_router, documents_router, bunk_alerts_router, anon_chat_router

from .features import (
    complaint_router, notification_router, merit_router, timetable_router,
    analytics_router, assignment_router, exam_router, syllabus_router,
    notes_router, poll_router, event_router, announcement_router,
    faculty_router, lost_found_router, achievement_router, leaderboard_router,
    peer_matching_router,
)
from .extended_routes import (
    placement_router, courses_router, internships_router, campus_router,
    websocket_router, chat_stream_router, export_router, admin_analytics_router,
)
from .search import router as search_router

__all__ = [
    "auth_router", "student_router", "attendance_router", "marks_router",
    "leave_router", "gpa_router", "chat_router", "fees_router",
    "admin_router", "faculty_portal_router", "reports_router", "library_router",
    "ai_engine_router",
    "calendar_router", "documents_router", "bunk_alerts_router", "anon_chat_router",
    "complaint_router", "notification_router", "merit_router", "timetable_router",
    "analytics_router", "assignment_router", "exam_router", "syllabus_router",
    "notes_router", "poll_router", "event_router", "announcement_router",
    "faculty_router", "lost_found_router", "achievement_router", "leaderboard_router",
    "placement_router", "courses_router", "internships_router", "campus_router",
    "websocket_router", "chat_stream_router", "export_router", "admin_analytics_router",
    "search_router", "peer_matching_router",
]
