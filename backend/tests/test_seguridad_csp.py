"""La vista previa local del panel usa blob: y el CSP debe permitirla."""

from fastapi.testclient import TestClient

from app.main import crear_app


def _cliente() -> TestClient:
    return TestClient(crear_app())


def test_csp_permite_blob_en_imagenes() -> None:
    csp = _cliente().get("/api/v1/health").headers.get("content-security-policy", "")
    assert "blob:" in csp
    assert "img-src" in csp
