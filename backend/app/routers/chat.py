"""Bot SENA Dajesa: orientador 24/7 sin IA externa.

Funciona para cualquier visitante (no pide login) y responde con los
datos reales de la app: programas, novedades, fichas y postulaciones
de Supabase, con fallback a demo si no hay conexión.

Lógica: normalizar texto (minúsculas + sin tildes) -> detectar
intención por palabras clave -> buscar en datos reales -> responder
con texto corto + sugerencias de seguimiento.
"""

import re
import unicodedata

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/chat", tags=["chat"])

SOFIA_URL = "https://oferta.senasofiaplus.edu.co/"
SOFIA_BUSCAR = "https://oferta.senasofiaplus.edu.co/sofia-oferta/buscar-oferta.html"

# ------------------------------------------------------------------
# Modelos (compatibles con el frontend viejo: solo usaba `respuesta`)
# ------------------------------------------------------------------


class ChatRequest(BaseModel):
    """Lo que envía el frontend."""

    mensaje: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    """Respuesta + botones de seguimiento para el frontend nuevo."""

    respuesta: str
    sugerencias: list[str] = Field(default_factory=list)


# ------------------------------------------------------------------
# Datos reales (Supabase con fallback demo, igual que los routers)
# ------------------------------------------------------------------


def _cargar_programas() -> list[dict]:
    """Lee programas de Supabase o demo. Nunca revienta el chat."""
    try:
        from app.config.supabase import get_supabase_anon_client

        resp = get_supabase_anon_client().table("programas").select("*").limit(100).execute()
        if resp.data:
            return [dict(f) for f in resp.data]
    except Exception:
        pass
    try:
        from app.data_programas import PROGRAMAS_DEMO

        return list(PROGRAMAS_DEMO)
    except Exception:
        return []


def _cargar_novedades() -> list[dict]:
    try:
        from app.config.supabase import get_supabase_anon_client

        resp = get_supabase_anon_client().table("novedades").select("*").limit(20).execute()
        if resp.data:
            return list(resp.data)
    except Exception:
        pass
    try:
        from app.data_contenido import NOVEDADES_DEMO

        return list(NOVEDADES_DEMO)
    except Exception:
        return []


def _cargar_fichas() -> list[dict]:
    try:
        from app.config.supabase import get_supabase_anon_client

        resp = get_supabase_anon_client().table("fichas").select("*").limit(50).execute()
        if resp.data:
            return list(resp.data)
    except Exception:
        pass
    try:
        from app.data_contenido import FICHAS_DEMO

        return list(FICHAS_DEMO)
    except Exception:
        return []


def _cargar_postulaciones() -> list[dict]:
    try:
        from app.config.supabase import get_supabase_anon_client

        resp = get_supabase_anon_client().table("postulaciones").select("*").limit(50).execute()
        if resp.data:
            return list(resp.data)
    except Exception:
        pass
    try:
        from app.data_contenido import POSTULACIONES_DEMO

        return list(POSTULACIONES_DEMO)
    except Exception:
        return []


# ------------------------------------------------------------------
# Utilidades de texto
# ------------------------------------------------------------------


def _norm(texto: str) -> str:
    """Minúsculas, sin tildes, espacios colapsados. 'Inscripción' -> 'inscripcion'."""
    texto = texto.lower().strip()
    texto = "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", texto)


def _contiene(texto: str, palabras: list[str]) -> bool:
    return any(p in texto for p in palabras)


def _palabra(texto: str, palabra: str) -> bool:
    """Coincidencia por palabra completa (evita que 'edad' matchee en 'novedades')."""
    return re.search(rf"\b{re.escape(palabra)}\b", texto) is not None


def _titulo(p: dict) -> str:
    return str(p.get("titulo") or p.get("nombre") or p.get("title") or "Programa")


def _nivel_norm(p: dict) -> str:
    n = _norm(str(p.get("nivel") or p.get("nivel_etiqueta") or ""))
    return "tecnologia" if n.startswith("tecnolog") else "tecnica"


def _linea_programa(p: dict) -> str:
    mod = str(p.get("modalidad") or "Presencial").capitalize()
    jor = str(p.get("jornada") or "Diurna").capitalize()
    return f"• {_titulo(p)} ({mod} / {jor})"


SUGERENCIAS_BASE = ["Ver programas", "Inscribirme", "Requisitos", "¿Es gratis?", "Novedades"]


# ------------------------------------------------------------------
# Cerebro del bot
# ------------------------------------------------------------------


def _responder(mensaje: str) -> ChatResponse:
    texto = _norm(mensaje)

    # 0. Muy corto / sin sentido -> pedir aclaración útil
    if len(texto) < 2:
        return ChatResponse(
            respuesta="Cuéntame un poco más: ¿buscas un programa, inscribirte o saber requisitos?",
            sugerencias=SUGERENCIAS_BASE,
        )

    # 1. Saludo
    if _contiene(texto, ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal", "saludos"]):
        return ChatResponse(
            respuesta=(
                "¡Hola! 👋 Soy el asistente SENA Dajesa, disponible 24/7. "
                "Te oriento sobre programas, inscripciones en Sofia Plus, requisitos, costos y novedades. ¿Por dónde empezamos?"
            ),
            sugerencias=SUGERENCIAS_BASE,
        )

    # 2. Despedida
    if _contiene(texto, ["gracias", "muchas gracias", "thanks", "genial", "perfecto"]):
        return ChatResponse(
            respuesta="¡Con gusto! 🎓 Recuerda: toda la formación es gratuita. Si quieres, te recomiendo un programa según tus gustos.",
            sugerencias=["Recomiéndame un programa", "Ver programas", "Adiós"],
        )
    if _contiene(texto, ["adios", "chao", "hasta luego", "nos vemos", "bye"]):
        return ChatResponse(
            respuesta="¡Éxitos en tu formación! 🚀 Quedo atento 24/7 si necesitas algo más.",
            sugerencias=["Ver programas", "Inscribirme"],
        )

    # 3. Ayuda / menú / qué puedes hacer
    if _contiene(texto, ["ayuda", "menu", "que puedes", "que sabes", "opciones", "como funciona"]):
        return ChatResponse(
            respuesta=(
                "Puedo ayudarte con:\n"
                "• Programas técnicos y tecnológicos\n"
                "• Cómo inscribirte en Sofia Plus\n"
                "• Requisitos y costos (todo gratis)\n"
                "• Modalidades y jornadas\n"
                "• Novedades y convocatorias\n"
                "Solo escríbeme en tus palabras."
            ),
            sugerencias=SUGERENCIAS_BASE,
        )

    # 4. Inscripción / Sofia Plus / cupos
    if _contiene(texto, ["inscri", "sofia", "sofiaplus", "registr", "cupo", "matricula", "postular", "inscribirme"]):
        return ChatResponse(
            respuesta=(
                f"Inscribirte es gratis en Sofia Plus: {SOFIA_URL}\n"
                "Pasos: 1) Busca el programa por nombre 2) Dale a 'Inscribirme' "
                "3) Crea tu cuenta o ingresa. Dime qué programa te gusta y te digo cómo buscarlo."
            ),
            sugerencias=["Requisitos", "Ver programas", "¿Es gratis?", "Novedades"],
        )

    # 5. Requisitos / documentos
    if _contiene(texto, ["requisito", "documento", "papeles", "papel", "necesito para", "que piden", "bachiller", "certificado", "icfes"]) or _palabra(texto, "edad"):
        return ChatResponse(
            respuesta=(
                "Requisitos generales: ser mayor de 14 años, documento de identidad vigente "
                "y certificado de estudios según el programa (9° u 11°). Todo es 100% gratuito, "
                "nadie debe cobrarte. ¿Ya tienes un programa en mente?"
            ),
            sugerencias=["Ver programas", "Inscribirme", "¿Es gratis?"],
        )

    # 6. Costos
    if _contiene(texto, ["costo", "precio", "pago", "pagar", "gratis", "gratuito", "cuanto vale", "cuanto cuesta", "valor"]):
        return ChatResponse(
            respuesta=(
                "Toda la formación del SENA es 100% gratuita y sin intermediarios. "
                "Si alguien te cobra por inscribirte, es fraude: hazlo tú mismo en Sofia Plus."
            ),
            sugerencias=["Inscribirme", "Ver programas", "Requisitos"],
        )

    # 7. Orientación / recomendación / quiz
    if _contiene(texto, ["recomienda", "recomendacion", "cual me conviene", "no se que estudiar", "orientacion", "test", "quiz", "cual elegir", "que estudiar"]):
        return ChatResponse(
            respuesta=(
                "¡Te ayudo a elegir! 🎯 En la sección 'Encuentra tu programa ideal' hay un quiz de 3 preguntas. "
                "O dime: ¿te gusta más tecnología, negocios, creatividad o trabajo social? ¿Prefieres nivel técnico o tecnológico?"
            ),
            sugerencias=["Me gusta tecnología", "Me gustan negocios", "Nivel técnico", "Nivel tecnológico"],
        )
    if _contiene(texto, ["me gusta tecnologia", "me gusta la tecnologia", "soy de tecnologia"]):
        programas = [p for p in _cargar_programas() if _nivel_norm(p) == "tecnologia"]
        top = programas[:3] if programas else []
        detalle = "\n".join(_linea_programa(p) for p in top) if top else "• ADSO\n• Diseño y Desarrollo de Redes"
        return ChatResponse(
            respuesta=f"Si te gusta la tecnología, mira estos:\n{detalle}\n¿Quieres inscribirte en alguno?",
            sugerencias=["Inscribirme", "Ver tecnologías", "Nivel técnico"],
        )
    if _contiene(texto, ["me gustan negocios", "me gustan los negocios", "negocios", "administracion", "empresa"]):
        return ChatResponse(
            respuesta="Para negocios te recomiendo: Tecnología en Gestión Empresarial (virtual, 24 horas) y Técnico en Contabilización. ¿Te cuento cómo inscribirte?",
            sugerencias=["Inscribirme", "Requisitos", "Ver programas"],
        )

    # 8. Novedades / noticias / convocatorias
    if _contiene(texto, ["novedad", "noticia", "convocatoria", "evento", "feria", "bootcamp", "noticias"]):
        novedades = _cargar_novedades()
        if novedades:
            lineas = "\n".join(f"• {n.get('titulo', 'Novedad')} ({n.get('fecha', '')})".strip() for n in novedades[:3])
            return ChatResponse(
                respuesta=f"Lo más reciente:\n{lineas}\nLas ves completas en la sección Novedades. ¿Te interesa alguna convocatoria?",
                sugerencias=["Inscribirme", "Ver programas", "Postulaciones"],
            )
        return ChatResponse(
            respuesta="Ahora mismo no veo novedades publicadas, pero las convocatorias 2026 siguen abiertas en Sofia Plus.",
            sugerencias=["Ver programas", "Inscribirme"],
        )

    # 9. Fichas (número de grupo)
    if _contiene(texto, ["ficha", "grupo", "numero de ficha", "codigode ficha"]):
        fichas = _cargar_fichas()
        if fichas:
            lineas = "\n".join(
                f"• Ficha {f.get('numero', '?')} — {f.get('programa', '')} ({f.get('jornada', '')})" for f in fichas[:5]
            )
            return ChatResponse(
                respuesta=f"Fichas registradas:\n{lineas}\nSi buscas una en especial, dime el número.",
                sugerencias=["Ver programas", "Inscribirme"],
            )
        return ChatResponse(
            respuesta="Aún no hay fichas publicadas por el admin. Los programas sí están disponibles para inscripción.",
            sugerencias=["Ver programas", "Inscribirme"],
        )

    # 10. Postulaciones / cursos cortos
    if _contiene(texto, ["postulacion", "curso corto", "liderazgo", "vacante", "oferta laboral", "empleo"]):
        posts = _cargar_postulaciones()
        if posts:
            lineas = "\n".join(
                f"• {p.get('titulo', '')} — {p.get('cupos', '?')} cupos (cierra {p.get('fecha_cierre', '')})"
                for p in posts[:3]
            )
            return ChatResponse(
                respuesta=f"Convocatorias abiertas:\n{lineas}",
                sugerencias=["Inscribirme", "Requisitos"],
            )
        return ChatResponse(
            respuesta="No hay postulaciones abiertas ahora, pero la oferta de programas 2026 sí está disponible.",
            sugerencias=["Ver programas", "Novedades"],
        )

    # 11. Niveles: técnicas / tecnologías
    if _contiene(texto, ["tecnolog", "tecnologo"]):
        programas = [p for p in _cargar_programas() if _nivel_norm(p) == "tecnologia"]
        lineas = "\n".join(_linea_programa(p) for p in programas[:6]) if programas else "• ADSO\n• Gestión Empresarial"
        return ChatResponse(
            respuesta=f"Tecnologías disponibles:\n{lineas}\nToca 'Ver programas' para inscribirte directo en Sofia Plus.",
            sugerencias=["Nivel técnico", "Inscribirme", "Requisitos"],
        )
    if _contiene(texto, ["tecnica", "tecnico", "tecnicas"]):
        programas = [p for p in _cargar_programas() if _nivel_norm(p) == "tecnica"]
        lineas = "\n".join(_linea_programa(p) for p in programas[:6]) if programas else "• Técnico en Programación\n• Técnico en Sistemas"
        return ChatResponse(
            respuesta=f"Técnicas disponibles:\n{lineas}\n¿Te gusta alguna? Te explico la inscripción.",
            sugerencias=["Nivel tecnológico", "Inscribirme", "Requisitos"],
        )

    # 12. Modalidad / jornada
    if _contiene(texto, ["virtual", "presencial", "modalidad", "a distancia"]):
        programas = _cargar_programas()
        tnorm = "virtual" if "virtual" in texto else "presencial"
        filtrados = [p for p in programas if _norm(str(p.get("modalidad", ""))) == tnorm][:5]
        lineas = "\n".join(_linea_programa(p) for p in filtrados) if filtrados else ""
        extra = f"\n{lineas}" if lineas else ""
        return ChatResponse(
            respuesta=(
                f"Tenemos programas {tnorm}es. "
                f"{'Estudia a tu ritmo 24 horas. ' if tnorm == 'virtual' else 'Asistes al centro de formación en tu jornada. '}"
                f"Ejemplos:{extra}\nUsa los filtros de Programas para verlos todos."
            ),
            sugerencias=["Ver programas", "Inscribirme", "Requisitos"],
        )
    if _contiene(texto, ["jornada", "diurna", "nocturna", "mixta", "noche", "mañana", "manana", "horario"]):
        return ChatResponse(
            respuesta=(
                "Jornadas: Diurna (mañana/tarde), Nocturna (noche), Mixta (combina) y 24 horas (virtual, a tu ritmo). "
                "Cada tarjeta de programa indica su jornada. ¿Prefieres alguna?"
            ),
            sugerencias=["Ver programas", "Programas virtuales", "Inscribirme"],
        )
    if _contiene(texto, ["programas virtuales", "ver programas", "lista de programas", "oferta", "catalogo", "cursos disponibles", "que programas"]):
        programas = _cargar_programas()
        lineas = "\n".join(_linea_programa(p) for p in programas[:6]) if programas else ""
        extra = f"\n{lineas}" if lineas else ""
        return ChatResponse(
            respuesta=f"Tenemos {len(programas) or '16+'} programas entre técnicos y tecnológicos.{extra}\nBaja a 'Elige tu programa' y filtra por modalidad o jornada.",
            sugerencias=["Nivel técnico", "Nivel tecnológico", "Inscribirme"],
        )

    # 13. Búsqueda de programa específico por nombre (tolerante)
    programas = _cargar_programas()
    tokens = [t for t in re.findall(r"[a-z0-9]+", texto) if len(t) > 3]
    if tokens and programas:
        mejor, mejor_puntaje = None, 0
        for p in programas:
            nombre_n = _norm(_titulo(p) + " " + str(p.get("descripcion", "")))
            puntaje = sum(1 for t in tokens if t in nombre_n)
            if puntaje > mejor_puntaje:
                mejor, mejor_puntaje = p, puntaje
        if mejor and mejor_puntaje >= 1:
            url = mejor.get("url_sofia") or SOFIA_URL
            return ChatResponse(
                respuesta=(
                    f"{_titulo(mejor)}\n{mejor.get('descripcion', '')}\n"
                    f"Modalidad: {mejor.get('modalidad', 'Presencial')} / Jornada: {mejor.get('jornada', 'Diurna')}.\n"
                    f"Inscríbete aquí: {url}"
                ),
                sugerencias=["Inscribirme", "Requisitos", "Ver programas"],
            )

    # Palabras sueltas de áreas populares (aunque no matcheen exacto)
    if _contiene(texto, ["software", "adso", "programacion", "sistemas", "desarrollo", "redes", "ciberseguridad"]):
        return ChatResponse(
            respuesta=(
                "En tecnología tenemos: Técnico en Programación de Software, Técnico en Sistemas, "
                "ADSO (tecnología) y Diseño y Desarrollo de Redes. Dime cuál te llama y te paso el link de Sofia Plus."
            ),
            sugerencias=["ADSO", "Inscribirme", "Nivel tecnológico"],
        )
    if "adso" in texto:
        return ChatResponse(
            respuesta=(
                "ADSO (Análisis y Desarrollo de Software) es nivel tecnológico, presencial/diurno. "
                f"Inscríbete en: {SOFIA_BUSCAR} buscando 'ADSO'."
            ),
            sugerencias=["Inscribirme", "Requisitos", "Ver tecnologías"],
        )
    if _contiene(texto, ["logistica", "contab", "gestion", "diseno", "diseño", "cocina", "salud", "electric"]):
        return ChatResponse(
            respuesta=(
                "Buen área. Busca esa palabra en el filtro 'Buscar programa' de la sección Programas "
                "y verás las opciones con su botón 'Inscribirme' directo a Sofia Plus."
            ),
            sugerencias=["Ver programas", "Inscribirme"],
        )

    # 14. Ubicación / contacto / horarios de atención
    if _contiene(texto, ["donde", "ubicacion", "direccion", "sede", "contacto", "telefono", "correo", "horario de atencion", "quien eres", "eres humano", "robot"]):
        return ChatResponse(
            respuesta=(
                "Soy el asistente virtual SENA Dajesa 🤖, disponible 24/7 aquí en la página. "
                "Para trámites presenciales acércate a tu centro SENA más cercano o entra a Sofia Plus. ¿Te ayudo con un programa?"
            ),
            sugerencias=SUGERENCIAS_BASE,
        )

    # 15. Fallback inteligente: repite lo que entendió + guía
    return ChatResponse(
        respuesta=(
            "Gracias por tu mensaje. Puedo orientarte sobre programas, inscripciones en Sofia Plus, "
            "requisitos, costos (todo gratis), modalidades y novedades. Prueba con: 'quiero estudiar software' o 'cómo me inscribo'."
        ),
        sugerencias=SUGERENCIAS_BASE,
    )


@router.post("", response_model=ChatResponse)
def chatear(datos: ChatRequest) -> ChatResponse:
    """Recibe un mensaje de cualquier visitante y devuelve la respuesta."""
    return _responder(datos.mensaje.strip())


@router.get("/sugerencias", response_model=list[str])
def sugerencias() -> list[str]:
    """Botones rápidos para el frontend (chips bajo el chat)."""
    return SUGERENCIAS_BASE
