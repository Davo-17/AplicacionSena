"""App FastAPI con hardening: CORS, headers, errores, rate-limit y audit."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config.settings import get_settings
from app.middlewares.audit import AuditMiddleware
from app.middlewares.error_handler import registrar_manejadores
from app.middlewares.rate_limit import limiter
from app.middlewares.security_headers import SecurityHeadersMiddleware
from app.routers import auth, health


def crear_app() -> FastAPI:
    """Crea y configura la aplicación con todas las defensas activas."""
    settings = get_settings()
    app = FastAPI(title=settings.app_name, docs_url="/docs", redoc_url=None)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuditMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    registrar_manejadores(app)
    app.include_router(health.router, prefix=settings.api_prefix)
    # Rate limit de login: 5/min por IP
    app.include_router(auth.router, prefix=settings.api_prefix)
    return app


app = crear_app()
