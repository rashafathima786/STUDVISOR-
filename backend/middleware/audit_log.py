"""
Audit Log Middleware — automatically logs all write operations.
Append-only log: actor, action, entity, IP, timestamp.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import logging

logger = logging.getLogger("Studvisor.audit")

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Routes to skip audit (high-frequency read-like POSTs)
SKIP_AUDIT = {"/chat", "/chat/stream", "/v2/ai/student/chat", "/v2/ai/student/chat/stream"}


class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        if request.method in WRITE_METHODS and request.url.path not in SKIP_AUDIT:
            # Extract actor from JWT if present
            auth = request.headers.get("Authorization", "")
            actor = "anonymous"
            if auth.startswith("Bearer "):
                from backend.core.security import decode_token
                payload = decode_token(auth.split(" ", 1)[1])
                if payload:
                    actor = f"{payload.get('role', '?')}:{payload.get('sub', '?')}(id={payload.get('entity_id', '?')})"

            ip = request.client.host if request.client else "?"
            log_msg = f"[AUDIT] {request.method} {request.url.path} → {response.status_code} | actor={actor} | ip={ip}"
            logger.info(log_msg)

            # Persist to DB in background
            from backend.app.database import SessionLocal
            from backend.app.models import AuditLog
            from fastapi import BackgroundTasks
            
            async def persist_audit_log(actor_info, method, path, status, ip_addr):
                db = SessionLocal()
                try:
                    # Parse actor_info back to pieces if possible or just store as string
                    role = actor_info.split(":")[0] if ":" in actor_info else "anonymous"
                    username = actor_info.split(":")[1].split("(")[0] if "(" in actor_info else actor_info
                    
                    log = AuditLog(
                        actor_username=username,
                        actor_role=role,
                        action=f"{method} {path}",
                        resource_type=path.split("/")[1] if len(path.split("/")) > 1 else "root",
                        resource_id=None, # Extracting this would require parsing request body
                        old_value=None,
                        new_value=f"Status: {status}",
                        ip_address=ip_addr,
                        user_agent=request.headers.get("user-agent", "?")
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    logger.error(f"Failed to persist audit log: {str(e)}")
                finally:
                    db.close()

            # Note: dispatch doesn't have easy access to BackgroundTasks object from response
            # So we create a one-off task if needed or just fire and forget
            import asyncio
            asyncio.create_task(persist_audit_log(actor, request.method, request.url.path, response.status_code, ip))

        return response

