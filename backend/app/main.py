"""Servidor principal de la app SENA Dajesa.

Idea en 3 pasos (fácil de explicar en la entrega):
  1. Creamos la app FastAPI.
  2. Le ponemos seguridad (CORS, cabeceras, errores, rate-limit).
  3. Registramos las rutas (/health, /auth, /programas, /chat)
     y servimos el frontend en la misma URL para no pelear con CORS.

Para correr: python -m uvicorn app.main:app --reload --port 8000
(desde la carpeta backend, con el venv activado)
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config.settings import get_settings
from app.middlewares.audit import AuditMiddleware
from app.middlewares.error_handler import registrar_manejadores
from app.middlewares.rate_limit import limiter
from app.middlewares.security_headers import SecurityHeadersMiddleware
from app.routers import auth, chat, fichas, health, novedades, postulaciones, programas


def crear_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    # --- Seguridad ---
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuditMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    registrar_manejadores(app)

    # --- Rutas de la API ---
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(programas.router, prefix=settings.api_prefix)
    app.include_router(chat.router, prefix=settings.api_prefix)
    app.include_router(novedades.router, prefix=settings.api_prefix)
    app.include_router(fichas.router, prefix=settings.api_prefix)
    app.include_router(postulaciones.router, prefix=settings.api_prefix)

    # --- Frontend en la misma URL (demo sin CORS) ---
    # backend/ está al lado de frontend/, así que subimos un nivel.
    frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
    if frontend_dir.exists():
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

    return app


app = crear_app()
