export type Nivel = "Técnico" | "Tecnólogo";

export interface Programa {
  id: number;
  nombre: string;
  codigo: string;
  nivel: Nivel;
  area: string;
  duracion: string;
  modalidad: "Presencial" | "Virtual";
}

export interface Ficha {
  numero: string;
  programa: string;
  jornada: string;
  ocupacion: number; // 0-100, barra de progreso verde
}

export const programas: Programa[] = [
  {
    id: 1,
    nombre: "Técnico en Programación de Software",
    codigo: "228118",
    nivel: "Técnico",
    area: "Tecnologías de la información",
    duracion: "15 meses",
    modalidad: "Presencial",
  },
  {
    id: 2,
    nombre: "Técnico en Sistemas",
    codigo: "228117",
    nivel: "Técnico",
    area: "Sistemas",
    duracion: "15 meses",
    modalidad: "Presencial",
  },
  {
    id: 3,
    nombre: "Técnico en Contabilización",
    codigo: "228121",
    nivel: "Técnico",
    area: "Contabilidad y finanzas",
    duracion: "15 meses",
    modalidad: "Virtual",
  },
  {
    id: 4,
    nombre: "Análisis y Desarrollo de Software (ADSO)",
    codigo: "228120",
    nivel: "Tecnólogo",
    area: "Tecnologías de la información",
    duracion: "27 meses",
    modalidad: "Presencial",
  },
  {
    id: 5,
    nombre: "Gestión Empresarial",
    codigo: "228125",
    nivel: "Tecnólogo",
    area: "Administración",
    duracion: "24 meses",
    modalidad: "Virtual",
  },
  {
    id: 6,
    nombre: "Diseño y Desarrollo de Redes",
    codigo: "228130",
    nivel: "Tecnólogo",
    area: "Infraestructura TI",
    duracion: "24 meses",
    modalidad: "Presencial",
  },
];

export const fichas: Ficha[] = [
  {
    numero: "2981234",
    programa: "Análisis y Desarrollo de Software",
    jornada: "Diurna",
    ocupacion: 82,
  },
  {
    numero: "2981235",
    programa: "Técnico en Sistemas",
    jornada: "Nocturna",
    ocupacion: 64,
  },
  {
    numero: "2981236",
    programa: "Gestión Empresarial",
    jornada: "Mixta",
    ocupacion: 45,
  },
];

export const actividad = [
  { texto: "Panel administrativo listo", tiempo: "Ahora" },
  { texto: "Se sincronizó la oferta con Sofía Plus", tiempo: "Hace 2 h" },
  { texto: "Nueva ficha 2981236 registrada", tiempo: "Ayer" },
];
