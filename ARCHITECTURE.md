# 🏗️ Studvisor Architecture & System Design

Studvisor v3.0 is built as a high-performance, AI-integrated Educational ERP. It follows a modular monolith architecture with a clear separation of concerns between the API layer, business services, and AI orchestration.

## 🛡️ Security & Role-Based Access Control (RBAC)

The system implements a **Three-Tier Security Model**:

1.  **JWT Claim Verification**: Standard Bearer token authentication using `python-jose`. Claims include `role`, `entity_id` (student/faculty ID), and `institution_id`.
2.  **Route-Level Guards**: FastAPI dependency injection (`Depends(require_student)`) ensures that only authorized roles can access specific endpoint groups.
3.  **Database Scoping**: Service-layer helpers (`scope_to_student`) append automatic filtering to SQLAlchemy queries, preventing horizontal privilege escalation (e.g., Student A cannot view Student B's grades even if they guess the ID).

## 🧠 AI Engine & RAG Workflow

The AI engine is designed for deterministic accuracy combined with conversational flexibility:

-   **Intent Extraction**: A regex-based dispatcher identifies academic queries (attendance, GPA, etc.).
-   **Context Injection**: For each query, the system fetches the student's real-time data (Attendance, Marks, Leave Status) and injects it into the prompt.
-   **RAG (Retrieval-Augmented Generation)**: Institutional knowledge (syllabuses, library catalogs, academic calendars) is searched to provide context for non-deterministic queries.
-   **Emotion Awareness**: A rule-based sentiment analysis service detects student distress or frustration, triggering empathetic and supportive response paths.

## 📊 Analytics & Risk Scoring

Studvisor uses a multi-factor algorithm to predict student outcomes:

-   **Dropout Risk**: Weighted calculation of attendance trends, fee payment status, and cumulative CGPA.
-   **Engagement Score**: Derived from Merit System participation, Merit Tier, and Mood Check-ins.
-   **Signals**: The system identifies "Low Attendance" or "Recent Grade Drop" as actionable signals for faculty intervention.

## 🗄️ Data Model

-   **45+ SQLAlchemy Models**: Covering everything from Library issues to Anonymous Campus Wall posts.
-   **Audit Logs**: An append-only log table that tracks every state-changing operation (POST/PUT/DELETE) for institutional integrity.

## 🛠️ Tech Stack Recap

-   **Backend**: FastAPI, SQLAlchemy, **PostgreSQL (Consolidated Source of Truth)**, Alembic.
-   **Frontend**: React 19, Vite, Zustand, Framer Motion.
-   **Infrastructure**: Docker, Multi-stage builds, Nginx.
