"""Pruebas del código por correo (OTP) del segundo paso de login.

Solo validación y rutas protegidas: nunca tocan Supabase real.
"""

from fastapi.testclient import TestClient

from app.main import crear_app
from app.routers.auth import _espera_otp


def _cliente() -> TestClient:
    return TestClient(crear_app())


def test_otp_solicitar_email_externo_da_422() -> None:
    resp = _cliente().post("/api/v1/auth/otp/solicitar", json={"email": "otro@gmail.com"})
    assert resp.status_code == 422


def test_otp_verificar_codigo_malformado_da_422() -> None:
    resp = _cliente().post(
        "/api/v1/auth/otp/verificar",
        json={"email": "a@sena.edu.co", "codigo": "12ab"},
    )
    assert resp.status_code == 422


def test_rutas_otp_en_openapi() -> None:
    spec = _cliente().get("/openapi.json").json()
    assert "/api/v1/auth/otp/solicitar" in spec["paths"]
    assert "/api/v1/auth/otp/verificar" in spec["paths"]


def test_espera_otp_extrae_segundos() -> None:
    assert _espera_otp(Exception("For security purposes, you can only request this after 34 seconds.")) == 34
    assert _espera_otp(Exception("otro error")) is None
