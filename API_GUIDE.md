# 📖 Studvisor API Guide

This guide provides an overview of the key endpoints in the Studvisor v3.0 API and instructions on how to interact with them professionally.

## 🔑 Authentication

Most endpoints require a JWT Bearer token.

**1. Login**
```http
POST /login
Content-Type: application/json

{
  "username": "aarav_sharma",
  "password": "student123"
}
```
*Returns `access_token` and `role`.*

## 📊 Student Services

**1. Overall Attendance**
- `GET /attendance/overall` — Returns total, present, and percentage.
- `GET /attendance/bunk-alerts` — High-priority subjects where attendance is < 75%.

**2. Academic Performance**
- `GET /gpa/cgpa` — Returns SGPA per semester and overall CGPA.
- `GET /marks/my-marks` — Returns all published marks.

**3. AI Chatbot**
- `POST /chat` — The primary AI interaction endpoint.
- `GET /chat/history` — Retrieval of previous conversations.

## 🏛️ Faculty & Admin Portal

**1. Faculty Dashboard**
- `GET /faculty-portal/dashboard` — Statistics on class performance and attendance.

**2. Admin Analytics**
- `GET /admin/analytics/at-risk-students` — Returns students flagged by the AI risk engine.
- `GET /admin/audit/logs` — Comprehensive trail of institutional changes.

## 🛠️ Developer Tools

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: `GET /health`

## 💡 Best Practices

1.  **Rate Limiting**: The API enforces a default limit of **200 requests/minute**. Chat and Login endpoints have stricter limits.
2.  **Audit Trail**: All `POST`, `PUT`, and `DELETE` requests are automatically logged in the audit table with actor metadata.
3.  **Pagination**: Most list-based endpoints (Events, Announcements) support `skip` and `limit` parameters.
