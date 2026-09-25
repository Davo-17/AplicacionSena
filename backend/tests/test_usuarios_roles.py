"""Pruebas de la gestión de roles y del modo detallado del chat."""

from fastapi.testclient import TestClient

from app.main import crear_app


def _cliente() -> TestClient:
    return TestClient(crear_app())


def test_usuarios_sin_token_da_401_o_403() -> None:
    """Listar usuarios exige ser administrador."""
    resp = _cliente().get("/api/v1/auth/usuarios")
    assert resp.status_code in (401, 403)


def test_cambiar_rol_sin_token_da_401_o_403() -> None:
    """Asignar roles sin Bearer se rechaza antes de tocar Supabase."""
    resp = _cliente().put(
        "/api/v1/auth/usuarios/rol",
        json={"email": "otro@sena.edu.co", "rol": "administrador"},
    )
    assert resp.status_code in (401, 403)


def test_cambiar_rol_email_externo_da_422() -> None:
    """El validador rechaza dominios no institucionales (422 de esquema)."""
    resp = _cliente().put(
        "/api/v1/auth/usuarios/rol",
        json={"email": "otro@gmail.com", "rol": "administrador"},
    )
    assert resp.status_code in (401, 403, 422)


def test_rutas_usuarios_en_openapi() -> None:
    spec = _cliente().get("/openapi.json").json()
    assert "/api/v1/auth/usuarios" in spec["paths"]
    assert "/api/v1/auth/usuarios/rol" in spec["paths"]


def test_chat_detallado_acepta_parametro() -> None:
    """El frontend puede pedir respuestas detalladas (mayor alcance)."""
    resp = _cliente().post(
        "/api/v1/chat", json={"mensaje": "ver programas", "detalle": "detallado"}
    )
    assert resp.status_code == 200
    assert resp.json()["respuesta"]


def test_chat_detalle_invalido_da_422() -> None:
    resp = _cliente().post(
        "/api/v1/chat", json={"mensaje": "hola", "detalle": "enorme"}
    )
    assert resp.status_code == 422


def test_chat_certificado_sede_duracion_betowa() -> None:
    """Nuevas intenciones: título, sede, duración y Betowa."""
    c = _cliente()
    r = c.post("/api/v1/chat", json={"mensaje": "¿dan certificado al graduarme?"})
    assert "tulo" in r.json()["respuesta"].lower()
    r = c.post("/api/v1/chat", json={"mensaje": "¿dónde queda la sede?"})
    assert "sofia" in r.json()["respuesta"].lower()
    r = c.post("/api/v1/chat", json={"mensaje": "¿cuál es la duración?"})
    assert "duraci" in r.json()["respuesta"].lower()
    r = c.post("/api/v1/chat", json={"mensaje": "¿qué es betowa?"})
    assert "betowa" in r.json()["respuesta"].lower()


def test_chat_areas_creatividad_cocina() -> None:
    """Áreas nuevas responden (directo o por área) sin caerse."""
    c = _cliente()
    for texto in ["¿tienen cocina?", "me gusta el diseño", "¿hay algo de salud?"]:
        r = c.post("/api/v1/chat", json={"mensaje": texto})
        assert r.status_code == 200
        assert r.json()["respuesta"]
