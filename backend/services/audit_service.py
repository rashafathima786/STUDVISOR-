"""Audit service — log all state-changing actions to audit_logs table."""
from sqlalchemy.orm import Session
from backend.app.models import AuditLog
import json


def log_action(db: Session, actor_role: str, actor_id: int, actor_username: str,
               action: str, resource_type: str, resource_id: int = None,
               old_value: dict = None, new_value: dict = None,
               details: str = None, ip_address: str = None):
    """Append-only audit log entry. Never modify existing entries."""
    entry = AuditLog(
        actor_role=actor_role,
        actor_id=actor_id,
        actor_username=actor_username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=json.dumps(old_value) if old_value else None,
        new_value=json.dumps(new_value) if new_value else None,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
    return entry.id
