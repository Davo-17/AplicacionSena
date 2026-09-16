"""Esquemas de autenticación con validación y sanitización estricta."""

from pydantic import BaseModel, Field, field_validator

# Solo personal y aprendices SENA. El resto se inscribe en Betowa.
DOMINIOS_PERMITIDOS = ("soy.sena.edu.co", "sena.edu.co")

MENSAJE_DOMINIO = (
    "Acceso solo con correo institucional (@soy.sena.edu.co o @sena.edu.co). "
    "Si eres aspirante, inscríbete en https://betowa.sena.edu.co"
)


def es_correo_institucional(email: str) -> bool:
    """True si el email pertenece a un dominio SENA permitido."""
    return email.strip().lower().endswith(tuple("@" + d for d in DOMINIOS_PERMITIDOS))


class LoginRequest(BaseModel):
    """Credenciales de ingreso. Se validan antes de llamar a Supabase."""

    email: str = Field(min_length=5, max_length=254, examples=["usuario@sena.edu.co"])
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def _sanitizar_email(cls, value: str) -> str:
        """Normaliza el email, rechaza caracteres peligrosos y dominios externos."""
        limpio = value.strip().lower()
        if "<" in limpio or ">" in limpio or " " in limpio:
            raise ValueError("Email inválido")
        if "@" not in limpio:
            raise ValueError("Email inválido")
        if not es_correo_institucional(limpio):
            raise ValueError(MENSAJE_DOMINIO)
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
