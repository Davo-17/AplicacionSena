"""RBAC con Bearer token: administrador e instructor."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import UsuarioActual
from app.services.auth_service import AuthService

_esquema_bearer = HTTPBearer(auto_error=True)
_auth_service = AuthService()


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(_esquema_bearer),
) -> UsuarioActual:
    """Exige 'Authorization: Bearer <token>' y retorna el usuario verificado.

    Al no usar cookies, el navegador no envía credenciales automáticamente,
    lo que mitiga CSRF por diseño.
    """
    try:
        datos = _auth_service.verificar_token(credenciales.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        ) from exc
    return UsuarioActual(
        id=str(datos.get("sub", "")),
        email=str(datos.get("email", "")),
        rol=str(datos.get("rol", datos.get("role", "instructor"))).lower(),
    )


def requerir_administrador(
    usuario: UsuarioActual = Depends(obtener_usuario_actual),
) -> UsuarioActual:
    """Permite solo rol administrador (CRUD global)."""
    if usuario.rol != "administrador":
        raise HTTPException(status_code=403, detail="Se requiere rol administrador")
    return usuario


def requerir_instructor(
    usuario: UsuarioActual = Depends(obtener_usuario_actual),
) -> UsuarioActual:
    """Permite instructor y administrador (lectura + creación propia)."""
    if usuario.rol not in {"administrador", "instructor"}:
        raise HTTPException(status_code=403, detail="Se requiere rol instructor")
    return usuario
