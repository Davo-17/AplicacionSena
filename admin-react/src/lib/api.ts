/* Cliente HTTP espejo del panel anterior (frontend/js/admin.js + config.js). */

const API_URL =
  /^800\d$/.test(window.location.port)
    ? `${window.location.origin}/api/v1`
    : "http://127.0.0.1:8000/api/v1";

export const TOKEN_KEY = "access_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export class AuthExpiredError extends Error {}

/** fetch con Bearer; 401/403 => AuthExpiredError (el panel anterior cerraba sesión). */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init.body && typeof init.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(API_URL + path, { ...init, headers });
  if (res.status === 401 || res.status === 403) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
    throw new AuthExpiredError("Sesión expirada o sin permiso");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ===== Tipos (mismos campos que valida el backend) ===== */

export interface Usuario {
  id: string;
  email: string;
  rol: string;
}

export interface Programa {
  id: number;
  nombre: string;
  codigo: string;
  duracion: string;
  nivel: string; // "tecnica" | "tecnologia" (normalizado) o "Técnico" | "Tecnólogo"
  nivel_etiqueta?: string;
  area: string;
  descripcion: string;
  competencias: string[];
  modalidad: string;
  titulacion: string;
  jornada: string;
  url_sofia: string;
  titulo?: string;
}

export interface ProgramaIn {
  nombre: string;
  codigo: string;
  duracion: string;
  nivel: "Técnico" | "Tecnólogo";
  area: string;
  descripcion: string;
  competencias: string[];
  modalidad: string;
  titulacion: string;
  jornada: string;
  url_sofia: string;
}

export interface Novedad {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  etiqueta: string;
  imagen: string;
}
export type NovedadIn = Omit<Novedad, "id">;

export interface Ficha {
  id: number;
  numero: string;
  programa: string;
  jornada: string;
}
export type FichaIn = Omit<Ficha, "id">;

export interface Postulacion {
  id: number;
  titulo: string;
  descripcion: string;
  cupos: number;
  fecha_cierre: string;
}
export type PostulacionIn = Omit<Postulacion, "id">;

export interface Evidencia {
  id: number;
  ficha_numero: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  tipo: "clase" | "proyecto" | "salida" | "logro" | "otro";
  imagenes: string[];
  visible: boolean;
}
export type EvidenciaIn = Omit<Evidencia, "id">;

export interface StorageStatus {
  bucket: boolean;
  puede_subir: boolean;
  detalle: string;
}

export interface UsuarioGestion {
  id: string;
  email: string;
  rol: string;
}

/* ===== Auth ===== */

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(API_URL + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Credenciales inválidas");
  }
  const data = await res.json();
  const token = data.access_token as string;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* noop */
  }
  return token;
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export const getYo = () => apiFetch<Usuario>("/auth/yo");

/* ===== CRUD genérico ===== */

async function listar<T>(recurso: string): Promise<T[]> {
  return apiFetch<T[]>(`/${recurso}`);
}

async function crear<T, In>(recurso: string, datos: In): Promise<T> {
  return apiFetch<T>(`/${recurso}`, { method: "POST", body: JSON.stringify(datos) });
}

async function editar<T, In>(recurso: string, id: number | string, datos: In): Promise<T> {
  return apiFetch<T>(`/${recurso}/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

async function borrar(recurso: string, id: number | string): Promise<void> {
  await apiFetch(`/${recurso}/${id}`, { method: "DELETE" });
}

export const api = {
  programas: {
    listar: () => listar<Programa>("programas"),
    crear: (d: ProgramaIn) => crear<Programa, ProgramaIn>("programas", d),
    editar: (id: number, d: ProgramaIn) => editar<Programa, ProgramaIn>("programas", id, d),
    borrar: (id: number) => borrar("programas", id),
  },
  novedades: {
    listar: () => listar<Novedad>("novedades"),
    crear: (d: NovedadIn) => crear<Novedad, NovedadIn>("novedades", d),
    editar: (id: number, d: NovedadIn) => editar<Novedad, NovedadIn>("novedades", id, d),
    borrar: (id: number) => borrar("novedades", id),
    status: () => apiFetch<StorageStatus>("/novedades/status"),
    subir: async (archivo: File): Promise<{ url: string; ruta: string }> => {
      const form = new FormData();
      form.append("archivo", archivo);
      return apiFetch<{ url: string; ruta: string }>("/novedades/upload", {
        method: "POST",
        body: form,
      });
    },
  },
  fichas: {
    listar: () => listar<Ficha>("fichas"),
    crear: (d: FichaIn) => crear<Ficha, FichaIn>("fichas", d),
    editar: (id: number, d: FichaIn) => editar<Ficha, FichaIn>("fichas", id, d),
    borrar: (id: number) => borrar("fichas", id),
  },
  postulaciones: {
    listar: () => listar<Postulacion>("postulaciones"),
    crear: (d: PostulacionIn) => crear<Postulacion, PostulacionIn>("postulaciones", d),
    editar: (id: number, d: PostulacionIn) =>
      editar<Postulacion, PostulacionIn>("postulaciones", id, d),
    borrar: (id: number) => borrar("postulaciones", id),
  },
  evidencias: {    listar: (ficha: string) =>
      apiFetch<Evidencia[]>(`/evidencias?ficha=${encodeURIComponent(ficha)}`),
    crear: (d: EvidenciaIn) => crear<Evidencia, EvidenciaIn>("evidencias", d),
    borrar: (id: number) => borrar("evidencias", id),
    status: () => apiFetch<StorageStatus>("/evidencias/status"),
    subir: async (archivo: File, fichaNumero: string): Promise<{ url: string; ruta: string }> => {
      const form = new FormData();
      form.append("archivo", archivo);
      // Sin Content-Type JSON: el navegador pone el boundary multipart (igual que antes).
      return apiFetch<{ url: string; ruta: string }>(
        `/evidencias/upload?ficha_numero=${encodeURIComponent(fichaNumero)}`,
        { method: "POST", body: form },
      );
    },
  },
  usuarios: {
    listar: () => apiFetch<UsuarioGestion[]>("/auth/usuarios"),
    cambiarRol: (email: string, rol: string) =>
      apiFetch<{ ok: boolean; email: string; rol: string }>("/auth/usuarios/rol", {
        method: "PUT",
        body: JSON.stringify({ email, rol }),
      }),
  },
};

export function nivelNorm(p: { nivel?: string }): "tecnica" | "tecnologia" {
  return String(p.nivel || "")
    .toLowerCase()
    .startsWith("tecnolog")
    ? "tecnologia"
    : "tecnica";
}
