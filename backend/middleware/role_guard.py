"""
Role Guard Middleware — infrastructure-level RBAC enforcement.
Checks JWT role BEFORE hitting any route handler.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from backend.core.security import decode_token

# Define which route prefixes require which roles
ROLE_ROUTE_MAP = {
    "/faculty-portal": ("faculty", "hod"),
    "/ai/v2/ai/faculty": ("faculty", "hod"),
    "/admin": ("admin",),
    "/ai/v2/ai/admin": ("admin",),
}

# Public routes that don't need role checking
PUBLIC_ROUTES = {"/", "/health", "/login", "/register", "/docs", "/openapi.json", "/redoc"}


class RoleGuardMiddleware(BaseHTTPMiddleware):
    """Reject requests to role-specific routes if JWT role doesn't match."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip public routes and non-role-specific routes
        if path in PUBLIC_ROUTES or request.method == "OPTIONS":
            return await call_next(request)

        # Check if this path is role-restricted
        for prefix, allowed_roles in ROLE_ROUTE_MAP.items():
            if path.startswith(prefix):
                # Extract token
                auth_header = request.headers.get("Authorization", "")
                if not auth_header.startswith("Bearer "):
                    return JSONResponse(status_code=401, content={"success": False, "error": "Missing authorization"})

                token = auth_header.split(" ", 1)[1]
                payload = decode_token(token)
                if not payload:
                    return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

                role = payload.get("role", "")
                if role not in allowed_roles:
                    return JSONResponse(status_code=403, content={
                        "success": False,
                        "error": f"Route {prefix}/* requires role: {', '.join(allowed_roles)}. Your role: {role}"
                    })
                break

        return await call_next(request)
