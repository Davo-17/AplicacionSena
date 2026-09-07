"""Pruebas de salud y cabeceras de seguridad."""

from fastapi.testclient import TestClient

from app.main import crear_app


def _cliente() -> TestClient:
    """Crea un cliente de prueba sin necesidad de Supabase real."""
    return TestClient(crear_app())


def test_health_ok() -> None:
    """El endpoint /health responde ok."""
    resp = _cliente().get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_cabeceras_seguridad() -> None:
    """Toda respuesta incluye las cabeceras hardening."""
    resp = _cliente().get("/api/v1/health")
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert "default-src 'self'" in resp.headers["Content-Security-Policy"]
    assert "max-age=31536000" in resp.headers["Strict-Transport-Security"]


def test_auth_sin_token_da_403() -> None:
    """Sin Bearer, las rutas protegidas exigen autenticación."""
    resp = _cliente().get("/api/v1/auth/yo")
    assert resp.status_code in (401, 403)
