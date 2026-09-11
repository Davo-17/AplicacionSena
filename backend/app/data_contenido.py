"""Datos de ejemplo para novedades, fichas y postulaciones.

Igual que con programas: si Supabase está listo se lee de allá;
si no, la página muestra estos datos para que la demo nunca se caiga.
"""

NOVEDADES_DEMO = [
    {
        "id": 1,
        "titulo": "Nueva Convocatoria de Formación Virtual 2026",
        "descripcion": "Se abren más de 15,000 cupos en desarrollo de software, IA y gestión empresarial.",
        "fecha": "4 Sep, 2026",
        "etiqueta": "Convocatoria",
    },
    {
        "id": 2,
        "titulo": "Bootcamp Gratuito en Inteligencia Artificial",
        "descripcion": "Aprende las herramientas generativas más demandadas con certificación oficial.",
        "fecha": "2 Sep, 2026",
        "etiqueta": "Nuevo",
    },
    {
        "id": 3,
        "titulo": "Feria Virtual de Empleo e Innovación",
        "descripcion": "Conecta con empresas aliadas que buscan talento técnico y tecnológico del SENA.",
        "fecha": "28 Ago, 2026",
        "etiqueta": "Evento",
    },
]

FICHAS_DEMO = [
    {"id": 1, "numero": "2981234", "programa": "ADSO", "jornada": "Diurna"},
    {"id": 2, "numero": "2981235", "programa": "Gestión Empresarial", "jornada": "Nocturna"},
]

POSTULACIONES_DEMO = [
    {
        "id": 1,
        "titulo": "Curso de Liderazgo",
        "descripcion": "Formación corta en liderazgo y trabajo en equipo para aprendices.",
        "cupos": 40,
        "fecha_cierre": "30 Sep, 2026",
    },
]
