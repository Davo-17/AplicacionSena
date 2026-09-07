# Dajesa Backend

API con FastAPI + Supabase. Auth **Bearer token** (`Authorization: Bearer <token>`).

## Inicio rápido con uv

```bash
cd backend
uv sync
cp .env.example .env  # completar valores
uv run uvicorn app.main:app --reload
```

Docs: http://127.0.0.1:8000/docs — Health: `/api/v1/health`

## Para compañeros sin uv

```bash
uv export --format requirements-txt -o requirements.txt
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Seguridad implementada

- CORS restringido a `ALLOWED_ORIGINS` (sin `*`)
- Cabeceras: CSP, HSTS, X-Frame-Options DENY, nosniff
- Bearer obligatorio, sin cookies auto-enviadas
- Validación Pydantic en todos los endpoints
- Rate limiting con slowapi en auth/crud
- Errores JSON uniformes sin stack traces
- RBAC: `administrador` full, `instructor` lectura + creación propia
