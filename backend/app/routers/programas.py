"""Rutas de programas: lo que ve el frontend en "Elige tu programa".

- GET /programas -> lista pública (para el index, sin login).
- POST /programas, PUT /programas/{id}, DELETE /programas/{id} -> solo admin.

La tabla guarda campos ricos (código, área, titulación, competencias);
el GET agrega alias legacy (titulo, nivel normalizado, url_sofia)
para que el index actual siga funcionando sin cambios.
"""

import unicodedata
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.config.supabase import get_supabase_anon_client
from app.data_programas import PROGRAMAS_DEMO
from app.middlewares.rbac import requerir_administrador
from app.schemas.auth import UsuarioActual

router = APIRouter(prefix="/programas", tags=["programas"])

NIVELES = ("Técnico", "Tecnólogo")


def _a_publico(fila: dict) -> dict:
    """Normaliza una fila de Supabase al formato que consume el index."""
    sin_tildes = "".join(
        c for c in unicodedata.normalize("NFD", str(fila.get("nivel", ""))) if unicodedata.category(c) != "Mn"
    ).lower()
    nivel_norm = "tecnologia" if sin_tildes.startswith("tecnolog") else "tecnica"
    return {
        **fila,
        "titulo": fila.get("nombre") or fila.get("titulo", ""),
        "nivel": nivel_norm,
        "nivel_etiqueta": fila.get("nivel", "Técnico"),
    }


def _leer_programas() -> list[dict]:
    """Lee de Supabase (normalizado), o demo si algo falla."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("programas").select("*").order("created_at").limit(100).execute()
        if resp.data:
            return [_a_publico(dict(f)) for f in resp.data]
    except Exception:
        pass  # sin internet o sin tabla -> usamos demo
    return PROGRAMAS_DEMO


class ProgramaIn(BaseModel):
    """Datos para crear/editar un programa (campos de la rama frontend-admin)."""

    nombre: str = Field(min_length=3, max_length=120)
    codigo: str = Field(default="", max_length=20)
    duracion: str = Field(default="", max_length=30)
    nivel: Literal["Técnico", "Tecnólogo"] = "Técnico"
    area: str = Field(default="", max_length=120)
    descripcion: str = Field(default="", max_length=1000)
    competencias: list[str] = Field(default_factory=list, max_length=20)
    modalidad: str = Field(default="Presencial", max_length=30)
    titulacion: str = Field(default="", max_length=120)
    jornada: str = Field(default="diurna", max_length=30)
    url_sofia: str = Field(default="https://oferta.senasofiaplus.edu.co/", max_length=300)


@router.get("")
def listar_programas(
    nivel: str | None = Query(default=None, description="tecnica o tecnologia"),
) -> list[dict]:
    """Devuelve todos los programas, opcionalmente filtrados por nivel."""
    programas = _leer_programas()
    if nivel:
        nivel = nivel.lower().strip()
        programas = [p for p in programas if str(p.get("nivel", "")).lower() == nivel]
    return programas


@router.post("", status_code=201)
def crear_programa(
    datos: ProgramaIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Crea un programa. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("programas").insert(datos.model_dump()).execute()
        filas = list(resp.data or [])
        return _a_publico(filas[0]) if filas else dict(datos)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar. Crea la tabla 'programas' en Supabase (ver tablas_supabase.sql).",
        ) from exc


@router.put("/{programa_id}")
def editar_programa(
    programa_id: int, datos: ProgramaIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Edita un programa. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("programas").update(datos.model_dump()).eq("id", programa_id).execute()
        filas = list(resp.data or [])
        if not filas:
            raise HTTPException(status_code=404, detail="Programa no encontrado.")
        return _a_publico(filas[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo actualizar.") from exc


@router.delete("/{programa_id}", status_code=200)
def borrar_programa(
    programa_id: int, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Borra un programa. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        cliente.table("programas").delete().eq("id", programa_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo borrar.") from exc
    return {"ok": True, "id": programa_id}
