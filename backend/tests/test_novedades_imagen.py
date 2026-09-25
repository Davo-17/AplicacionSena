"""Pruebas de la portada de novedades (campo imagen + subida protegida)."""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import crear_app
from app.routers.novedades import NovedadIn


def _cliente() -> TestClient:
    return TestClient(crear_app())


def test_upload_y_status_sin_token_da_401_o_403() -> None:
    c = _cliente()
    assert c.get("/api/v1/novedades/status").status_code in (401, 403)
    resp = c.post(
        "/api/v1/novedades/upload",
        files={"archivo": ("portada.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert resp.status_code in (401, 403)


def test_rutas_novedades_en_openapi() -> None:
    spec = _cliente().get("/openapi.json").json()
    assert "/api/v1/novedades/upload" in spec["paths"]
    assert "/api/v1/novedades/status" in spec["paths"]


def test_novedad_acepta_imagen_http_y_rechaza_otra() -> None:
    base = {"titulo": "Convocatoria 2026", "descripcion": "Se abren cupos"}
    assert NovedadIn(**base, imagen="https://x.supabase.co/a.jpg").imagen.endswith(".jpg")
    assert NovedadIn(**base).imagen == ""
    with pytest.raises(ValidationError):
        NovedadIn(**base, imagen="ftp://rara/imagen.jpg")


def test_listar_novedades_mas_recientes_primero() -> None:
    """Lo recién publicado en el admin debe salir en la principal."""
    resp = _cliente().get("/api/v1/novedades")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    fechas = [n.get("created_at", "") for n in items if n.get("created_at")]
    assert fechas == sorted(fechas, reverse=True)
