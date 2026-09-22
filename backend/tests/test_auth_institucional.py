"""Candado institucional: solo correos SENA pueden ingresar.

Los aspirantes sin correo institucional van a Betowa.
"""

import pytest
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.main import crear_app
from app.middlewares import rbac
from app.schemas.auth import LoginRequest, es_correo_institucional


def test_dominios_permitidos() -> None:
    assert es_correo_institucional("aprendiz@soy.sena.edu.co")
    assert es_correo_institucional("profe@sena.edu.co")
    assert es_correo_institucional("  PROFE@SENA.EDU.CO  ")
    assert not es_correo_institucional("alguien@gmail.com")
    assert not es_correo_institucional("alguien@hotmail.com")
    assert not es_correo_institucional("falso@soy.sena.edu.co.evil.com")


def test_login_request_acepta_institucional() -> None:
    datos = LoginRequest(email="aprendiz@soy.sena.edu.co", password="clave12345")
    assert datos.email == "aprendiz@soy.sena.edu.co"


def test_login_request_rechaza_externo() -> None:
    with pytest.raises(Exception) as exc:
        LoginRequest(email="alguien@gmail.com", password="clave12345")
    assert "betowa" in str(exc.value).lower()


def test_post_login_externo_da_422_sin_tocar_supabase() -> None:
    """El 422 sale del validador, antes de llamar a Supabase."""
    resp = TestClient(crear_app()).post(
        "/api/v1/auth/login",
        json={"email": "alguien@gmail.com", "password": "clave12345"},
    )
    assert resp.status_code == 422
    assert "betowa" in resp.text.lower()


def test_token_con_email_externo_da_403(monkeypatch: pytest.MonkeyPatch) -> None:
    """Aunque el token sea válido, un dueño no institucional no entra."""
    monkeypatch.setattr(
        rbac._auth_service,
        "verificar_token",
        lambda _token: {"sub": "1", "email": "alguien@gmail.com", "rol": "instructor"},
    )
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        rbac.obtener_usuario_actual(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials="falso")
        )
    assert exc.value.status_code == 403


def test_token_institucional_pasa_el_candado(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        rbac._auth_service,
        "verificar_token",
        lambda _token: {"sub": "1", "email": "profe@sena.edu.co", "rol": "instructor"},
    )
    usuario = rbac.obtener_usuario_actual(
        HTTPAuthorizationCredentials(scheme="Bearer", credentials="falso")
    )
    assert usuario.email == "profe@sena.edu.co"


def test_registro_rechaza_externo_422_sin_tocar_supabase() -> None:
    """El 422 sale del validador, antes de llamar a Supabase."""
    resp = TestClient(crear_app()).post(
        "/api/v1/auth/registro",
        json={"email": "alguien@gmail.com", "password": "clave12345"},
    )
    assert resp.status_code == 422
    assert "betowa" in resp.text.lower()


def test_registro_clave_corta_422() -> None:
    """La clave mínima (8) se valida antes de llamar a Supabase."""
    resp = TestClient(crear_app()).post(
        "/api/v1/auth/registro",
        json={"email": "nuevo@soy.sena.edu.co", "password": "corta"},
    )
    assert resp.status_code == 422


def test_registro_fuerza_rol_aprendiz(monkeypatch: pytest.MonkeyPatch) -> None:
    """El rol sale fijo del servidor: el cliente no puede pedirse admin."""
    from types import SimpleNamespace

    capturado: dict = {}

    class _FakeAuth:
        def sign_up(self, credenciales: dict) -> SimpleNamespace:
            capturado.update(credenciales)
            return SimpleNamespace(
                user=SimpleNamespace(id="u1", email=credenciales["email"]),
                session=None,
            )

    class _FakeClient:
        auth = _FakeAuth()

    import app.routers.auth as auth_router

    monkeypatch.setattr(
        auth_router, "get_supabase_anon_client", lambda: _FakeClient()
    )
    resp = TestClient(crear_app()).post(
        "/api/v1/auth/registro",
        json={"email": "nuevo@soy.sena.edu.co", "password": "clave12345"},
    )
    assert resp.status_code == 201
    assert capturado["options"]["data"]["rol"] == "aprendiz"
    assert resp.json() == {"ok": True, "requiere_confirmacion": True}
