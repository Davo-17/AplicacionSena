"""Configuración global de la aplicación.

Lee variables de entorno con pydantic-settings.
Prohíbe explícitamente el wildcard '*' en ALLOWED_ORIGINS.
"""

from functools import lru_cache
from typing import Annotated

from pydantic import BeforeValidator, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def _separar_origenes(valor: object) -> list[str]:
    """Acepta 'a,b' o lista y devuelve lista limpia."""
    if isinstance(valor, str):
        return [o.strip() for o in valor.split(",") if o.strip()]
    if isinstance(valor, list):
        return [str(o).strip() for o in valor if str(o).strip()]
    raise ValueError("ALLOWED_ORIGINS debe ser lista o texto separado por comas")


class Settings(BaseSettings):
    """Ajustes globales cargados desde entorno/.env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Dajesa-API"
    app_env: str = "dev"
    api_prefix: str = "/api/v1"
    allowed_origins: Annotated[list[str], NoDecode, BeforeValidator(_separar_origenes)] = [
        "http://localhost:3000"
    ]
    supabase_url: str = "https://tu-proyecto.supabase.co"
    supabase_anon_key: str = "cambia-esto"
    supabase_service_role_key: str = "cambia-esto"
    supabase_jwt_secret: str = "cambia-esto"
    rate_limit_auth: str = "5/minute"
    rate_limit_default: str = "30/minute"

    @field_validator("allowed_origins")
    @classmethod
    def _forbid_wildcard(cls, value: list[str]) -> list[str]:
        """Rechaza el uso de '*' para evitar CORS abierto."""
        if "*" in value:
            raise ValueError("ALLOWED_ORIGINS no puede contener '*' por seguridad")
        return value


@lru_cache
def get_settings() -> Settings:
    """Retorna la configuración cacheada de la app."""
    return Settings()
