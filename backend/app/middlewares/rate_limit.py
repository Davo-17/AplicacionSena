"""Rate limiting con slowapi para endpoints sensibles."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config.settings import get_settings


def crear_limiter() -> Limiter:
    """Crea el limitador por IP del cliente."""
    return Limiter(key_func=get_remote_address, default_limits=[get_settings().rate_limit_default])


limiter = crear_limiter()
