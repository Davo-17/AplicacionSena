"""Rutas de novedades: lo que se ve en "Novedades de la Semana".

- GET /novedades -> público (para el index).
- POST /novedades -> solo administrador (desde el panel admin).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.config.supabase import get_supabase_anon_client
from app.data_contenido import NOVEDADES_DEMO
from app.middlewares.rbac import requerir_administrador
from app.schemas.auth import UsuarioActual

router = APIRouter(prefix="/novedades", tags=["novedades"])


class NovedadIn(BaseModel):
    """Datos para publicar una novedad."""

    titulo: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(min_length=3, max_length=500)
    fecha: str = Field(default="", max_length=30)
    etiqueta: str = Field(default="Noticia", max_length=30)


@router.get("")
def listar_novedades() -> list[dict]:
    """Devuelve las novedades de Supabase (aunque estén vacías).

    Los datos demo solo se usan si Supabase falla, para la demo offline.
    """
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("novedades").select("*").limit(20).execute()
        return list(resp.data or [])
    except Exception:
        return NOVEDADES_DEMO


@router.post("", status_code=201)
def crear_novedad(
    datos: NovedadIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Publica una novedad. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("novedades").insert(datos.model_dump()).execute()
        filas = list(resp.data or [])
        return filas[0] if filas else dict(datos)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar. Crea la tabla 'novedades' en Supabase (ver tablas_supabase.sql).",
        ) from exc
