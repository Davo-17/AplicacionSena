"""Lógica de negocio de autenticación, desacoplada de FastAPI."""

from app.config.supabase import get_supabase_anon_client


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
        rol = str(
            meta.get("rol", meta.get("role", app_meta.get("role", "instructor")))
        ).lower()
        return {
            "sub": str(usuario.id),
            "email": usuario.email or "",
            "rol": rol,
        }
