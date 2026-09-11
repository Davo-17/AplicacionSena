"""Rutas de evidencias: bitácora organizada por ficha.

- GET /evidencias?ficha=NUM -> público (solo visible=true) o admin (todo).
- POST /evidencias/upload -> solo administrador (imagen a Storage).
- POST /evidencias -> solo administrador (entrada de bitácora).
- DELETE /evidencias/{id} -> solo administrador.
"""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field, field_validator

from app.config.supabase import get_supabase_anon_client, get_supabase_client
from app.middlewares.rbac import requerir_administrador
from app.schemas.auth import UsuarioActual
from app.services.auth_service import AuthService

router = APIRouter(prefix="/evidencias", tags=["evidencias"])

BUCKET = "evidencias"
MAX_BYTES = 5 * 1024 * 1024
MAX_IMAGENES = 4
TIPOS = {"clase", "proyecto", "salida", "logro", "otro"}
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


class EvidenciaIn(BaseModel):
    """Entrada de bitácora de una ficha."""

    ficha_numero: str = Field(min_length=4, max_length=20)
    titulo: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(default="", max_length=1000)
    fecha: str = Field(default="", max_length=30)
    tipo: Literal["clase", "proyecto", "salida", "logro", "otro"] = "clase"
    imagenes: list[str] = Field(default_factory=list, max_length=MAX_IMAGENES)
    visible: bool = True

    @field_validator("imagenes")
    @classmethod
    def _urls_http(cls, valor: list[str]) -> list[str]:
        for url in valor:
            if not (url.startswith("http://") or url.startswith("https://")):
                raise ValueError("Cada imagen debe ser una URL http(s).")
        return valor


def _es_admin_opcional(authorization: str | None) -> bool:
    """True si el header trae un token de administrador. Nunca lanza."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return False
    try:
        datos = AuthService().verificar_token(authorization[7:].strip())
    except Exception:
        return False
    return str(datos.get("rol", "")).lower() == "administrador"


@router.get("")
def listar_evidencias(
    ficha: str = "",
    authorization: Annotated[str | None, Header()] = None,
) -> list[dict]:
    """Bitácora de una ficha. El público solo ve visible=true."""
    try:
        cliente = get_supabase_anon_client()
        consulta = cliente.table("evidencias").select("*").order("created_at", desc=True).limit(100)
        if ficha:
            consulta = consulta.eq("ficha_numero", ficha.strip())
        if not _es_admin_opcional(authorization):
            consulta = consulta.eq("visible", True)
        resp = consulta.execute()
        return list(resp.data or [])
    except Exception:
        return []


@router.post("/upload")
def subir_imagen(
    archivo: UploadFile,
    ficha_numero: str = "",
    _: UsuarioActual = Depends(requerir_administrador),
) -> dict:
    """Sube una imagen a Storage. Solo administradores."""
    content_type = (archivo.content_type or "").lower()
    if content_type not in CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Solo se aceptan JPG, PNG o WebP.")
    contenido = archivo.file.read()
    if not contenido or len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="La imagen debe pesar entre 1 byte y 5 MB.")
    if not _es_imagen_valida(contenido, content_type):
        raise HTTPException(status_code=415, detail="El archivo no es una imagen válida.")
    carpeta = (ficha_numero.strip() or "general").replace("/", "-")[:20] or "general"
    ruta = f"ficha_{carpeta}/{uuid.uuid4().hex}{CONTENT_TYPES[content_type]}"
    try:
        supabase = get_supabase_client()
        supabase.storage.from_(BUCKET).upload(
            path=ruta, file=contenido, file_options={"content-type": content_type}
        )
        url = supabase.storage.from_(BUCKET).get_public_url(ruta)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo subir la imagen.") from exc
    return {"url": url, "ruta": ruta}


@router.post("", status_code=201)
def crear_evidencia(
    datos: EvidenciaIn, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Guarda una entrada de bitácora. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("evidencias").insert(datos.model_dump()).execute()
        filas = list(resp.data or [])
        return filas[0] if filas else dict(datos)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar. Crea la tabla 'evidencias' en Supabase (ver tablas_supabase.sql).",
        ) from exc


@router.delete("/{evidencia_id}", status_code=200)
def borrar_evidencia(
    evidencia_id: int, _: UsuarioActual = Depends(requerir_administrador)
) -> dict:
    """Borra una entrada y sus imágenes. Solo administradores."""
    try:
        cliente = get_supabase_anon_client()
        fila = cliente.table("evidencias").select("*").eq("id", evidencia_id).single().execute()
        datos = fila.data or {}
        cliente.table("evidencias").delete().eq("id", evidencia_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail="No se pudo borrar la evidencia.") from exc
    # Limpieza best-effort de archivos en Storage (si la URL es del bucket).
    try:
        rutas = []
        for url in datos.get("imagenes") or []:
            marcador = f"/{BUCKET}/"
            if marcador in url:
                rutas.append(url.split(marcador, 1)[1].split("?", 1)[0])
        if rutas:
            get_supabase_client().storage.from_(BUCKET).remove(rutas)
    except Exception:
        pass
    return {"ok": True, "id": evidencia_id}
