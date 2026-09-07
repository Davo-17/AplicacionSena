"""Cliente singleton de Supabase."""

from functools import lru_cache

from supabase import Client, create_client

from app.config.settings import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Crea y reutiliza el cliente de Supabase con la service role key.

    La service role vive solo en el backend, nunca se expone al frontend.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def get_supabase_anon_client() -> Client:
    """Cliente con anon key para operaciones públicas (ej. login)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)
