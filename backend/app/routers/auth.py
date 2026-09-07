"""Rutas de autenticación con rate limiting estricto."""

from fastapi import APIRouter, Depends, Request

from app.config.supabase import get_supabase_anon_client
from app.middlewares.rate_limit import limiter
from app.middlewares.rbac import obtener_usuario_actual, requerir_administrador
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioActual
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
_auth_service = AuthService()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(datos: LoginRequest, request: Request) -> TokenResponse:
    """Autentica contra Supabase y devuelve el access token Bearer.

    Tiene rate limiting de 5/min por IP (configurado en main).
    """
    cliente = get_supabase_anon_client()
    resp = cliente.auth.sign_in_with_password({"email": datos.email, "password": datos.password})
    sesion = resp.session
    if sesion is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return TokenResponse(access_token=sesion.access_token)


@router.get("/yo", response_model=UsuarioActual)
def yo(usuario: UsuarioActual = Depends(obtener_usuario_actual)) -> UsuarioActual:
    """Devuelve el usuario del token Bearer actual."""
    return usuario


@router.get("/admin-ping")
def admin_ping(_: UsuarioActual = Depends(requerir_administrador)) -> dict:
    """Ruta de ejemplo solo para administradores."""
    return {"ok": True}
