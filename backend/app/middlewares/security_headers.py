"""Cabeceras de seguridad HTTP en cada respuesta."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega CSP, HSTS, X-Frame-Options y demás cabeceras hardening."""

    async def dispatch(self, request: Request, call_next: object) -> Response:
        """Intercepta la respuesta y le inyecta las cabeceras seguras."""
        response = await call_next(request)  # type: ignore[operator]
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response
