"""Complaint service — AI-powered routing and escalation."""
from sqlalchemy.orm import Session
from backend.app.models import Complaint, Student
from backend.services.notification_service import notification_dispatcher

# Auto-classification rules
CATEGORY_KEYWORDS = {
    "academic": ["marks", "grade", "exam", "faculty", "teacher", "syllabus", "lecture", "class"],
    "infrastructure": ["wifi", "ac", "chair", "projector", "light", "water", "toilet", "building", "room"],
    "hostel": ["hostel", "room", "mess", "food", "warden", "curfew", "laundry"],
    "transport": ["bus", "transport", "route", "driver", "late", "pickup"],
    "ragging": ["ragging", "bully", "harass", "threaten", "senior"],
}

DEPARTMENT_ROUTING = {
    "academic": "Academic Affairs Office",
    "infrastructure": "Maintenance Department",
    "hostel": "Hostel Warden",
    "transport": "Transport Cell",
    "ragging": "Anti-Ragging Cell (URGENT)",
    "general": "Student Affairs Office",
}


class ComplaintService:

    def auto_classify(self, description: str) -> str:
        """AI-powered grievance routing — classify complaint by content."""
        lowered = description.lower()
        scores = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in lowered)
            if score > 0:
                scores[category] = score

        if scores:
            return max(scores, key=scores.get)
        return "general"

    def submit_complaint(self, db: Session, student_id: int, title: str,
                        description: str, category: str = None, urgency: str = "Medium") -> dict:
        # Auto-classify if no category provided
        if not category or category == "general":
            category = self.auto_classify(description)

        complaint = Complaint(
            student_id=student_id, title=title, description=description,
            category=category, urgency=urgency,
        )
        db.add(complaint)
        db.commit()

        routed_to = DEPARTMENT_ROUTING.get(category, "Student Affairs Office")

        # Escalate ragging complaints immediately
        if category == "ragging":
            complaint.urgency = "Critical"
            db.commit()

        return {
            "id": complaint.id,
            "category": category,
            "routed_to": routed_to,
            "urgency": complaint.urgency,
            "message": f"Complaint routed to {routed_to}",
        }

    def check_repeat_escalation(self, db: Session, student_id: int, category: str) -> bool:
        """If 3+ complaints from same student on same category, auto-escalate."""
        count = db.query(Complaint).filter(
            Complaint.student_id == student_id,
            Complaint.category == category,
            Complaint.status == "Submitted",
        ).count()
        return count >= 3


complaint_service = ComplaintService()
