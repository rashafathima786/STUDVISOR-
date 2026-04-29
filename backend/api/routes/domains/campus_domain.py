from fastapi import APIRouter
from backend.api.routes.features import (
    poll_router, event_router, announcement_router, lost_found_router, 
    complaint_router, peer_matching_router, faculty_router,
    placement_student_router, fees_student_router,
    library_student_router, leave_student_router, helpdesk_router
)
from backend.api.routes.chat import router as chat_router
from backend.api.routes.misc_routes import anon_chat_router, calendar_router
from backend.api.routes.extended_routes import campus_router, internships_router

router = APIRouter(prefix="/campus", tags=["Campus Domain"])

router.include_router(chat_router, tags=["Chat"])
router.include_router(anon_chat_router, tags=["Anonymous Chat"])
router.include_router(calendar_router, tags=["Calendar"])
router.include_router(poll_router, tags=["Polls"])
router.include_router(event_router, tags=["Events"])
router.include_router(announcement_router, tags=["Announcements"])
router.include_router(lost_found_router, tags=["Lost & Found"])
router.include_router(complaint_router, tags=["Complaints"])
router.include_router(peer_matching_router, tags=["Peer Matching"])
router.include_router(faculty_router, tags=["Faculty Directory"])
router.include_router(campus_router, tags=["Campus Info"])
router.include_router(internships_router, tags=["Internships"])
# Student service routes (exposed under /campus/...)
router.include_router(placement_student_router, tags=["Placement"])
router.include_router(fees_student_router, tags=["Fees"])
router.include_router(library_student_router, tags=["Library"])
router.include_router(leave_student_router, tags=["Leave"])
router.include_router(helpdesk_router, tags=["Helpdesk"])
