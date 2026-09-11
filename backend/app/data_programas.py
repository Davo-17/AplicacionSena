"""Datos de ejemplo para la demo.

Si Supabase está configurado, la API lee de allá.
Si no (o si falla el internet el día de la entrega),
la API usa esta lista para que la página nunca se vea vacía.
"""

PROGRAMAS_DEMO = [
    {
        "id": 1,
        "titulo": "Técnico en Programación de Software",
        "descripcion": "Lógica de programación y bases de datos.",
        "nivel": "tecnica",
        "modalidad": "presencial",
        "jornada": "diurna",
        "url_sofia": "https://oferta.senasofiaplus.edu.co/",
    },
    {
        "id": 2,
        "titulo": "Técnico en Sistemas",
        "descripcion": "Mantenimiento de equipos y redes de cómputo.",
        "nivel": "tecnica",
        "modalidad": "presencial",
        "jornada": "mixta",
        "url_sofia": "https://oferta.senasofiaplus.edu.co/",
    },
    {
        "id": 3,
        "titulo": "Técnico en Contabilización",
        "descripcion": "Operaciones comerciales y financieras.",
        "nivel": "tecnica",
        "modalidad": "virtual",
        "jornada": "24 horas",
        "url_sofia": "https://oferta.senasofiaplus.edu.co/",
    },
    {
        "id": 4,
        "titulo": "Análisis y Desarrollo de Software (ADSO)",
        "descripcion": "Construcción completa de soluciones web y móviles.",
        "nivel": "tecnologia",
        "modalidad": "presencial",
        "jornada": "diurna",
        "url_sofia": "https://oferta.senasofiaplus.edu.co/",
    },
    {
        "id": 5,
        "titulo": "Gestión Empresarial",
        "descripcion": "Administración y coordinación de proyectos corporativos.",
        "nivel": "tecnologia",
        "modalidad": "virtual",
        "jornada": "24 horas",
        "url_sofia": "https://oferta.senasofiaplus.edu.co/",
    },
    {
        "id": 6,
        "titulo": "Diseño y Desarrollo de Redes",
        "descripcion": "Infraestructura, redes y ciberseguridad.",
        "nivel": "tecnologia",
        "modalidad": "presencial",
        "jornada": "nocturna",
        "url_sofia": "https://oferta.senasofiaplus.edu.co/",
    },
]
