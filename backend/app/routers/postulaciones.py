"""Rutas de postulaciones: convocatorias que publica el admin.

Ejemplo: "Curso de Liderazgo" con 40 cupos.
- GET /postulaciones -> público (para mostrar la oferta).
- POST /postulaciones, PUT /postulaciones/{id}, DELETE /postulaciones/{id} -> solo admin.
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
    """Devuelve las postulaciones de Supabase (aunque estén vacías).

    Los datos demo solo se usan si Supabase falla, para la demo offline.
    """
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("postulaciones").select("*").limit(50).execute()
        return list(resp.data or [])
    except Exception:
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


@router.put("/{postulacion_id}")
def editar_postulacion(
    postulacion_id: int, datos: PostulacionIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Edita una postulación. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = (
            cliente.table("postulaciones").update(datos.model_dump()).eq("id", postulacion_id).execute()
        )
        filas = list(resp.data or [])
        if not filas:
            raise HTTPException(status_code=404, detail="Postulación no encontrada.")
        return filas[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo actualizar.") from exc


@router.delete("/{postulacion_id}", status_code=200)
def borrar_postulacion(
    postulacion_id: int, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Borra una postulación. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        cliente.table("postulaciones").delete().eq("id", postulacion_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo borrar.") from exc
    return {"ok": True, "id": postulacion_id}
