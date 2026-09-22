"""Lógica de negocio de autenticación, desacoplada de FastAPI."""

from app.config.supabase import get_supabase_anon_client

# Alias aceptados como administrador. Supabase y plantillas externas
# suelen usar "admin"/"administrator"; nuestro panel exige "administrador".
# Se normaliza aquí para que el resto (RBAC + frontend) compare un solo valor.
ROLES_ADMIN = {"administrador", "admin", "administrator"}


def normalizar_rol(rol: str) -> str:
    """Devuelve 'administrador' para sus alias; el resto en minúsculas."""
    limpio = str(rol or "").strip().lower()
    return "administrador" if limpio in ROLES_ADMIN else limpio


class AuthService:
    """Verifica tokens Bearer preguntándole al servidor de Supabase.

    Así funciona con proyectos nuevos (firma ES256) y viejos (HS256),
    sin depender del JWT_SECRET local.
    """

    def verificar_token(self, token: str) -> dict:
        """Devuelve {sub, email, rol} del dueño del token.

        Lanza ValueError si el token es inválido o expiró.
        """
        try:
            resp = get_supabase_anon_client().auth.get_user(token)
        except Exception as exc:
            raise ValueError("Token inválido o expirado") from exc

        usuario = resp.user
        if usuario is None:
            raise ValueError("Token inválido o expirado")

        meta = dict(getattr(usuario, "user_metadata", {}) or {})
        app_meta = dict(getattr(usuario, "app_metadata", {}) or {})
        rol = normalizar_rol(
            meta.get("rol", meta.get("role", app_meta.get("role", "instructor")))
        )
        return {
            "sub": str(usuario.id),
            "email": usuario.email or "",
            "rol": rol,
        }
