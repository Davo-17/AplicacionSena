"""Rutas del chatbot: responde con reglas simples (sin IA externa).

¿Por qué con reglas y no con IA de pago?
- Funciona sin internet y sin API keys.
- Es fácil de explicar al jurado: "si el mensaje contiene X, respondo Y".
- Para la demo del SENA es suficiente y nunca se cae.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Lo que envía el frontend."""

    mensaje: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    """Lo que devuelve el backend."""

    respuesta: str


def _responder(mensaje: str) -> str:
    """Busca palabras clave y devuelve la respuesta adecuada."""
    texto = mensaje.lower()

    if any(p in texto for p in ["inscrib", "sofia", "registr", "cupo"]):
        return (
            "Te inscribes gratis en Sofia Plus: https://oferta.senasofiaplus.edu.co/ "
            "Busca el programa por nombre y dale a 'Inscribirme'. Si necesitas ayuda, dime qué programa te gusta."
        )
    if any(p in texto for p in ["requisito", "documento", "papeles"]):
        return "Requisitos generales: ser mayor de 14 años, documento de identidad y certificado de estudios según el programa. Todo es gratuito."
    if any(p in texto for p in ["costo", "precio", "pago", "gratis"]):
        return "Toda la formación del SENA es 100% gratuita. Nadie debe cobrarte por inscribirte."
    if any(p in texto for p in ["software", "adso", "programacion", "sistemas"]):
        return "Para software te recomiendo: Técnico en Programación (nivel técnico) o ADSO (nivel tecnológico). Ambos están en la sección Programas."
    if any(p in texto for p in ["hola", "buenas", "ayuda"]):
        return "¡Hola! Soy el asistente SENA Dajesa. Pregúntame por programas, inscripciones, requisitos o costos."
    return (
        "Gracias por tu mensaje. Puedo orientarte sobre programas, inscripciones en Sofia Plus, "
        "requisitos y costos. ¿Qué te interesa?"
    )


@router.post("", response_model=ChatResponse)
def chatear(datos: ChatRequest) -> ChatResponse:
    """Recibe un mensaje y devuelve la respuesta del asistente."""
    return ChatResponse(respuesta=_responder(datos.mensaje))
