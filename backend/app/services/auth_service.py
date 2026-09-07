"""Lógica de negocio de autenticación, desacoplada de FastAPI."""

import jwt

from app.config.settings import get_settings


class AuthService:
    """Verifica tokens Bearer emitidos por Supabase Auth."""

    def verificar_token(self, token: str) -> dict:
        """Decodifica y valida el JWT. Lanza ValueError si es inválido."""
        settings = get_settings()
        try:
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"require": ["exp", "sub"]},
            )
        except jwt.PyJWTError as exc:
            raise ValueError("Token inválido o expirado") from exc
