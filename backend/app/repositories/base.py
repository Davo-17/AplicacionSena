"""Capa de acceso a datos: única que habla con Supabase."""

from typing import Any

from supabase import Client


class BaseRepository:
    """Operaciones CRUD genéricas sobre una tabla de Supabase."""

    def __init__(self, client: Client, tabla: str) -> None:
        """Guarda el cliente y el nombre de la tabla a operar."""
        self._client = client
        self._tabla = tabla

    def listar(self, limite: int = 50) -> list[dict[str, Any]]:
        """Lista filas con límite para evitar lecturas masivas."""
        resp = self._client.table(self._tabla).select("*").limit(limite).execute()
        return list(resp.data or [])

    def crear(self, datos: dict[str, Any]) -> dict[str, Any]:
        """Inserta una fila y retorna el registro creado."""
        resp = self._client.table(self._tabla).insert(datos).execute()
        filas = list(resp.data or [])
        return filas[0] if filas else {}
