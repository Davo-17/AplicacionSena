"""DTOs comunes de respuesta y error."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud."""

    status: str = Field(examples=["ok"])
    app: str = Field(examples=["Dajesa-API"])


class ErrorResponse(BaseModel):
    """Formato uniforme de error, sin detalles internos."""

    detail: str = Field(examples=["Error interno del servidor"])
    code: str = Field(examples=["internal_error"])
