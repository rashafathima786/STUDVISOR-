"""
Studvisor v2.0 — Complete SQLAlchemy ORM Models
All tables with proper ForeignKeys, indexes, and audit timestamps.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.sql import func
from datetime import datetime
from backend.app.database import Base


# ═══════════════════════════════════════════════════════════════════════════════
# CORE IDENTITY
# ═══════════════════════════════════════════════════════════════════════════════

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String, nullable=False, default="default", index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)
    batch_year = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    roll_number = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    merit_points = Column(Integer, nullable=False, default=0)
    merit_tier = Column(String, nullable=True, default="Novice")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=True)
    institution_id = Column(String, nullable=False, default="default", index=True)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    subjects_teaching = Column(String, nullable=True)  # comma-separated codes
    cabin = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    office_hours = Column(String, nullable=True)
    max_hours = Column(Integer, nullable=True, default=20)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String, nullable=False, default="default", index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role_level = Column(String, nullable=True, default="admin")  # admin, superadmin
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Parent(Base):
    __tablename__ = "parents"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    name = Column(String, nullable=False)
    relation = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    otp_hash = Column(String, nullable=True)
    otp_expiry = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# ACADEMICS
# ═══════════════════════════════════════════════════════════════════════════════

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    institution_id = Column(String, nullable=False, default="default", index=True)
    name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    department = Column(String, nullable=True)
    is_lab = Column(Boolean, default=False)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    institution_id = Column(String, nullable=False, default="default", index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(String, nullable=False)
    hour = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="P")  # P, A, DL
    marked_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    amended_by = Column(Integer, nullable=True)
    amended_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_attendance_student_subject", "student_id", "subject_id"),
        Index("ix_attendance_date", "date"),
    )


class AttendanceAmendmentRequest(Base):
    __tablename__ = "attendance_amendment_requests"
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String, default="default")
    attendance_id = Column(Integer, ForeignKey("attendance.id"))
    faculty_id = Column(Integer, ForeignKey("faculty.id"))
    new_status = Column(String)
    reason = Column(Text)
    status = Column(String, default="Pending") # Pending, Approved, Rejected
    hod_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

class Mark(Base):
    __tablename__ = "marks"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    max_marks = Column(Float, nullable=False)
    assessment_type = Column(String, nullable=False)  # Internal, Assignment, Lab, University, Quiz
    semester = Column(String, nullable=False)
    published = Column(Boolean, default=False)
    uploaded_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    date_published = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_marks_student_subject_type", "student_id", "subject_id", "assessment_type"),
    )


class GPARecord(Base):
    __tablename__ = "gpa_records"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    gpa = Column(Float, nullable=False)
    cgpa = Column(Float, nullable=False)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())


class SyllabusTopic(Base):
    __tablename__ = "syllabus_topics"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    unit = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    hours = Column(Integer, nullable=True, default=1)


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    exam_type = Column(String, nullable=False)  # CIA1, CIA2, Model, University
    exam_date = Column(String, nullable=False)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)


# ═══════════════════════════════════════════════════════════════════════════════
# ASSIGNMENTS & SUBMISSIONS
# ═══════════════════════════════════════════════════════════════════════════════

class Assignment(Base):
    __tablename__ = "assignments"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String, nullable=True)
    max_marks = Column(Float, nullable=True, default=100)
    locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    file_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Submitted")  # Submitted, Graded, Late
    grade = Column(Float, nullable=True)
    similarity_score = Column(Float, nullable=True)  # plagiarism %
    graded_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# LEAVE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    leave_type = Column(String, nullable=False)  # Medical, Personal, Family, Academic, OD
    from_date = Column(String, nullable=False)
    to_date = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Pending")  # Pending, Faculty_Approved, HOD_Approved, Rejected
    faculty_advisor_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    hod_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    actioned_at = Column(DateTime(timezone=True), nullable=True)
    applied_on = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_leave_student_status", "student_id", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# FEES & PAYMENTS
# ═══════════════════════════════════════════════════════════════════════════════

class FeeStructure(Base):
    __tablename__ = "fee_structures"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    semester = Column(Integer, nullable=True)
    department = Column(String, nullable=True)
    academic_year = Column(String, nullable=False)
    due_date = Column(String, nullable=True)
    category = Column(String, nullable=True, default="tuition")


class StudentFee(Base):
    __tablename__ = "student_fees"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"), nullable=True)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False, default=0)
    due_date = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Pending")  # Pending, Partial, Paid, Overdue
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_fee_id = Column(Integer, ForeignKey("student_fees.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    receipt_url = Column(String, nullable=True)
    paid_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# SOCIAL & CAMPUS
# ═══════════════════════════════════════════════════════════════════════════════

class AnonPost(Base):
    __tablename__ = "anon_posts"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    session_hash = Column(String, nullable=False)
    category = Column(String, nullable=True, default="general")
    content = Column(Text, nullable=False)
    moderated = Column(Boolean, default=False)
    toxicity_score = Column(Float, default=0.0)
    censored_content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AnonReaction(Base):
    __tablename__ = "anon_reactions"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("anon_posts.id"), nullable=False)
    session_hash = Column(String, nullable=False)
    reaction_type = Column(String, nullable=False)


class Poll(Base):
    __tablename__ = "polls"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, nullable=True)
    question = Column(String, nullable=False)
    category = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    target_scope = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PollOption(Base):
    __tablename__ = "poll_options"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    option_text = Column(String, nullable=False)
    vote_count = Column(Integer, default=0)


class PollVote(Base):
    __tablename__ = "poll_votes"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)


class Complaint(Base):
    __tablename__ = "complaints"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True, default="general")
    urgency = Column(String, nullable=True, default="Medium")
    status = Column(String, nullable=False, default="Submitted")
    admin_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    user_role = Column(String, nullable=True, default="student")
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)
    type = Column(String, nullable=True)
    action_url = Column(String, nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MeritLog(Base):
    __tablename__ = "merit_logs"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    points = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Event(Base):
    __tablename__ = "events"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Announcement(Base):
    __tablename__ = "announcements"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    target_scope = Column(String, nullable=True)  # department, batch, all
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LostFound(Base):
    __tablename__ = "lost_found"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    item_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    type = Column(String, nullable=False, default="lost")  # lost, found
    location = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Note(Base):
    __tablename__ = "notes"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("students.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Achievement(Base):
    __tablename__ = "achievements"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    badge_id = Column(String, nullable=False)
    badge_name = Column(String, nullable=False)
    xp = Column(Integer, default=0)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    day = Column(String, nullable=False)
    hour = Column(Integer, nullable=False)
    room = Column(String, nullable=True)
    section = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)


class AcademicCalendar(Base):
    __tablename__ = "academic_calendar"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, nullable=False)
    day_name = Column(String, nullable=True)
    is_working_day = Column(Integer, nullable=False, default=1)
    holiday_name = Column(String, nullable=True)
    working_hours = Column(Integer, nullable=False, default=0)
    note = Column(String, nullable=True)


class ChatHistory(Base):
    __tablename__ = "chat_history"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    query = Column(String, nullable=False)
    response = Column(String, nullable=False)
    context_page = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_chat_student_session", "student_id", "session_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LIBRARY
# ═══════════════════════════════════════════════════════════════════════════════

class LibraryBook(Base):
    __tablename__ = "library_books"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    isbn = Column(String, unique=True, nullable=True)
    category = Column(String, nullable=False)
    department = Column(String, nullable=True)
    total_copies = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    shelf_location = Column(String, nullable=True)
    publisher = Column(String, nullable=True)
    year_published = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BookIssue(Base):
    __tablename__ = "book_issues"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("library_books.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    issue_date = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    return_date = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Issued")
    fine_amount = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# COURSE ENROLLMENT & PLACEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Enrolled")
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())


class PlacementDrive(Base):
    __tablename__ = "placement_drives"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    role_title = Column(String, nullable=False)
    package_lpa = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    eligibility_cgpa = Column(Float, nullable=True, default=0)
    eligibility_backlog = Column(Integer, nullable=True, default=0)
    eligible_departments = Column(String, nullable=True)
    drive_date = Column(String, nullable=True)
    last_date_apply = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PlacementApplication(Base):
    __tablename__ = "placement_applications"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(String, nullable=False, default="Applied")
    offer_letter_url = Column(String, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Internship(Base):
    __tablename__ = "internships"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    company_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    stipend = Column(Float, nullable=True, default=0)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    mentor_name = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Ongoing")
    grade = Column(String, nullable=True)
    certificate_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# AI & RISK
# ═══════════════════════════════════════════════════════════════════════════════

class AIRiskScore(Base):
    __tablename__ = "ai_risk_scores"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    dropout_score = Column(Float, nullable=False, default=0)
    academic_score = Column(Float, nullable=False, default=0)
    engagement_score = Column(Float, nullable=False, default=0)
    combined_score = Column(Float, nullable=False, default=0)
    signals = Column(Text, nullable=True)  # JSON
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_risk_computed", "computed_at"),
    )


class MoodRawCheckin(Base):
    __tablename__ = "mood_raw_checkins"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    score = Column(Integer, nullable=False)   # 1-5
    week_number = Column(Integer, nullable=False)
    academic_year = Column(String, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class MoodCheckin(Base):
    __tablename__ = "mood_checkins"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    batch_year = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    week_number = Column(Integer, nullable=False)
    avg_score = Column(Float, nullable=True)
    low_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

class AuditLog(Base):
    __tablename__ = "audit_logs"
    institution_id = Column(String, nullable=False, default="default", index=True)

    id = Column(Integer, primary_key=True, index=True)
    actor_role = Column(String, nullable=False)
    actor_id = Column(Integer, nullable=False)
    actor_username = Column(String, nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(Integer, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

