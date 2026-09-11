"""Rutas de fichas: grupos organizados por número y programa.

- GET /fichas -> público.
- POST /fichas -> solo administrador (desde el panel admin).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.config.supabase import get_supabase_anon_client
from app.data_contenido import FICHAS_DEMO
from app.middlewares.rbac import requerir_administrador
from app.schemas.auth import UsuarioActual

router = APIRouter(prefix="/fichas", tags=["fichas"])


class FichaIn(BaseModel):
    """Datos para registrar una ficha."""

    numero: str = Field(min_length=4, max_length=20)
    programa: str = Field(min_length=3, max_length=120)
    jornada: str = Field(min_length=3, max_length=30)


@router.get("")
def listar_fichas() -> list[dict]:
    """Devuelve las fichas de Supabase (aunque estén vacías).

    Los datos demo solo se usan si Supabase falla, para la demo offline.
    """
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("fichas").select("*").limit(50).execute()
        return list(resp.data or [])
    except Exception:
        return FICHAS_DEMO


@router.post("", status_code=201)
def crear_ficha(
    datos: FichaIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Registra una ficha. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("fichas").insert(datos.model_dump()).execute()
        filas = list(resp.data or [])
        return filas[0] if filas else dict(datos)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar. Crea la tabla 'fichas' en Supabase (ver tablas_supabase.sql).",
        ) from exc
