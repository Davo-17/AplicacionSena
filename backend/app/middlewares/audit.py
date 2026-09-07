"""Audit logs mínimos sin datos sensibles."""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("dajesa.audit")


class AuditMiddleware(BaseHTTPMiddleware):
    """Registra método, ruta, estado y duración de cada petición."""

    async def dispatch(self, request: Request, call_next: object) -> Response:
        """Mide la petición y la deja en el log de auditoría."""
        inicio = time.perf_counter()
        response = await call_next(request)  # type: ignore[operator]
        duracion_ms = int((time.perf_counter() - inicio) * 1000)
        logger.info(
            "%s %s -> %s (%sms)",
            request.method,
            request.url.path,
            response.status_code,
            duracion_ms,
        )
        return response
