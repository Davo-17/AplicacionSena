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

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config.settings import get_settings
from app.middlewares.audit import AuditMiddleware
from app.middlewares.error_handler import registrar_manejadores
from app.middlewares.rate_limit import limiter
from app.middlewares.security_headers import SecurityHeadersMiddleware
from app.routers import auth, chat, evidencias, fichas, health, novedades, postulaciones, programas


def crear_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    # Diagnóstico visible al arrancar: confirma qué Supabase se usará.
    # Solo se muestra el host, nunca las claves.
    _log = logging.getLogger("dajesa")
    _host = settings.supabase_url.replace("https://", "").replace("http://", "").split("/")[0]
    if "tu-proyecto" in settings.supabase_url or len(settings.supabase_anon_key) < 50:
        _log.warning("Supabase NO configurado (.env sin valores reales): el login fallará.")
    else:
        _log.info("Supabase configurado: %s", _host)

    # --- Seguridad ---
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuditMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    app.include_router(evidencias.router, prefix=settings.api_prefix)
    app.include_router(postulaciones.router, prefix=settings.api_prefix)

    # --- Frontend en la misma URL (demo sin CORS) ---
    # backend/ está al lado de frontend/, así que subimos un nivel.
    frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
    favicon_path = frontend_dir / "assets" / "logo-sena.png"
    if favicon_path.exists():

        @app.get("/favicon.ico", include_in_schema=False)
        async def favicon() -> FileResponse:
            return FileResponse(favicon_path, media_type="image/png")

    # --- Panel antiguo: redirección directa en servidor ---
    # Sin esto se servía frontend/admin.html (pantalla blanca con texto)
    # antes de saltar a /admin/. Con ruta expresa no se pinta nada.
    @app.get("/admin.html", include_in_schema=False)
    async def admin_legacy() -> RedirectResponse:
        return RedirectResponse(url="/admin/", status_code=308)

    # --- Panel admin React en /admin (misma URL, sin CORS) ---
    # Se sirve lo construido con `npm run build` en admin-react/dist.
    # Es una SPA: /admin y /admin/<ruta> devuelven index.html.
    admin_dist = Path(__file__).resolve().parent.parent.parent / "admin-react" / "dist"
    admin_index = admin_dist / "index.html"
    if admin_dist.exists() and admin_index.exists():
        assets_dir = admin_dist / "assets"
        if assets_dir.exists():
            app.mount("/admin/assets", StaticFiles(directory=assets_dir), name="admin-assets")

        @app.get("/admin", include_in_schema=False)
        async def admin_root() -> RedirectResponse:
            # Con barra final: las rutas relativas (logo, favicon) resuelven bien.
            return RedirectResponse(url="/admin/", status_code=307)

        @app.get("/admin/{ruta:path}", include_in_schema=False)
        async def admin_spa(ruta: str) -> FileResponse:
            candidato = admin_dist / ruta
            # Archivos reales (ej. vite.svg) se sirven tal cual; lo demás es la SPA.
            if ruta and candidato.is_file():
                return FileResponse(candidato)
            return FileResponse(admin_index)

    if frontend_dir.exists():
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

    return app


app = crear_app()
