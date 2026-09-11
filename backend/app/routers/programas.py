"""Rutas de programas: lo que ve el frontend en "Elige tu programa".

- GET /programas -> lista (pública, sin login para la demo)
- Intenta leer de Supabase; si falla, usa los datos demo.
  Así la entrega nunca se cae por internet.
"""

from fastapi import APIRouter, Query

from app.config.supabase import get_supabase_anon_client
from app.data_programas import PROGRAMAS_DEMO

router = APIRouter(prefix="/programas", tags=["programas"])


def _leer_programas() -> list[dict]:
    """Lee de Supabase, o devuelve la lista demo si algo falla."""
    try:
        cliente = get_supabase_anon_client()
        resp = cliente.table("programas").select("*").limit(50).execute()
        if resp.data:
            return list(resp.data)
    except Exception:
        pass  # sin internet o sin tabla -> usamos demo
    return PROGRAMAS_DEMO


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
