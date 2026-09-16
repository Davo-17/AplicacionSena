"""Pruebas del bot: debe responder a todo visitante, sin login."""

from fastapi.testclient import TestClient

from app.main import crear_app


def _cliente() -> TestClient:
    return TestClient(crear_app())


def _preguntar(texto: str) -> dict:
    resp = _cliente().post("/api/v1/chat", json={"mensaje": texto})
    assert resp.status_code == 200, resp.text
    datos = resp.json()
    assert datos["respuesta"]
    assert isinstance(datos.get("sugerencias", []), list)
    return datos


def test_saludo() -> None:
    datos = _preguntar("Hola, buenas tardes")
    assert "Hola" in datos["respuesta"] or "asistente" in datos["respuesta"].lower()


def test_inscripcion_con_sofia_plus() -> None:
    datos = _preguntar("¿Cómo me inscribo en Sofia Plus?")
    assert "sofia" in datos["respuesta"].lower()


def test_requisitos_y_gratis() -> None:
    assert "gratuita" in _preguntar("¿Es gratis?")["respuesta"].lower()
    assert "14" in _preguntar("¿Qué requisitos piden?")["respuesta"]


def test_programas_y_niveles() -> None:
    assert "ADSO" in _preguntar("Quiero estudiar software ADSO")["respuesta"]
    assert "Técn" in _preguntar("Muéstrame las técnicas")["respuesta"]
    assert "Tecnolog" in _preguntar("Muéstrame las tecnologías")["respuesta"]


def test_novedades_fichas_postulaciones() -> None:
    assert "reciente" in _preguntar("¿Qué novedades hay?")["respuesta"].lower()
    assert "ficha" in _preguntar("¿Qué fichas hay?")["respuesta"].lower()


def test_orientacion_y_fallback() -> None:
    assert "quiz" in _preguntar("No sé qué estudiar, recomiéndame")["respuesta"].lower()
    datos = _preguntar("blablabla xyz")
    assert "programas" in datos["respuesta"].lower()
    assert datos["sugerencias"]


def test_sin_tildes_y_mayusculas() -> None:
    datos = _preguntar("INSCRIPCION y REQUISITOS")
    assert "sofia" in datos["respuesta"].lower() or "requisito" in datos["respuesta"].lower()


def test_sugerencias_publicas() -> None:
    resp = _cliente().get("/api/v1/chat/sugerencias")
    assert resp.status_code == 200
    assert len(resp.json()) >= 3
