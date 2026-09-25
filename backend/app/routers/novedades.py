"""Rutas de novedades: lo que se ve en "Novedades de la Semana".

- GET /novedades -> público (para el index).
- POST /novedades/upload -> solo administrador (portada a Storage).
- POST /novedades, PUT /novedades/{id}, DELETE /novedades/{id} -> solo admin.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel, Field, field_validator

from app.config.supabase import get_supabase_anon_client, get_supabase_client
from app.data_contenido import NOVEDADES_DEMO
from app.middlewares.rbac import requerir_administrador
from app.schemas.auth import UsuarioActual

router = APIRouter(prefix="/novedades", tags=["novedades"])

logger = logging.getLogger("dajesa")
BUCKET = "novedades"
MAX_BYTES = 5 * 1024 * 1024
CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _es_imagen_valida(contenido: bytes, content_type: str) -> bool:
    """Valida por magic bytes, no solo por extensión."""
    if content_type == "image/jpeg":
        return contenido[:3] == b"\xff\xd8\xff"
    if content_type == "image/png":
        return contenido[:8] == b"\x89PNG\r\n\x1a\n"
    if content_type == "image/webp":
        return contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP"
    return False


class NovedadIn(BaseModel):
    """Datos para publicar una novedad."""

    titulo: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(min_length=3, max_length=500)
    fecha: str = Field(default="", max_length=30)
    etiqueta: str = Field(default="Noticia", max_length=30)
    imagen: str = Field(default="", max_length=500)

    @field_validator("imagen")
    @classmethod
    def _url_http(cls, valor: str) -> str:
        if valor and not (valor.startswith("http://") or valor.startswith("https://")):
            raise ValueError("La imagen debe ser una URL http(s).")
        return valor


@router.get("")
def listar_novedades() -> list[dict]:
    """Devuelve las novedades de Supabase, las más recientes primero.

    Sin orden, las recién publicadas quedaban fuera de las 3 tarjetas
    de la página principal.
    """
    try:
        cliente = get_supabase_anon_client()
        resp = (
            cliente.table("novedades")
            .select("*")
            .order("created_at", desc=True)
            .order("id", desc=True)
            .limit(20)
            .execute()
        )
        return list(resp.data or [])
    except Exception:
        return NOVEDADES_DEMO


@router.post("/upload")
def subir_portada(
    archivo: UploadFile, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Sube la portada de una novedad a Storage. Solo administradores."""
    content_type = (archivo.content_type or "").lower()
    if content_type not in CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Solo se aceptan JPG, PNG o WebP.")
    contenido = archivo.file.read()
    if not contenido or len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="La imagen debe pesar entre 1 byte y 5 MB.")
    if not _es_imagen_valida(contenido, content_type):
        raise HTTPException(status_code=415, detail="El archivo no es una imagen válida.")
    ruta = f"portadas/{uuid.uuid4().hex}{CONTENT_TYPES[content_type]}"
    try:
        supabase = get_supabase_client()
        supabase.storage.from_(BUCKET).upload(
            path=ruta, file=contenido, file_options={"content-type": content_type}
        )
        url = supabase.storage.from_(BUCKET).get_public_url(ruta)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo subir la imagen. Revisa el bucket 'novedades' y las policies de Storage (ver backend/tablas_supabase.sql).",
        ) from exc
    return {"url": url, "ruta": ruta}


@router.get("/status")
def estado_storage(_: UsuarioActual = Depends(requerir_administrador)) -> dict:
    """Diagnóstico para el panel: ¿existe el bucket y deja subir/borrar?"""
    try:
        get_supabase_client().storage.get_bucket(BUCKET)
    except Exception as exc:
        logger.warning("Storage novedades: no se pudo leer el bucket: %s", exc)
        return {
            "bucket": False,
            "puede_subir": False,
            "detalle": "Falta crear el bucket 'novedades' en Supabase (Storage). Ejecuta backend/tablas_supabase.sql en el SQL Editor.",
        }
    try:
        supabase = get_supabase_client()
        supabase.storage.from_(BUCKET).upload(
            path=".ping", file=b"ping", file_options={"content-type": "text/plain"}
        )
        supabase.storage.from_(BUCKET).remove([".ping"])
        return {"bucket": True, "puede_subir": True, "detalle": "Storage listo."}
    except Exception as exc:
        logger.warning("Storage novedades: el bucket existe pero falla subir/borrar: %s", exc)
        return {
            "bucket": True,
            "puede_subir": False,
            "detalle": "El bucket existe pero faltan las policies de subida/borrado. Ejecuta backend/tablas_supabase.sql en el SQL Editor.",
        }


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


@router.put("/{novedad_id}")
def editar_novedad(
    novedad_id: int, datos: NovedadIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Edita una novedad. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("novedades").update(datos.model_dump()).eq("id", novedad_id).execute()
        filas = list(resp.data or [])
        if not filas:
            raise HTTPException(status_code=404, detail="Novedad no encontrada.")
        return filas[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo actualizar.") from exc


@router.delete("/{novedad_id}", status_code=200)
def borrar_novedad(
    novedad_id: int, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Borra una novedad y su portada. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        fila = cliente.table("novedades").select("*").eq("id", novedad_id).single().execute()
        datos = fila.data or {}
        cliente.table("novedades").delete().eq("id", novedad_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo borrar.") from exc
    # Limpieza best-effort de la portada en Storage (si la URL es del bucket).
    try:
        url = str(datos.get("imagen") or "")
        marcador = f"/{BUCKET}/"
        if marcador in url:
            ruta = url.split(marcador, 1)[1].split("?", 1)[0]
            get_supabase_client().storage.from_(BUCKET).remove([ruta])
    except Exception:
        pass
    return {"ok": True, "id": novedad_id}
