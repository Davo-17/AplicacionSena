import { useEffect, useState } from "react";
import type { Programa, ProgramaIn } from "../lib/api";
import { nivelNorm } from "../lib/api";
import { AREAS, JORNADAS, MODALIDADES } from "../data/catalogos";
import { cn } from "../lib/cn";
import { Field, Select, TextArea, TextInput } from "./ui";

const VACIO: ProgramaIn = {
  nombre: "",
  codigo: "",
  duracion: "",
  nivel: "Técnico",
  area: "",
  descripcion: "",
  competencias: [],
  modalidad: "Presencial",
  titulacion: "",
  jornada: "diurna",
  url_sofia: "https://oferta.senasofiaplus.edu.co/",
};

export default function ProgramModal({
  abierto,
  programa,
  guardando,
  error,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean;
  programa: Programa | null;
  guardando: boolean;
  error: string;
  onCerrar: () => void;
  onGuardar: (datos: ProgramaIn) => Promise<void>;
}) {
  const [form, setForm] = useState<ProgramaIn>(VACIO);
  const [skill, setSkill] = useState("");
  const [errNombre, setErrNombre] = useState("");

  useEffect(() => {
    if (!abierto) return;
    if (programa) {
      setForm({
        nombre: programa.nombre || (programa as { titulo?: string }).titulo || "",
        codigo: programa.codigo || "",
        duracion: programa.duracion || "",
        nivel: nivelNorm(programa) === "tecnologia" ? "Tecnólogo" : "Técnico",
        area: programa.area || "",
        descripcion: programa.descripcion || "",
        competencias: Array.isArray(programa.competencias) ? [...programa.competencias] : [],
        modalidad: programa.modalidad || "Presencial",
        titulacion: programa.titulacion || "",
        jornada: programa.jornada || "diurna",
        url_sofia: programa.url_sofia || "https://oferta.senasofiaplus.edu.co/",
      });
    } else {
      setForm(VACIO);
    }
    setSkill("");
    setErrNombre("");
  }, [abierto, programa]);

  if (!abierto) return null;

  const set = <K extends keyof ProgramaIn>(k: K, v: ProgramaIn[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function agregarSkill() {
    const v = skill.trim();
    if (v && !form.competencias.includes(v) && form.competencias.length < 20) {
      set("competencias", [...form.competencias, v]);
    }
    setSkill("");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (form.nombre.trim().length < 3) {
      setErrNombre("Nombre requerido (mín. 3 letras).");
      return;
    }
    setErrNombre("");
    await onGuardar({ ...form, nombre: form.nombre.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalProgTitulo"
    >
      <div className="anim-enter max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-[20px] border border-line bg-panel shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-line bg-panel px-6 py-4">
          <h3 id="modalProgTitulo" className="text-[17px] font-bold text-ink">
            {programa ? "Editar programa" : "Nuevo programa"}
          </h3>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid h-[34px] w-[34px] place-items-center rounded-full bg-white/5 text-muted transition-colors hover:bg-danger/15 hover:text-danger"
          >
            ✕
          </button>
        </div>
        <form onSubmit={enviar} className="grid gap-4 p-6">
          <Field label="Nivel de formación">
            <div className="flex gap-2">
              {(["Técnico", "Tecnólogo"] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("nivel", n)}
                  className={cn(
                    "flex-1 rounded-[10px] border-2 px-3 py-[10px] text-[14px] font-semibold transition-all",
                    form.nivel === n
                      ? "border-neon bg-neon/10 text-neon shadow-[0_0_14px_rgba(163,230,53,0.15)]"
                      : "border-line bg-inputbg text-muted hover:border-neon/40",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Nombre del programa" required>
              <TextInput
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej. Técnica en Sistemas"
                maxLength={120}
                className={errNombre ? "border-danger" : undefined}
              />
              {errNombre && <span className="text-[12px] text-danger">{errNombre}</span>}
            </Field>
            <Field label="Código SENA">
              <TextInput
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
                placeholder="Ej. 228118"
                maxLength={20}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Área de conocimiento">
              <Select value={form.area} onChange={(e) => set("area", e.target.value)}>
                <option value="">Selecciona un área</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duración">
              <TextInput
                value={form.duracion}
                onChange={(e) => set("duracion", e.target.value)}
                placeholder="Ej. 12 meses · 2.200 horas"
                maxLength={30}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Field label="Modalidad">
              <Select value={form.modalidad} onChange={(e) => set("modalidad", e.target.value)}>
                {MODALIDADES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="Jornada">
              <Select value={form.jornada} onChange={(e) => set("jornada", e.target.value)}>
                {JORNADAS.map((j) => (
                  <option key={j} value={j}>
                    {j.charAt(0).toUpperCase() + j.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Titulación">
            <TextInput
              value={form.titulacion}
              onChange={(e) => set("titulacion", e.target.value)}
              placeholder="Ej. Técnico en Sistemas"
              maxLength={120}
            />
          </Field>
          <Field label="Descripción del programa">
            <TextArea
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              placeholder="Ej. Forma técnicos capaces de mantener equipos, redes y software…"
              maxLength={1000}
            />
          </Field>
          <Field label="Competencias clave">
            <div className="flex gap-2">
              <TextInput
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarSkill();
                  }
                }}
                placeholder="Ej. Mantenimiento de equipos + Enter"
                maxLength={60}
              />
              <button
                type="button"
                onClick={agregarSkill}
                aria-label="Agregar competencia"
                className="w-11 flex-none rounded-[10px] bg-neon text-[20px] font-bold text-[#071307]"
              >
                +
              </button>
            </div>
            {form.competencias.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.competencias.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 py-1 pl-3 pr-1 text-[12px] font-semibold text-neon"
                  >
                    {s}
                    <button
                      type="button"
                      aria-label={`Quitar ${s}`}
                      onClick={() =>
                        set(
                          "competencias",
                          form.competencias.filter((x) => x !== s),
                        )
                      }
                      className="rounded-full px-1.5 hover:text-danger"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>
          <Field label="Enlace Sofía Plus">
            <TextInput
              value={form.url_sofia}
              onChange={(e) => set("url_sofia", e.target.value)}
              placeholder="https://oferta.senasofiaplus.edu.co/…"
              maxLength={300}
            />
          </Field>
          {error && (
            <p role="alert" className="text-[12px] font-semibold text-danger">
              ✕ {error}
            </p>
          )}
          <div className="sticky bottom-0 flex gap-3 border-t border-line bg-panel py-4">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-[10px] border border-line bg-transparent px-3 py-3 text-[14px] font-bold text-muted transition-colors hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-[10px] bg-neon px-3 py-3 text-[14px] font-bold text-[#071307] transition-all hover:-translate-y-px disabled:opacity-60"
            >
              {guardando ? "Guardando…" : programa ? "Guardar cambios" : "Crear programa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
