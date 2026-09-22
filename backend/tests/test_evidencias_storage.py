"""Pruebas del diagnóstico y la protección de la subida de evidencias."""

from fastapi.testclient import TestClient

from app.main import crear_app


def _cliente() -> TestClient:
    """Crea un cliente de prueba sin necesidad de Supabase real."""
    return TestClient(crear_app())


def test_status_sin_token_da_401_o_403() -> None:
    """El diagnóstico de Storage exige ser administrador."""
    resp = _cliente().get("/api/v1/evidencias/status")
    assert resp.status_code in (401, 403)


def test_upload_sin_token_da_401_o_403() -> None:
    """Subir imágenes sin Bearer se rechaza antes de tocar Storage."""
    resp = _cliente().post(
        "/api/v1/evidencias/upload",
        files={"archivo": ("foto.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert resp.status_code in (401, 403)


def test_status_existe_en_openapi() -> None:
    """La ruta de diagnóstico quedó registrada."""
    spec = _cliente().get("/openapi.json").json()
    assert "/api/v1/evidencias/status" in spec["paths"]
