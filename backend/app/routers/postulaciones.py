"""Rutas de postulaciones: convocatorias que publica el admin.

Ejemplo: "Curso de Liderazgo" con 40 cupos.
- GET /postulaciones -> público (para mostrar la oferta).
- POST /postulaciones -> solo administrador (desde el panel admin).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.config.supabase import get_supabase_anon_client
from app.data_contenido import POSTULACIONES_DEMO
from app.middlewares.rbac import requerir_administrador
from app.schemas.auth import UsuarioActual

router = APIRouter(prefix="/postulaciones", tags=["postulaciones"])


class PostulacionIn(BaseModel):
    """Datos para abrir una postulación."""

    titulo: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(min_length=3, max_length=500)
    cupos: int = Field(ge=1, le=10000)
    fecha_cierre: str = Field(default="", max_length=30)


@router.get("")
def listar_postulaciones() -> list[dict]:
    """Devuelve las postulaciones (de Supabase, o las demo si falla)."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("postulaciones").select("*").limit(50).execute()
        if resp.data:
            return list(resp.data)
    except Exception:
        pass
    return POSTULACIONES_DEMO


@router.post("", status_code=201)
def crear_postulacion(
    datos: PostulacionIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Abre una postulación. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("postulaciones").insert(datos.model_dump()).execute()
        filas = list(resp.data or [])
        return filas[0] if filas else dict(datos)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar. Crea la tabla 'postulaciones' en Supabase (ver tablas_supabase.sql).",
        ) from exc
