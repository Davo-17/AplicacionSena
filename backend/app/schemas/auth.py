"""Esquemas de autenticación con validación y sanitización estricta."""

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    """Credenciales de ingreso. Se validan antes de llamar a Supabase."""

    email: str = Field(min_length=5, max_length=254, examples=["usuario@sena.edu.co"])
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def _sanitizar_email(cls, value: str) -> str:
        """Normaliza el email y rechaza caracteres peligrosos."""
        limpio = value.strip().lower()
        if "<" in limpio or ">" in limpio or " " in limpio:
            raise ValueError("Email inválido")
        if "@" not in limpio:
            raise ValueError("Email inválido")
        return limpio


class TokenResponse(BaseModel):
    """Tokens devueltos al frontend (el frontend los guarda en memoria)."""

    access_token: str
    token_type: str = "bearer"


class UsuarioActual(BaseModel):
    """Usuario extraído del JWT verificado."""

    id: str
    email: str = ""
    rol: str = "instructor"
