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
    assert "2.0.0" in r.json()["version"]

def test_health():
    r = client.get("/health")
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
    r = client.post("/login", json={})
    assert r.status_code == 422

def test_login_invalid_credentials():
    r = client.post("/login", json={"username": "nonexistent_user", "password": "wrong_pass"})
    assert r.status_code == 401

def test_register_and_login():
    # Register
    r = client.post("/register", json={
        "username": "test_student_ci",
        "email": "test_ci@Studvisor.edu",
        "password": "testpassword123",
        "full_name": "CI Test Student",
    })
    assert r.status_code in (200, 400)  # 400 if already exists

    # Login
    r = client.post("/login", json={"username": "test_student_ci", "password": "testpassword123"})
    if r.status_code == 200:
        data = r.json()
        assert "access_token" in data
        assert data["role"] == "student"


# ═══════════════════════════════════════════════════════════════════════════════
# ROLE GUARDS — Protected routes should reject without token
# ═══════════════════════════════════════════════════════════════════════════════

def test_student_routes_unauthorized():
    """Student routes should return 401/403 without auth."""
    for path in ["/gpa/cgpa", "/fees/my-fees", "/attendance/overall", "/chat/history", "/leave/requests"]:
        r = client.get(path)
        assert r.status_code in (401, 403), f"Route {path} should be protected"

def test_admin_routes_unauthorized():
    """Admin routes should return 401/403 without auth."""
    for path in ["/admin/dashboard", "/admin/students", "/admin/analytics/at-risk-students"]:
        r = client.get(path)
        assert r.status_code in (401, 403), f"Route {path} should be protected"

def test_faculty_routes_unauthorized():
    """Faculty routes should return 401/403 without auth."""
    for path in ["/faculty-portal/dashboard", "/faculty-portal/attendance/defaulters"]:
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
    r = client.get("/library/catalog")
    assert r.status_code == 200
    assert "books" in r.json()

def test_placement_drives():
    r = client.get("/placement/drives")
    assert r.status_code == 200
    assert "drives" in r.json()

def test_events():
    r = client.get("/events")
    assert r.status_code == 200

def test_announcements():
    r = client.get("/announcements")
    assert r.status_code == 200

def test_leaderboard():
    r = client.get("/leaderboard")
    assert r.status_code == 200
    assert "leaderboard" in r.json()

def test_calendar():
    r = client.get("/calendar")
    assert r.status_code == 200

def test_exams():
    r = client.get("/exams")
    assert r.status_code == 200

def test_polls():
    r = client.get("/polls")
    assert r.status_code == 200

def test_notes():
    r = client.get("/notes")
    assert r.status_code == 200

def test_lost_found():
    r = client.get("/lost-found")
    assert r.status_code == 200

def test_anon_posts():
    r = client.get("/anon/posts")
    assert r.status_code == 200

def test_faculty_directory():
    r = client.get("/faculty/directory")
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

def test_chatbot_emotion_detection():
    """Emotion detection should classify correctly."""
    from backend.app.chatbot import detect_emotion
    assert detect_emotion("I hate this subject, I can't understand anything") == "frustrated"
    assert detect_emotion("I'm stressed about exams") == "anxious"
    assert detect_emotion("This is great, I love it!") == "positive"
    assert detect_emotion("What time is the next class?") == "neutral"

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

