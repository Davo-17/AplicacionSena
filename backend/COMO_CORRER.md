# Cómo correr la app (sin uv, solo pip)

Solo necesitas Python 3.11+ y 2 terminales. O incluso 1, porque
el backend ya sirve el frontend en el mismo puerto.

## 1. Crear y activar el entorno (solo la primera vez)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # y completa tus valores de Supabase
```

## 2. Arrancar todo (1 solo comando)

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

Abre en el navegador:

- App completa: http://127.0.0.1:8000/
- Documentación: http://127.0.0.1:8000/docs
- Salud: http://127.0.0.1:8000/api/v1/health

## 3. Probar que todo anda

```bash
curl http://127.0.0.1:8000/api/v1/health
curl http://127.0.0.1:8000/api/v1/programas
curl -X POST http://127.0.0.1:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"cómo me inscribo?"}'
python -m pytest tests/ -q
```

## Qué explica cada parte (para la entrega del miércoles)

- `app/main.py` → crea la app en 3 pasos: app, seguridad, rutas + frontend.
- `app/routers/health.py` → dice "estoy vivo" (los jurados lo aman).
- `app/routers/auth.py` → login con Supabase, devuelve token Bearer.
- `app/routers/programas.py` → lista de programas (Supabase o demo si no hay internet).
- `app/routers/chat.py` → chatbot con reglas simples, sin IA de pago.
- `app/data_programas.py` → datos de respaldo para que la demo nunca se caiga.
- `frontend/js/config.js` → decide dónde está la API.
- `frontend/js/script.js` → login, programas, filtros, quiz, chat y tema.
