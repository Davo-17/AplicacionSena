"""Endpoint de salud, sin autenticación."""

from fastapi import APIRouter

from app.config.settings import get_settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def salud() -> HealthResponse:
    """Retorna ok si la API está viva. Útil para monitoreo."""
    return HealthResponse(status="ok", app=get_settings().app_name)
