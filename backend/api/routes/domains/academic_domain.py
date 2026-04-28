from fastapi import APIRouter
from backend.api.routes.attendance import router as attendance_router
from backend.api.routes.marks import router as marks_router
from backend.api.routes.gpa import router as gpa_router
from backend.api.routes.features import (
    timetable_router, exam_router, syllabus_router, notes_router, assignment_router
)
from backend.api.routes.extended_routes import courses_router

router = APIRouter(prefix="/academic", tags=["Academic Domain"])

router.include_router(attendance_router, tags=["Attendance"])
router.include_router(marks_router, tags=["Marks"])
router.include_router(gpa_router, tags=["GPA"])
router.include_router(timetable_router, tags=["Timetable"])
router.include_router(exam_router, tags=["Exam"])
router.include_router(syllabus_router, tags=["Syllabus"])
router.include_router(notes_router, tags=["Notes"])
router.include_router(assignment_router, tags=["Assignment"])
router.include_router(courses_router, tags=["Courses"])
