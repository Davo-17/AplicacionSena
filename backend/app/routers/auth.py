"""Rutas de autenticación con rate limiting estricto."""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.config.settings import get_settings
from app.config.supabase import get_supabase_anon_client, get_supabase_client
from app.middlewares.rate_limit import limiter
from app.middlewares.rbac import obtener_usuario_actual, requerir_administrador
from app.schemas.auth import (
    MENSAJE_DOMINIO,
    LoginRequest,
    TokenResponse,
    UsuarioActual,
    es_correo_institucional,
)
from app.services.auth_service import AuthService, normalizar_rol

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
    # Cuentas exentas (OTP_EXENTOS en .env): entran solo con contraseña.
    exentos = {e.strip().lower() for e in get_settings().otp_exentos if e.strip()}
    return TokenResponse(
        access_token=sesion.access_token,
        requiere_codigo=datos.email not in exentos,
    )


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


# ------------------------------------------------------------------
# Código de seguridad por correo (OTP de 6 dígitos) + cambio de clave.
# El aprendiz puede entrar sin contraseña o recuperar el acceso:
# 1) POST /auth/otp/solicitar -> Supabase le envía el código.
# 2) POST /auth/otp/verificar -> devuelve el access token Bearer.
# 3) PUT /auth/clave (con ese token) -> fija una contraseña nueva.
# ------------------------------------------------------------------


class CorreoIn(BaseModel):
    """Solo un correo institucional validado."""

    email: str

    @field_validator("email")
    @classmethod
    def _email_institucional(cls, value: str) -> str:
        limpio = value.strip().lower()
        if "<" in limpio or ">" in limpio or " " in limpio or "@" not in limpio:
            raise ValueError("Email inválido")
        if not es_correo_institucional(limpio):
            raise ValueError(MENSAJE_DOMINIO)
        return limpio


class OtpVerificarIn(CorreoIn):
    """Email + código de 6 dígitos que llegó al correo."""

    codigo: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


def _espera_otp(exc: Exception) -> int | None:
    """Segundos que pide esperar Supabase ('...after 34 seconds') o None."""
    m = re.search(r"after (\d+) seconds?", str(exc), re.IGNORECASE)
    return int(m.group(1)) if m else None


@router.post("/otp/solicitar")
@limiter.limit("5/hour")
def solicitar_codigo(datos: CorreoIn, request: Request) -> dict:
    """Envía el código de 6 dígitos al correo. Solo cuentas existentes."""
    try:
        get_supabase_anon_client().auth.sign_in_with_otp(
            {"email": datos.email, "options": {"should_create_user": False}}
        )
    except Exception as exc:
        logger.warning("OTP no enviado a %s: %s", datos.email, exc)
        espera = _espera_otp(exc)
        if espera:
            raise HTTPException(
                status_code=429,
                detail=f"Espera {espera} segundos antes de pedir otro código.",
            ) from exc
        raise HTTPException(
            status_code=400,
            detail="No se pudo enviar el código. Verifica que el correo esté registrado e inténtalo de nuevo.",
        ) from exc
    return {"ok": True}


@router.post("/otp/verificar", response_model=TokenResponse)
@limiter.limit("5/minute")
def verificar_codigo(datos: OtpVerificarIn, request: Request) -> TokenResponse:
    """Valida el código y devuelve el access token Bearer (igual que /login)."""
    try:
        resp = get_supabase_anon_client().auth.verify_otp(
            {"email": datos.email, "token": datos.codigo, "type": "email"}
        )
    except Exception as exc:
        logger.warning("OTP inválido para %s: %s", datos.email, exc)
        raise HTTPException(
            status_code=401, detail="Código inválido o vencido. Pide uno nuevo."
        ) from exc
    sesion = getattr(resp, "session", None)
    if sesion is None or not getattr(sesion, "access_token", None):
        raise HTTPException(
            status_code=401, detail="Código inválido o vencido. Pide uno nuevo."
        )
    return TokenResponse(access_token=sesion.access_token)


# ------------------------------------------------------------------
# Gestión de usuarios: el administrador asigna roles a correos
# institucionales (ej. volver admin a otro instructor).
# Usa la service role key (solo backend) vía auth.admin de Supabase.
# ------------------------------------------------------------------

ROLES_ASIGNABLES = ("administrador", "instructor", "aprendiz")


class UsuarioListado(BaseModel):
    """Usuario de Supabase con su rol normalizado para el panel."""

    id: str
    email: str
    rol: str


class CambioRolIn(BaseModel):
    """Email institucional + rol nuevo. Solo administradores."""

    email: str
    rol: str

    @field_validator("email")
    @classmethod
    def _email_institucional(cls, value: str) -> str:
        limpio = value.strip().lower()
        if "@" not in limpio or not es_correo_institucional(limpio):
            raise ValueError(MENSAJE_DOMINIO)
        return limpio

    @field_validator("rol")
    @classmethod
    def _rol_permitido(cls, value: str) -> str:
        limpio = normalizar_rol(value)
        if limpio not in ROLES_ASIGNABLES:
            raise ValueError(f"Rol inválido. Usa: {', '.join(ROLES_ASIGNABLES)}.")
        return limpio


def _rol_de_usuario(usuario) -> str:
    """Lee el rol como lo hace el login (user_metadata primero)."""
    meta = dict(getattr(usuario, "user_metadata", {}) or {})
    app_meta = dict(getattr(usuario, "app_metadata", {}) or {})
    return normalizar_rol(meta.get("rol", meta.get("role", app_meta.get("role", "instructor"))))


def _servicio_admin():
    """Cliente con service role key, con diagnóstico preciso si falla.

    Distingue 'clave sin configurar' (arreglable en backend/.env) de
    'Supabase rechazó la llamada' (clave errónea o expirada).
    """
    from app.config.settings import get_settings

    settings = get_settings()
    clave = (settings.supabase_service_role_key or "").strip()
    if (
        not clave
        or "tu-proyecto" in settings.supabase_url
        or clave in ("cambia-esto", "tu-service-role-key")
        or len(clave) < 50
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Falta la service role key en backend/.env (vacía, de ejemplo o incompleta: "
                "debe ser el JWT largo de 'service_role'). Pégala completa y reinicia el servidor."
            ),
        )
    return get_supabase_client()


@router.get("/usuarios", response_model=list[UsuarioListado])
def listar_usuarios(_: UsuarioActual = Depends(requerir_administrador)) -> list[UsuarioListado]:
    """Lista los usuarios registrados (solo administradores)."""
    servicio = _servicio_admin().auth.admin
    try:
        usuarios = servicio.list_users()
    except Exception as exc:
        logger.warning("No se pudo listar usuarios: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=(
                "Supabase rechazó la service role key. Copia de nuevo la clave 'service_role' "
                "completa (Project Settings → API), pégala en backend/.env y reinicia el servidor."
            ),
        ) from exc
    return [
        UsuarioListado(id=str(u.id), email=u.email or "", rol=_rol_de_usuario(u))
        for u in (usuarios or [])
    ]


@router.put("/usuarios/rol")
def cambiar_rol(
    datos: CambioRolIn, admin: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Asigna un rol a un correo institucional (solo administradores).

    El usuario debe existir (registrado o creado en Supabase). Nadie
    puede quitarse a sí mismo el rol de administrador por accidente.
    """
    if datos.email == admin.email.strip().lower() and datos.rol != "administrador":
        raise HTTPException(
            status_code=400, detail="No puedes quitarte tu propio rol de administrador."
        )
    try:
        servicio = _servicio_admin().auth.admin
        usuarios = servicio.list_users() or []
        objetivo = next((u for u in usuarios if (u.email or "").strip().lower() == datos.email), None)
        if objetivo is None:
            raise HTTPException(
                status_code=404,
                detail="Ese correo aún no tiene cuenta. Debe registrarse primero.",
            )
        meta = dict(getattr(objetivo, "user_metadata", {}) or {})
        meta["rol"] = datos.rol
        servicio.update_user_by_id(str(objetivo.id), {"user_metadata": meta})
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("No se pudo cambiar el rol de %s: %s", datos.email, exc)
        raise HTTPException(
            status_code=500,
            detail=(
                "Supabase rechazó la service role key. Copia de nuevo la clave 'service_role' "
                "completa (Project Settings → API), pégala en backend/.env y reinicia el servidor."
            ),
        ) from exc
    return {"ok": True, "email": datos.email, "rol": datos.rol}
