export interface Program {
  id: string;
  name: string;
  code: string;
  duration: string;
  level: "Técnico" | "Tecnólogo";
  area: string;
  description: string;
  skills: string[];
  modalidad: string;
  titulacion: string;
}

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "t1",
    name: "Técnica en Sistemas",
    code: "228118",
    duration: "12 meses",
    level: "Técnico",
    area: "Tecnología de la Información y las Comunicaciones",
    description: "Forma competencias para instalar, mantener y dar soporte a equipos de cómputo, redes y software, garantizando el funcionamiento de la infraestructura tecnológica en organizaciones.",
    skills: ["Mantenimiento de hardware", "Redes de datos", "Soporte técnico", "Instalación de software", "Seguridad informática básica"],
    modalidad: "Presencial / Virtual",
    titulacion: "Técnico en Sistemas",
  },
  {
    id: "t2",
    name: "Técnica en Contabilización de Operaciones Comerciales",
    code: "134207",
    duration: "10 meses",
    level: "Técnico",
    area: "Finanzas y Administración",
    description: "Prepara para registrar, verificar y controlar las operaciones contables y financieras de una empresa, aplicando las normas de contabilidad vigentes.",
    skills: ["Contabilidad básica", "Facturación electrónica", "Nómina", "Impuestos básicos", "Excel financiero"],
    modalidad: "Presencial",
    titulacion: "Técnico en Contabilización de Operaciones Comerciales",
  },
  {
    id: "t3",
    name: "Técnica en Cocina",
    code: "93400",
    duration: "11 meses",
    level: "Técnico",
    area: "Industria de la Alimentación",
    description: "Desarrolla habilidades para preparar, presentar y conservar alimentos con estándares de calidad e higiene, aplicando técnicas culinarias nacionales e internacionales.",
    skills: ["Técnicas culinarias", "Pastelería básica", "Inocuidad alimentaria", "Servicio al cliente", "Cocina colombiana"],
    modalidad: "Presencial",
    titulacion: "Técnico en Cocina",
  },
  {
    id: "t4",
    name: "Técnica en Atención Integral a la Primera Infancia",
    code: "1012891",
    duration: "12 meses",
    level: "Técnico",
    area: "Educación",
    description: "Forma para acompañar el desarrollo integral de niñas y niños de 0 a 6 años en contextos educativos, familiares y comunitarios con enfoque diferencial e inclusivo.",
    skills: ["Desarrollo infantil", "Estimulación temprana", "Nutrición infantil", "Expresión artística", "Protección a la infancia"],
    modalidad: "Presencial / A distancia",
    titulacion: "Técnico en Atención Integral a la Primera Infancia",
  },
  {
    id: "t5",
    name: "Técnica en Servicios de Restaurante y Bar",
    code: "93401",
    duration: "10 meses",
    level: "Técnico",
    area: "Turismo, Hotelería y Restauración",
    description: "Capacita para prestar servicios de atención al cliente en restaurantes, hoteles y bares, con manejo de montaje de mesas, servicio de bebidas y protocolo de servicio.",
    skills: ["Montaje y servicio", "Coctelería básica", "Protocolo de mesa", "Atención al cliente", "Vinos y maridajes"],
    modalidad: "Presencial",
    titulacion: "Técnico en Servicios de Restaurante y Bar",
  },
  {
    id: "t6",
    name: "Técnica en Electricidad",
    code: "836103",
    duration: "12 meses",
    level: "Técnico",
    area: "Electricidad y Energía",
    description: "Forma para instalar, reparar y mantener sistemas eléctricos residenciales e industriales, cumpliendo el Reglamento Técnico de Instalaciones Eléctricas (RETIE).",
    skills: ["Instalaciones eléctricas residenciales", "Circuitos eléctricos", "RETIE", "Seguridad eléctrica", "Automatización básica"],
    modalidad: "Presencial",
    titulacion: "Técnico en Electricidad",
  },
  {
    id: "t7",
    name: "Técnica en Mecánica Automotriz",
    code: "961900",
    duration: "12 meses",
    level: "Técnico",
    area: "Mecánica",
    description: "Capacita para diagnosticar, mantener y reparar sistemas del vehículo automotor, aplicando normas de calidad y seguridad.",
    skills: ["Diagnóstico automotriz", "Sistema de frenos", "Motor a gasolina y diésel", "Electrónica automotriz básica", "Mantenimiento preventivo"],
    modalidad: "Presencial",
    titulacion: "Técnico en Mecánica Automotriz",
  },
  {
    id: "t8",
    name: "Técnica en Trabajo Social Comunitario",
    code: "1012893",
    duration: "10 meses",
    level: "Técnico",
    area: "Trabajo Social y Desarrollo Comunitario",
    description: "Prepara para apoyar procesos de organización, diagnóstico e intervención social en comunidades, articulando estrategias de participación ciudadana y gestión social.",
    skills: ["Diagnóstico comunitario", "Gestión de proyectos sociales", "Liderazgo comunitario", "Formulación de proyectos", "Derechos humanos"],
    modalidad: "Presencial / A distancia",
    titulacion: "Técnico en Trabajo Social Comunitario",
  },
  {
    id: "tec1",
    name: "Tecnología en Análisis y Desarrollo de Software",
    code: "228119",
    duration: "24 meses",
    level: "Tecnólogo",
    area: "Tecnología de la Información y las Comunicaciones",
    description: "Forma para diseñar, desarrollar, implementar y documentar software bajo metodologías ágiles, aplicando programación orientada a objetos, bases de datos y despliegue en la nube.",
    skills: ["Programación orientada a objetos", "Bases de datos relacionales", "Desarrollo web", "Metodologías ágiles (Scrum)", "Git y control de versiones"],
    modalidad: "Presencial / Virtual",
    titulacion: "Tecnólogo en Análisis y Desarrollo de Software",
  },
  {
    id: "tec2",
    name: "Tecnología en Gestión Empresarial",
    code: "621202",
    duration: "22 meses",
    level: "Tecnólogo",
    area: "Finanzas y Administración",
    description: "Capacita para planear, organizar, dirigir y controlar los procesos administrativos y financieros de una organización, aplicando modelos de gestión modernos.",
    skills: ["Gestión de procesos", "Presupuestación", "Análisis financiero", "Talento humano", "Indicadores de gestión (KPIs)"],
    modalidad: "Presencial / A distancia",
    titulacion: "Tecnólogo en Gestión Empresarial",
  },
  {
    id: "tec3",
    name: "Tecnología en Gestión de Redes de Datos",
    code: "228124",
    duration: "24 meses",
    level: "Tecnólogo",
    area: "Tecnología de la Información y las Comunicaciones",
    description: "Forma para diseñar, instalar, configurar, administrar y mantener redes de datos de área local y extensa, con énfasis en seguridad, virtualización y servicios en la nube.",
    skills: ["Enrutamiento y conmutación (CCNA)", "Seguridad perimetral", "Virtualización de servidores", "Telecomunicaciones", "Cloud computing"],
    modalidad: "Presencial",
    titulacion: "Tecnólogo en Gestión de Redes de Datos",
  },
  {
    id: "tec4",
    name: "Tecnología en Contabilidad y Finanzas",
    code: "134211",
    duration: "22 meses",
    level: "Tecnólogo",
    area: "Finanzas y Administración",
    description: "Prepara para aplicar las Normas Internacionales de Información Financiera (NIIF), elaborar estados financieros, realizar auditorías internas y asesorar en temas tributarios.",
    skills: ["NIIF/IFRS", "Estados financieros", "Declaración de impuestos", "Auditoría interna", "Software contable (Siigo, Contapyme)"],
    modalidad: "Presencial / Virtual",
    titulacion: "Tecnólogo en Contabilidad y Finanzas",
  },
  {
    id: "tec5",
    name: "Tecnología en Producción Audiovisual",
    code: "921203",
    duration: "24 meses",
    level: "Tecnólogo",
    area: "Comunicación, Arte y Diseño",
    description: "Forma para planificar, producir, editar y difundir contenidos audiovisuales en medios digitales y tradicionales, integrando herramientas de animación y narrativa visual.",
    skills: ["Producción de video", "Edición (Premiere Pro, DaVinci)", "Fotografía digital", "Motion graphics", "Transmedia y redes sociales"],
    modalidad: "Presencial",
    titulacion: "Tecnólogo en Producción Audiovisual",
  },
  {
    id: "tec6",
    name: "Tecnología en Gestión del Talento Humano",
    code: "134210",
    duration: "22 meses",
    level: "Tecnólogo",
    area: "Gestión del Talento Humano",
    description: "Capacita para gestionar los procesos de selección, contratación, formación, evaluación y bienestar del personal, cumpliendo la normativa laboral colombiana.",
    skills: ["Selección y reclutamiento", "Nómina y seguridad social", "Clima organizacional", "Capacitación y desarrollo", "Legislación laboral colombiana"],
    modalidad: "Presencial / A distancia",
    titulacion: "Tecnólogo en Gestión del Talento Humano",
  },
  {
    id: "tec7",
    name: "Tecnología en Construcción de Obras Civiles",
    code: "331401",
    duration: "24 meses",
    level: "Tecnólogo",
    area: "Construcción e Infraestructura",
    description: "Forma para supervisar, controlar y ejecutar obras civiles de construcción, aplicando cálculo estructural, topografía y normas NSR.",
    skills: ["Lectura de planos", "Topografía", "Estructuras de concreto", "Presupuestos de obra", "NSR-10 y normas de sismo-resistencia"],
    modalidad: "Presencial",
    titulacion: "Tecnólogo en Construcción de Obras Civiles",
  },
  {
    id: "tec8",
    name: "Tecnología en Logística",
    code: "210201",
    duration: "22 meses",
    level: "Tecnólogo",
    area: "Comercio, Marketing y Logística",
    description: "Prepara para gestionar cadenas de suministro, almacenamiento, distribución y transporte de mercancías, optimizando costos y aplicando sistemas de información logísticos.",
    skills: ["Gestión de inventarios", "Cadena de suministro", "Transporte y distribución", "Comercio exterior", "WMS y ERP logístico"],
    modalidad: "Presencial / Virtual",
    titulacion: "Tecnólogo en Logística",
  },
];

export function loadPrograms(): Program[] {
  try {
    const stored = localStorage.getItem("sena_programs");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_PROGRAMS;
}

export function savePrograms(programs: Program[]): void {
  localStorage.setItem("sena_programs", JSON.stringify(programs));
}
