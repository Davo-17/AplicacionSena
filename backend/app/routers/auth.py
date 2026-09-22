"""Rutas de autenticación con rate limiting estricto."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.config.supabase import get_supabase_anon_client
from app.middlewares.rate_limit import limiter
from app.middlewares.rbac import obtener_usuario_actual, requerir_administrador
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioActual
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
_auth_service = AuthService()
logger = logging.getLogger("dajesa")

# Rol que se asigna al auto-registro. Fijo en el servidor: el cliente
# nunca puede elegirse rol (evita auto-asignarse administrador).
ROL_AUTO_REGISTRO = "aprendiz"


class RegistroResponse(BaseModel):
    """Respuesta del auto-registro (no devuelve token)."""

    ok: bool = True
    requiere_confirmacion: bool = True


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(datos: LoginRequest, request: Request) -> TokenResponse:
    """Autentica contra Supabase y devuelve el access token Bearer.

    Tiene rate limiting de 5/min por IP (configurado en main).
    Los errores de Supabase (clave mal, email sin confirmar, usuario
    inexistente) se devuelven como 401 genérico al cliente para no
    enumerar usuarios; la causa real queda en el log del servidor.
    """
    cliente = get_supabase_anon_client()
    try:
        resp = cliente.auth.sign_in_with_password({"email": datos.email, "password": datos.password})
    except Exception as exc:
        # Causa real visible en la terminal (ej. "Email not confirmed").
        # Nunca incluye la clave porque solo logueamos el email y el error.
        logger.warning("Login fallido para %s: %s", datos.email, exc)
        raise HTTPException(status_code=401, detail="Credenciales inválidas") from exc
    sesion = resp.session
    if sesion is None:
        logger.warning("Login sin sesión para %s", datos.email)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return TokenResponse(access_token=sesion.access_token)


@router.get("/yo", response_model=UsuarioActual)
def yo(usuario: UsuarioActual = Depends(obtener_usuario_actual)) -> UsuarioActual:
    """Devuelve el usuario del token Bearer actual."""
    return usuario


@router.post("/registro", response_model=RegistroResponse, status_code=201)
@limiter.limit("5/hour")
def registro(datos: LoginRequest, request: Request) -> RegistroResponse:
    """Auto-registro público para aprendices con correo institucional.

    El rol siempre es "aprendiz" (fijo en el servidor). Las cuentas de
    administrador se siguen creando a mano en Supabase. Límite 5/hora
    por IP para frenar abuso. No devuelve token: el usuario ingresa
    después por /auth/login (previa confirmación del correo si aplica).
    """
    cliente = get_supabase_anon_client()
    try:
        resp = cliente.auth.sign_up(
            {
                "email": datos.email,
                "password": datos.password,
                "options": {"data": {"rol": ROL_AUTO_REGISTRO}},
            }
        )
    except Exception as exc:
        logger.warning("Registro fallido para %s: %s", datos.email, exc)
        raise HTTPException(
            status_code=400,
            detail="No se pudo crear la cuenta. Si ya existe, usa Ingresar.",
        ) from exc
    usuario = getattr(resp, "user", None)
    if usuario is None:
        raise HTTPException(
            status_code=400,
            detail="No se pudo crear la cuenta. Si ya existe, usa Ingresar.",
        )
    # Sin sesión = Supabase exige confirmar el correo antes de entrar.
    return RegistroResponse(requiere_confirmacion=getattr(resp, "session", None) is None)


@router.get("/admin-ping")
def admin_ping(_: UsuarioActual = Depends(requerir_administrador)) -> dict:
    """Ruta de ejemplo solo para administradores."""
    return {"ok": True}
