"""
Audit Log Middleware — automatically logs all write operations.
Append-only log: actor, action, entity, IP, timestamp.
Optimized to prevent event loop blocking.
"""
import asyncio
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from backend.app.database import SessionLocal
from backend.app.models import AuditLog
from backend.core.security import decode_token

logger = logging.getLogger("Studvisor.audit")

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Routes to skip audit (high-frequency read-like POSTs)
SKIP_AUDIT = {"/chat", "/chat/stream", "/v2/ai/student/chat", "/v2/ai/student/chat/stream"}


def sync_persist_audit_log(actor_info, actor_id, method, path, status, ip_addr, user_agent):
    """Synchronous database persistence run in a thread pool."""
    db = SessionLocal()
    try:
        role = actor_info.split(":")[0] if ":" in actor_info else "anonymous"
        username = actor_info.split(":")[1].split("(")[0] if "(" in actor_info else actor_info
        
        log = AuditLog(
            actor_username=username,
            actor_role=role,
            actor_id=actor_id,
            action=f"{method} {path}",
            resource_type=path.split("/")[1] if len(path.split("/")) > 1 else "root",
            resource_id=None,
            old_value=None,
            new_value=f"Status: {status}",
            ip_address=ip_addr,
            details=user_agent
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist audit log: {str(e)}")
    finally:
        db.close()


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        if request.method in WRITE_METHODS and request.url.path not in SKIP_AUDIT:
            # Extract actor from JWT if present
            auth = request.headers.get("Authorization", "")
            actor_id = 0
            actor = "anonymous"
            if auth.startswith("Bearer "):
                payload = decode_token(auth.split(" ", 1)[1])
                if payload:
                    actor_id = payload.get('entity_id', 0)
                    actor = f"{payload.get('role', '?')}:{payload.get('sub', '?')}"

            ip = request.client.host if request.client else "?"
            user_agent = request.headers.get("user-agent", "?")
            
            # Fire and forget into a thread pool to avoid blocking the event loop
            asyncio.create_task(
                asyncio.to_thread(
                    sync_persist_audit_log,
                    actor, actor_id, request.method, request.url.path, response.status_code, ip, user_agent
                )
            )

        return response

