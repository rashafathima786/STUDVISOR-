"""
Studvisor v2.0 — Comprehensive Test Suite
Tests: health, auth, role guards, student routes, faculty routes, admin routes, AI engine, services.
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH & ROOT
# ═══════════════════════════════════════════════════════════════════════════════

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "3.0.0" in r.json()["version"]

def test_health():
    r = client.get("/health/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_docs_accessible():
    r = client.get("/docs")
    assert r.status_code == 200

def test_openapi_schema():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert "paths" in r.json()


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

def test_login_missing_fields():
    r = client.post("/auth/login/", json={})
    assert r.status_code == 422

def test_login_invalid_credentials():
    r = client.post("/auth/login/", json={"username": "nonexistent_user", "password": "wrong_pass"})
    assert r.status_code == 401

def test_register_and_login():
    # Register
    r = client.post("/auth/register/", json={
        "username": "test_student_ci",
        "email": "test_ci@Studvisor.edu",
        "password": "testpassword123",
        "full_name": "CI Test Student",
    })
    assert r.status_code in (200, 400)  # 400 if already exists

    # Login
    r = client.post("/auth/login/", json={"username": "test_student_ci", "password": "testpassword123"})
    if r.status_code == 200:
        data = r.json()
        assert "access_token" in data
        assert data["role"] == "student"


# ═══════════════════════════════════════════════════════════════════════════════
# ROLE GUARDS — Protected routes should reject without token
# ═══════════════════════════════════════════════════════════════════════════════

def test_student_routes_unauthorized():
    """Student routes should return 401/403 without auth."""
    for path in ["/academic/gpa/cgpa/", "/campus/fees/my-fees/", "/academic/attendance/overall/", "/campus/chat/history/", "/user/leave/requests/", "/campus/events/", "/campus/polls/", "/campus/anon/posts/"]:
        r = client.get(path)
        assert r.status_code in (401, 403), f"Route {path} should be protected"

def test_admin_routes_unauthorized():
    """Admin routes should return 401/403 without auth."""
    for path in ["/admin/dashboard/v2/", "/admin/students/", "/admin/reports/attendance/"]:
        r = client.get(path)
        assert r.status_code in (401, 403), f"Route {path} should be protected"

def test_faculty_routes_unauthorized():
    """Faculty routes should return 401/403 without auth."""
    for path in ["/faculty-portal/dashboard/", "/faculty-portal/attendance/defaulters/"]:
        r = client.get(path)
        assert r.status_code in (401, 403), f"Route {path} should be protected"

def test_ai_engine_unauthorized():
    """AI engine routes should be protected."""
    r = client.get("/v2/ai/student/badges")
    assert r.status_code in (401, 403)

    r = client.get("/v2/ai/admin/risk-dashboard")
    assert r.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

def test_library_catalog():
    r = client.get("/user/library/catalog/")
    assert r.status_code == 200
    assert "books" in r.json()

def test_placement_drives():
    r = client.get("/campus/placement/drives/")
    assert r.status_code == 200
    assert "drives" in r.json()

def test_announcements():
    r = client.get("/campus/announcements/")
    assert r.status_code == 200

def test_leaderboard():
    r = client.get("/user/leaderboard/")
    assert r.status_code == 200
    assert "leaderboard" in r.json()

def test_calendar():
    r = client.get("/campus/calendar/month/")
    assert r.status_code == 200

def test_exams():
    r = client.get("/academic/exams/")
    assert r.status_code == 200

def test_notes():
    r = client.get("/academic/notes/")
    assert r.status_code == 200

def test_lost_found():
    r = client.get("/campus/lost-found/")
    assert r.status_code == 200

def test_faculty_directory():
    r = client.get("/campus/faculty/directory/")
    assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE UNIT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

def test_gpa_grade_mapping():
    """GPA grade mapping should return correct grades."""
    from backend.services.gpa_service import percentage_to_grade
    assert percentage_to_grade(95)["letter"] == "O"
    assert percentage_to_grade(95)["point"] == 10
    assert percentage_to_grade(85)["letter"] == "A+"
    assert percentage_to_grade(75)["letter"] == "A"
    assert percentage_to_grade(65)["letter"] == "B+"
    assert percentage_to_grade(55)["letter"] == "B"
    assert percentage_to_grade(45)["letter"] == "C"
    assert percentage_to_grade(30)["letter"] == "F"
    assert percentage_to_grade(0)["letter"] == "F"

def test_plagiarism_detector():
    """Plagiarism detector should detect identical texts."""
    from backend.services.plagiarism_service import plagiarism_detector
    result = plagiarism_detector.compare_pair(
        "The quick brown fox jumps over the lazy dog",
        "The quick brown fox jumps over the lazy dog",
    )
    assert result["combined_score"] > 0.8
    assert result["is_suspicious"] is True

def test_plagiarism_different_texts():
    """Different texts should have low similarity."""
    from backend.services.plagiarism_service import plagiarism_detector
    result = plagiarism_detector.compare_pair(
        "Machine learning is a subset of artificial intelligence",
        "The weather today is sunny and warm with clear skies",
    )
    assert result["combined_score"] < 0.5

def test_chatbot_intent_detection():
    """Chatbot should detect intents correctly."""
    from backend.app.chatbot import detect_intent
    assert detect_intent("What is my attendance?") == "attendance_overall"
    assert detect_intent("Show subject wise attendance") == "attendance_subject"
    assert detect_intent("What is my CGPA?") == "cgpa"
    assert detect_intent("Can I bunk today?") == "bunk_check"
    assert detect_intent("Hello!") == "greeting"
    assert detect_intent("Help me") == "help"
    assert detect_intent("what is my overall performance") == "overall_performance"
    assert detect_intent("how am i doing academically") == "overall_performance"
    assert detect_intent("Can I apply for OD?") == "apply_od"
    assert detect_intent("how to apply for OD") == "apply_od"
    assert detect_intent("eligibility for OD") == "apply_od"

def test_chatbot_emotion_detection():
    """Emotion detection should classify correctly."""
    from backend.app.chatbot import detect_emotion
    assert detect_emotion("I hate this subject, I can't understand anything") == "frustrated"
    assert detect_emotion("I'm stressed about exams") == "anxious"
    assert detect_emotion("This is great, I love it!") == "positive"
    assert detect_emotion("What time is the next class?") == "neutral"

@pytest.mark.asyncio
async def test_chatbot_student_greeting():
    """Chatbot should route student greetings to the deterministic handler instead of AI Ensemble."""
    from backend.app.chatbot import process_chat
    from backend.app.database import SessionLocal
    from backend.app.models import Student
    
    db = SessionLocal()
    try:
        # Create a dummy student with required attributes
        student = Student(
            username="test_greet_student",
            full_name="Greeting Student",
            hashed_password="hashed",
            merit_points=0
        )
        student.user_role = "student"
        
        # Call process_chat
        res = await process_chat(db, student, "hey")
        assert "Hello Greeting" in res["reply"]
        assert res["protocol"] == "Deterministic"
        assert len(res["actions"]) > 0
    finally:
        db.close()

@pytest.mark.asyncio
async def test_chatbot_apply_od():
    """Chatbot should route OD application queries to the deterministic handle_apply_od."""
    from backend.app.chatbot import process_chat
    from backend.app.database import SessionLocal
    from backend.app.models import Student
    
    db = SessionLocal()
    try:
        student = Student(
            username="test_od_student",
            full_name="OD Student",
            hashed_password="hashed",
            merit_points=0
        )
        student.user_role = "student"
        
        res = await process_chat(db, student, "Can I apply for OD?")
        assert "Yes, you can apply for On Duty (OD)" in res["reply"]
        assert "To apply for OD:" in res["reply"]
        assert res["protocol"] == "Deterministic"
        assert len(res["actions"]) == 1
        assert res["actions"][0]["payload"] == "/leave"
    finally:
        db.close()

@pytest.mark.asyncio
async def test_chatbot_overall_performance():
    """Chatbot should route and respond correctly to overall performance query in both sync and stream modes."""
    from backend.app.chatbot import process_chat, process_chat_stream
    from backend.app.database import SessionLocal
    from backend.app.models import Student, Subject, Attendance, Mark
    
    db = SessionLocal()
    sub1, sub2, student = None, None, None
    try:
        # Create a test student
        student = Student(
            username="test_perf_student",
            full_name="Performance Student",
            hashed_password="hashed",
            merit_points=0
        )
        student.user_role = "student"
        db.add(student)
        db.commit()
        db.refresh(student)

        # Create test subjects
        sub1 = Subject(name="Maths", code="MTH1", credits=4, semester=1)
        sub2 = Subject(name="Physics", code="PHY1", credits=3, semester=1)
        db.add_all([sub1, sub2])
        db.commit()
        db.refresh(sub1)
        db.refresh(sub2)

        # Add attendance records
        # 4 present, 1 absent for Maths (80%)
        # 3 present, 0 absent for Physics (100%)
        # Overall: 7 present, 1 absent = 87.5%
        for i in range(4):
            db.add(Attendance(student_id=student.id, subject_id=sub1.id, status="P", date="2026-06-01", hour=1))
        db.add(Attendance(student_id=student.id, subject_id=sub1.id, status="A", date="2026-06-02", hour=1))
        for i in range(3):
            db.add(Attendance(student_id=student.id, subject_id=sub2.id, status="P", date="2026-06-01", hour=2))
        
        # Add marks
        # Maths: 90/100 (90%) -> grade point 10 (or 9 depending on map)
        # Physics: 60/100 (60%) -> grade point 7
        db.add(Mark(student_id=student.id, subject_id=sub1.id, marks_obtained=90, max_marks=100, assessment_type="CIA1", semester=1))
        db.add(Mark(student_id=student.id, subject_id=sub2.id, marks_obtained=60, max_marks=100, assessment_type="CIA1", semester=1))
        db.commit()

        # Run process_chat
        res = await process_chat(db, student, "what is my overall performance")
        assert res["protocol"] == "Deterministic"
        reply = res["reply"]
        assert "Overall Attendance: 87.5%" in reply
        assert "Present: 7" in reply
        assert "Absent: 1" in reply
        assert "Current CGPA" in reply
        assert "Best Subject: Maths" in reply
        assert "Weakest Subject: Physics" in reply
        assert len(res["actions"]) == 4

        # Run process_chat_stream
        chunks = []
        meta = None
        async for chunk in process_chat_stream(db, student, "what is my overall performance"):
            if chunk["type"] == "meta":
                meta = chunk
            elif chunk["type"] == "chunk":
                chunks.append(chunk["token"])

        assert meta is not None
        assert meta["protocol"] == "Deterministic"
        assert len(meta["actions"]) == 4
        streamed_reply = "".join(chunks)
        assert "Overall Attendance: 87.5%" in streamed_reply
        assert "Best Subject: Maths" in streamed_reply

    finally:
        # Clean up database records
        if student and student.id:
            db.query(Mark).filter(Mark.student_id == student.id).delete()
            db.query(Attendance).filter(Attendance.student_id == student.id).delete()
            db.query(Student).filter(Student.id == student.id).delete()
        if sub1 and sub1.id:
            db.query(Subject).filter(Subject.id == sub1.id).delete()
        if sub2 and sub2.id:
            db.query(Subject).filter(Subject.id == sub2.id).delete()
        db.commit()
        db.close()

def test_merit_point_rules():
    """Merit point rules should have correct values."""
    from backend.services.merit_service import POINT_RULES
    assert POINT_RULES["assignment_submit"] == 10
    assert POINT_RULES["streak_30"] == 100
    assert POINT_RULES["semester_topper"] == 500

def test_complaint_auto_classify():
    """Complaint auto-classifier should route correctly."""
    from backend.services.complaint_service import complaint_service
    assert complaint_service.auto_classify("The WiFi in the library is not working") == "infrastructure"
    assert complaint_service.auto_classify("My marks are wrong in the portal") == "academic"
    assert complaint_service.auto_classify("The hostel food quality is terrible") == "hostel"
    assert complaint_service.auto_classify("The bus is always late") == "transport"


@pytest.mark.asyncio
async def test_chatbot_subject_filtering():
    """Chatbot should filter deterministic outputs based on mentioned subjects."""
    from backend.app.chatbot import process_chat
    from backend.app.database import SessionLocal
    from backend.app.models import Student, Subject, Attendance, Mark, ExamSchedule
    
    db = SessionLocal()
    sub1, sub2, student = None, None, None
    try:
        # Create a test student
        student = Student(
            username="test_filter_student",
            full_name="Filter Student",
            hashed_password="hashed",
            merit_points=0
        )
        student.user_role = "student"
        db.add(student)
        db.commit()
        db.refresh(student)

        # Create test subjects
        sub1 = Subject(name="Mathematics", code="MTH101", credits=4, semester=1)
        sub2 = Subject(name="Physics", code="PHY101", credits=3, semester=1)
        db.add_all([sub1, sub2])
        db.commit()
        db.refresh(sub1)
        db.refresh(sub2)

        # Add attendance records
        db.add(Attendance(student_id=student.id, subject_id=sub1.id, status="P", date="2026-06-01", hour=1))
        db.add(Attendance(student_id=student.id, subject_id=sub2.id, status="A", date="2026-06-01", hour=2))
        
        # Add marks
        db.add(Mark(student_id=student.id, subject_id=sub1.id, marks_obtained=95, max_marks=100, assessment_type="CIA1", semester=1))
        db.add(Mark(student_id=student.id, subject_id=sub2.id, marks_obtained=45, max_marks=100, assessment_type="CIA1", semester=1))

        # Add exams
        db.add(ExamSchedule(subject_id=sub1.id, exam_type="CIA1", exam_date="2026-07-01", venue="Room 101", semester=1))
        db.add(ExamSchedule(subject_id=sub2.id, exam_type="CIA1", exam_date="2026-07-02", venue="Room 102", semester=1))
        db.commit()

        # Test attendance filtered by "Mathematics"
        res = await process_chat(db, student, "what is my attendance in Mathematics?")
        assert res["protocol"] == "Deterministic"
        assert "Mathematics" in res["reply"]
        assert "Physics" not in res["reply"]

        # Test marks filtered by "Physics"
        res = await process_chat(db, student, "show my marks for PHY101")
        assert res["protocol"] == "Deterministic"
        assert "Physics" in res["reply"]
        assert "Mathematics" not in res["reply"]

        # Test exams filtered by "Mathematics"
        res = await process_chat(db, student, "when is my Mathematics exam?")
        assert res["protocol"] == "Deterministic"
        assert "Mathematics" in res["reply"]
        assert "Physics" not in res["reply"]

    finally:
        # Clean up database records
        if student and student.id:
            db.query(Mark).filter(Mark.student_id == student.id).delete()
            db.query(Attendance).filter(Attendance.student_id == student.id).delete()
            if sub1 and sub1.id:
                db.query(ExamSchedule).filter(ExamSchedule.subject_id == sub1.id).delete()
            if sub2 and sub2.id:
                db.query(ExamSchedule).filter(ExamSchedule.subject_id == sub2.id).delete()
            db.query(Student).filter(Student.id == student.id).delete()
        if sub1 and sub1.id:
            db.query(Subject).filter(Subject.id == sub1.id).delete()
        if sub2 and sub2.id:
            db.query(Subject).filter(Subject.id == sub2.id).delete()
        db.commit()
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLING
# ═══════════════════════════════════════════════════════════════════════════════

def test_404_for_unknown_route():
    r = client.get("/this-route-does-not-exist-12345")
    assert r.status_code == 404

def test_response_headers():
    """Security headers should be present."""
    r = client.get("/health")
    assert "x-content-type-options" in r.headers
    assert "x-frame-options" in r.headers


@pytest.mark.asyncio
async def test_chatbot_simulation_scenarios():
    """Test chatbot attendance simulation under Scenario 1, 2, 3 and manual entry."""
    from backend.app.chatbot import process_chat
    from backend.app.database import SessionLocal
    from backend.app.models import Student, Subject, Attendance, TimetableSlot
    
    db = SessionLocal()
    student = None
    sub = None
    try:
        # 1. Setup student
        student = Student(
            username="test_sim_student",
            full_name="Sim Student",
            hashed_password="hashed",
            merit_points=0,
            semester=6,
            section="A"
        )
        student.user_role = "student"
        db.add(student)
        db.commit()
        db.refresh(student)

        # 2. Test Scenario 2: Data not available
        res = await process_chat(db, student, "I'm taking 2 days off. What will be my attendance percentage?")
        assert "I can help you calculate that. Could you please provide your current attendance details" in res["reply"]
        assert "Once I have those details, I'll tell you exactly" in res["reply"]

        # 3. Test Manual Entry (Scenario 2 fallback with user details in query)
        res = await process_chat(db, student, "I'm taking 2 days off. My current attendance is 90% and I have 5 classes per day")
        # 90% of 100 total is 90 present. 2 days off at 5 classes/day = 10 missed. New pct = 90 / 110 = 81.8%
        assert "Based on your current attendance of 90.0%" in res["reply"]
        assert "timetable of 5 classes per day" in res["reply"]
        assert "reduce your attendance to 81.8%" in res["reply"]
        assert "Good news! If you take 2 days off" in res["reply"]
        assert "still safe" in res["reply"]

        # 4. Test Scenario 1: Data available in DB
        # Add a subject
        sub = Subject(name="Database Systems", code="DBS101", credits=4, semester=6)
        db.add(sub)
        db.commit()
        db.refresh(sub)

        # Add timetable slots (6 slots total on Monday/Tuesday = 3 classes/day on average)
        db.add(TimetableSlot(subject_id=sub.id, day="Monday", hour=1, section="A", semester=6))
        db.add(TimetableSlot(subject_id=sub.id, day="Monday", hour=2, section="A", semester=6))
        db.add(TimetableSlot(subject_id=sub.id, day="Monday", hour=3, section="A", semester=6))
        db.add(TimetableSlot(subject_id=sub.id, day="Tuesday", hour=1, section="A", semester=6))
        db.add(TimetableSlot(subject_id=sub.id, day="Tuesday", hour=2, section="A", semester=6))
        db.add(TimetableSlot(subject_id=sub.id, day="Tuesday", hour=3, section="A", semester=6))
        db.commit()

        # Add attendance records (90 present, 10 absent = 90%)
        for _ in range(90):
            db.add(Attendance(student_id=student.id, subject_id=sub.id, status="P", date="2026-06-01", hour=1))
        for _ in range(10):
            db.add(Attendance(student_id=student.id, subject_id=sub.id, status="A", date="2026-06-02", hour=1))
        db.commit()

        # Run process_chat for Scenario 1
        res = await process_chat(db, student, "I'm taking 2 days off. What will be my attendance percentage?")
        # 90% current. Timetable has 6 slots across 2 days, so 3 classes per day.
        # 2 days off = 6 classes missed. New total = 100 + 6 = 106. New present = 90.
        # New percentage = 90 / 106 = 84.9%
        assert "Based on your current attendance of 90.0%" in res["reply"]
        assert "timetable of 3 classes per day" in res["reply"]
        assert "reduce your attendance to 84.9%" in res["reply"]
        assert "Good news!" in res["reply"]

        # 5. Test Scenario 3: Conversational query "Can I take 2 days off?"
        res = await process_chat(db, student, "Can I take 2 days off?")
        assert "Let me check your attendance. If you miss classes for the next 2 days" in res["reply"]
        assert "reduce your attendance to 84.9%" in res["reply"]

    finally:
        if student and student.id:
            db.query(Attendance).filter(Attendance.student_id == student.id).delete()
            db.query(TimetableSlot).filter(TimetableSlot.semester == student.semester, TimetableSlot.section == student.section).delete()
            db.query(Student).filter(Student.id == student.id).delete()
        if sub and sub.id:
            db.query(Subject).filter(Subject.id == sub.id).delete()
        db.commit()
        db.close()


@pytest.mark.asyncio
async def test_chatbot_low_marks_fallback():
    """Test chatbot low marks handler fallback shows at least 3 subjects when none are below 40%."""
    from backend.app.chatbot import process_chat
    from backend.app.database import SessionLocal
    from backend.app.models import Student, Subject, Mark
    
    db = SessionLocal()
    student = None
    sub1, sub2, sub3 = None, None, None
    try:
        # 1. Setup student
        student = Student(
            username="test_low_marks_stud",
            full_name="Low Marks Student",
            hashed_password="hashed",
            merit_points=0,
            semester=6
        )
        student.user_role = "student"
        db.add(student)
        db.commit()
        db.refresh(student)

        # 2. Add subjects
        sub1 = Subject(name="Maths", code="MTH99", credits=4, semester=6)
        sub2 = Subject(name="Physics", code="PHY99", credits=4, semester=6)
        sub3 = Subject(name="Chemistry", code="CHM99", credits=4, semester=6)
        db.add_all([sub1, sub2, sub3])
        db.commit()
        db.refresh(sub1)
        db.refresh(sub2)
        db.refresh(sub3)

        # 3. Add marks above 40.0% (90%, 80%, 70%)
        db.add(Mark(student_id=student.id, subject_id=sub1.id, marks_obtained=90, max_marks=100, assessment_type="CIA1", semester=6))
        db.add(Mark(student_id=student.id, subject_id=sub2.id, marks_obtained=80, max_marks=100, assessment_type="CIA1", semester=6))
        db.add(Mark(student_id=student.id, subject_id=sub3.id, marks_obtained=70, max_marks=100, assessment_type="CIA1", semester=6))
        db.commit()

        # 4. Run low marks query
        res = await process_chat(db, student, "which all subjects i have less marks?")
        reply = res["reply"]
        assert "Great news!" in reply
        assert "no subjects with less than 40" in reply
        assert "lowest-scoring subjects:" in reply
        
        # Verify it lists all 3 subjects and in ascending order (Chemistry first, Maths last)
        assert "Chemistry" in reply
        assert "Physics" in reply
        assert "Maths" in reply
        
        chem_index = reply.index("Chemistry")
        phys_index = reply.index("Physics")
        math_index = reply.index("Maths")
        assert chem_index < phys_index < math_index

    finally:
        if student and student.id:
            db.query(Mark).filter(Mark.student_id == student.id).delete()
            db.query(Student).filter(Student.id == student.id).delete()
        for s in (sub1, sub2, sub3):
            if s and s.id:
                db.query(Subject).filter(Subject.id == s.id).delete()
        db.commit()
        db.close()

