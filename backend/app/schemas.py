"""
Pydantic v2 schemas — typed validation for all API contracts.
Organized by domain for clean imports.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── AUTH ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    role: str
    user: dict

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)


# ─── STUDENT ────────────────────────────────────────────────────────────────

class StudentProfileResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    batch_year: Optional[int] = None
    section: Optional[str] = None
    roll_number: Optional[str] = None
    merit_points: int = 0
    merit_tier: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None


# ─── ATTENDANCE ──────────────────────────────────────────────────────────────

class AttendanceMarkEntry(BaseModel):
    student_id: int
    status: str = Field(..., pattern="^(P|A|DL)$")

class AttendanceMarkRequest(BaseModel):
    subject_id: int
    date: str
    hour: int = Field(..., ge=1, le=8)
    entries: List[AttendanceMarkEntry]

class AttendanceSubjectResponse(BaseModel):
    subject_id: int
    subject: str
    code: str
    total: int
    present: int
    percentage: float
    below_75: bool


# ─── MARKS ───────────────────────────────────────────────────────────────────

class MarkEntry(BaseModel):
    student_id: int
    marks_obtained: float = Field(..., ge=0)
    max_marks: float = Field(..., gt=0, le=200)

class MarkUploadRequest(BaseModel):
    subject_id: int
    assessment_type: str = Field(..., pattern="^(Internal|Assignment|Lab|University|Quiz|Project|CIA1|CIA2|Model)$")
    semester: str
    entries: List[MarkEntry]


# ─── FEES ────────────────────────────────────────────────────────────────────

class FeeStructureCreate(BaseModel):
    name: str
    amount: float = Field(..., gt=0)
    semester: Optional[int] = None
    department: Optional[str] = None
    academic_year: str
    due_date: Optional[str] = None
    category: str = "tuition"

class PaymentRequest(BaseModel):
    student_fee_id: int
    amount: float = Field(..., gt=0)
    payment_method: str = "upi"
    transaction_id: Optional[str] = None


# ─── LEAVE ───────────────────────────────────────────────────────────────────

class LeaveCreate(BaseModel):
    leave_type: str = Field(..., pattern="^(Medical|Personal|Family|Academic|OD|Other)$")
    from_date: str
    to_date: str
    reason: str = Field(..., min_length=10, max_length=500)

class LeaveApproval(BaseModel):
    status: str = Field(..., pattern="^(Faculty_Approved|HOD_Approved|Approved|Rejected)$")
    remarks: Optional[str] = None


# ─── COMPLAINTS ──────────────────────────────────────────────────────────────

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20)
    category: str = Field(default="general")
    urgency: str = Field(default="Medium")

class ComplaintResponse(BaseModel):
    admin_response: str = Field(..., min_length=10)
    status: str = "Resolved"


# ─── ASSIGNMENTS ─────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    subject_id: int
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    due_date: Optional[str] = None
    max_marks: float = 100


# ─── LECTURE LOGS ────────────────────────────────────────────────────────────

class LectureLogCreate(BaseModel):
    subject_id: int
    date: str
    hour: int = Field(..., ge=1, le=8)
    topic_covered: str = Field(..., min_length=5)
    methodology: str = "Lecture"
    remarks: Optional[str] = None

class LectureLogResponse(BaseModel):
    id: int
    subject: str
    code: str
    faculty: str
    date: str
    hour: int
    topic_covered: str
    methodology: str
    remarks: Optional[str] = None
    created_at: datetime


# ─── PLACEMENT ───────────────────────────────────────────────────────────────

class PlacementDriveCreate(BaseModel):
    company_name: str
    role_title: str
    package_lpa: Optional[float] = None
    description: Optional[str] = None
    eligibility_cgpa: float = 0
    eligible_departments: Optional[str] = None
    drive_date: Optional[str] = None
    last_date_apply: Optional[str] = None


# ─── LIBRARY ─────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    author: str = Field(..., min_length=1, max_length=200)
    isbn: Optional[str] = None
    category: str = "textbook"
    department: Optional[str] = None
    total_copies: int = Field(default=1, gt=0)
    shelf_location: Optional[str] = None
    publisher: Optional[str] = None
    year_published: Optional[int] = None


# ─── AI ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    context_page: Optional[str] = None

class QuestionPaperRequest(BaseModel):
    subject_code: str
    exam_type: str = "CIA"
    total_marks: int = 50
    bloom_distribution: Optional[dict] = None


# ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    target_scope: str = "all"


# ─── GENERIC ────────────────────────────────────────────────────────────────

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=25, ge=1, le=100)

class PaginatedResponse(BaseModel):
    data: list
    page: int
    per_page: int
    total: int
    total_pages: int

class AuditLogResponse(BaseModel):
    id: int
    actor_username: str
    actor_role: str
    action: str
    resource_type: str
    timestamp: datetime
    ip_address: Optional[str] = None

class AmendmentRequestCreate(BaseModel):
    record_id: int
    new_status: str
    reason: str

class AmendmentRequestResponse(BaseModel):
    id: int
    faculty_id: int
    attendance_id: int
    new_status: str
    reason: str
    status: str
    created_at: datetime


# ─── ACADEMIC POLICY & PLANNING ──────────────────────────────────────────────

class AcademicPolicyResponse(BaseModel):
    policy_key: str
    value: str
    description: Optional[str] = None

class AcademicTermResponse(BaseModel):
    id: int
    name: str
    start_date: str
    end_date: str
    is_active: bool

class HolidayResponse(BaseModel):
    date: str
    name: str
    type: str

