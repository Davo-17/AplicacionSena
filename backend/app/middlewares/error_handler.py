"""Manejador global de errores con respuestas JSON uniformes."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("dajesa")


def registrar_manejadores(app: FastAPI) -> None:
    """Registra el handler catch-all sin exponer trazas ni SQL."""

    @app.exception_handler(Exception)
    async def _error_global(request: Request, exc: Exception) -> JSONResponse:
        """Loguea el detalle interno y devuelve un mensaje genérico."""
        logger.exception("Error no controlado en %s", request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor", "code": "internal_error"},
        )
