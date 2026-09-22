import { useCallback, useEffect, useRef, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";
import { TIPOS_EVIDENCIA } from "../data/catalogos";
import { api, type Evidencia, type Ficha } from "../lib/api";
import { useToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import { Card, Field, PrimaryButton, Select, TextArea, TextInput } from "./ui";

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];
const MAX_FOTOS = 4;
const MAX_BYTES = 5 * 1024 * 1024;

export function useFichas(tick: number) {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  useEffect(() => {
    exigirSesion(api.fichas.listar())
      .then(setFichas)
      .catch(() => {});
  }, [tick]);
  return fichas;
}

export default function BitacoraSection({
  fichasTick,
  ficha,
  onFicha,
  log,
  onChanged,
}: {
  fichasTick: number;
  ficha: string;
  onFicha: (f: string) => void;
  log: (t: string) => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const fichas = useFichas(fichasTick);
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState<string>("clase");
  const [desc, setDesc] = useState("");
  const [visible, setVisible] = useState(true);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [items, setItems] = useState<Evidencia[]>([]);
  const [msg, setMsg] = useState("");
  const [avisoStorage, setAvisoStorage] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [porBorrar, setPorBorrar] = useState<Evidencia | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async (numero: string) => {
    if (!numero) {
      setItems([]);
      return;
    }
    try {
      setItems(await exigirSesion(api.evidencias.listar(numero)));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    cargar(ficha);
  }, [ficha, cargar, fichasTick]);

  // Diagnóstico de Storage (igual que el panel anterior).
  useEffect(() => {
    exigirSesion(api.evidencias.status())
      .then((e) => setAvisoStorage(!e.bucket || !e.puede_subir ? `⚠ ${e.detalle}` : ""))
      .catch(() => {});
  }, []);

  function validarYAgregar(nuevos: FileList | File[]) {
    const lista = [...archivos];
    const avisos: string[] = [];
    for (const f of Array.from(nuevos)) {
      if (lista.length >= MAX_FOTOS) {
        avisos.push("Máximo 4 fotos por evidencia.");
        break;
      }
      if (!TIPOS_OK.includes(f.type)) {
        avisos.push(`${f.name}: solo JPG, PNG o WebP.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        avisos.push(`${f.name}: supera los 5 MB.`);
        continue;
      }
      lista.push(f);
    }
    setArchivos(lista);
    if (avisos[0]) toast(avisos[0]);
  }

  function quitar(i: number) {
    setArchivos((a) => a.filter((_, j) => j !== i));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!ficha) {
      setMsg("✕ Elige una ficha primero.");
      return;
    }
    setMsg(archivos.length ? "Subiendo fotos…" : "Guardando…");
    setEnviando(true);
    try {
      const urls: string[] = [];
      for (const f of archivos) {
        const sub = await exigirSesion(api.evidencias.subir(f, ficha));
        urls.push(sub.url);
      }
      await exigirSesion(
        api.evidencias.crear({
          ficha_numero: ficha,
          titulo: titulo.trim(),
          descripcion: desc.trim(),
          fecha: fecha.trim(),
          tipo: (TIPOS_EVIDENCIA as readonly string[]).includes(tipo)
            ? (tipo as Evidencia["tipo"])
            : "clase",
          imagenes: urls,
          visible,
        }),
      );
      setMsg("✓ Guardado en la bitácora.");
      toast("Guardado en la bitácora");
      log("Evidencia guardada");
      onChanged();
      setTitulo("");
      setFecha("");
      setDesc("");
      setTipo("clase");
      setVisible(true);
      setArchivos([]);
      await cargar(ficha);
    } catch (err) {
      setMsg("✕ " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await exigirSesion(api.evidencias.borrar(porBorrar.id));
      setPorBorrar(null);
      toast("Evidencia eliminada");
      log("Evidencia eliminada");
      onChanged();
      await cargar(ficha);
    } catch (err) {
      setMsg("✕ " + (err instanceof Error ? err.message : "Error"));
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16" /><path d="M6 16l9-9 3 3-9 9H6v-3z" /><path d="M14 7l3 3" /></svg>
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-neon">Contenido público</div>
            <h3 className="text-[17px] font-extrabold text-ink">Bitácora por ficha</h3>
            <p className="mt-1 text-[10px] text-muted">
              Elige una ficha y registra qué se hizo: clases, proyectos, fotos y avances. Cada
              entrada puede ser pública o privada.
            </p>
          </div>
        </div>

        {avisoStorage && (
          <p role="status" className="mb-3 rounded-[10px] border border-neon/30 bg-neon/[0.07] px-3 py-2 text-[12px] font-semibold text-neon">
            {avisoStorage}
          </p>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)]">
          <form onSubmit={enviar} className="grid gap-4">
            <Field label="Ficha" required>
              <Select value={ficha} onChange={(e) => onFicha(e.target.value)} required>
                <option value="">Elige una ficha…</option>
                {fichas.map((f) => (
                  <option key={f.id} value={f.numero}>
                    {f.numero} · {f.programa}
                  </option>
                ))}
              </Select>
              <span className="text-[11px] text-muted">
                Todo lo que guardes queda atado a esta ficha, sin mezclarse.
              </span>
            </Field>
            <Field label="¿Qué se hizo?" required>
              <TextInput
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Taller de bases de datos — modelo E-R"
                maxLength={120}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <TextInput
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  placeholder="Ej. 21 Sep, 2026"
                  maxLength={30}
                />
              </Field>
              <Field label="Tipo">
                <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS_EVIDENCIA.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Detalle">
              <TextArea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ej. Practicamos modelo entidad-relación…"
                maxLength={1000}
              />
            </Field>
            <div className="grid gap-2">
              <span className="text-[11px] font-semibold text-ink">Archivos de la evidencia</span>
              <div
                role="button"
                tabIndex={0}
                aria-label="Subir fotos: arrastra archivos o haz clic para explorar"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setArrastrando(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                  if (e.dataTransfer?.files) validarYAgregar(e.dataTransfer.files);
                }}
                className={`cursor-pointer rounded-[14px] border-[1.5px] border-dashed px-5 pb-4 pt-6 text-center transition-all ${
                  arrastrando
                    ? "scale-[1.005] border-neon bg-neon/[0.09] shadow-[0_0_0_4px_rgba(163,230,53,0.12)]"
                    : "border-neon/30 bg-gradient-to-b from-neon/[0.06] to-transparent hover:border-neon hover:bg-neon/[0.05]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files) validarYAgregar(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-[14px] bg-neon/10 text-neon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L7 9m5-5l5 5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                </div>
                <p className="text-[14px] font-semibold text-ink">
                  Arrastra tus fotos aquí o <span className="text-neon underline underline-offset-2">explora archivos</span>
                </p>
                <p className="text-[12px] text-muted">
                  JPG · PNG · WebP — máx. 4 fotos de 5 MB c/u · quedan atadas a la ficha elegida
                </p>
                <p className="mt-2 inline-block rounded-full bg-neon/10 px-3 py-[3px] text-[11px] font-bold text-neon">
                  {archivos.length} / 4 archivos
                </p>
              </div>
              {archivos.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                  {archivos.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="relative overflow-hidden rounded-xl border border-line bg-white/[0.02]">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="block h-[76px] w-full object-cover" />
                      <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-muted">
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {f.name} · {Math.max(1, Math.round(f.size / 1024))} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Quitar ${f.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          quitar(i);
                        }}
                        className="absolute right-1 top-1 grid h-[22px] w-[22px] place-items-center rounded-full bg-black/70 text-[11px] text-white transition-colors hover:bg-danger"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] font-semibold text-ink">
              <span className="relative h-[25px] w-11 flex-none">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  className="absolute z-[2] m-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className={`absolute inset-0 rounded-full transition-colors ${visible ? "bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "bg-[#3a4a40]"}`}
                >
                  <span
                    className={`absolute left-[3px] top-[3px] h-[19px] w-[19px] rounded-full bg-white shadow transition-transform ${visible ? "translate-x-[19px]" : ""}`}
                  />
                </span>
              </span>
              Visible al público
            </label>
            <PrimaryButton type="submit" disabled={enviando} className="w-full disabled:opacity-60">
              {enviando ? "Guardando…" : "Guardar en la bitácora"}
            </PrimaryButton>
          </form>

          <div className="min-w-0">
            {msg && (
              <p role="status" className="mb-2 min-h-[1.2em] text-[13px] text-neon">
                {msg}
              </p>
            )}
            <div className="grid gap-2">
              {ficha && items.length === 0 && (
                <p className="rounded-xl border border-dashed border-line bg-white/[0.02] p-6 text-center text-[13px] text-muted">
                  Aún no hay registros para la ficha {ficha}. Sé el primero en documentar qué se
                  hizo.
                </p>
              )}
              {items.map((e) => (
                <article
                  key={e.id}
                  className="grid gap-2 rounded-xl border border-line bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="min-w-[150px] flex-1 text-[14px] text-ink">{e.titulo}</strong>
                    <span className="rounded-full border border-neon/30 bg-neon/10 px-2 py-[3px] text-[11px] font-bold text-neon">
                      {e.tipo || "clase"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-[3px] text-[11px] font-bold ${
                        e.visible
                          ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#86efac]"
                          : "border-neon/30 bg-neon/10 text-neon"
                      }`}
                    >
                      {e.visible ? "Pública" : "Privada"}
                    </span>
                    <small className="text-[12px] text-muted">· {e.fecha || ""}</small>
                  </div>
                  {e.descripcion && <p className="text-[13px] text-muted">{e.descripcion}</p>}
                  {(e.imagenes || []).length > 0 && (
                    <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                      {(e.imagenes || []).map((u) => (
                        <a key={u} href={u} target="_blank" rel="noopener">
                          <img
                            src={u}
                            alt={e.titulo}
                            loading="lazy"
                            className="block h-[76px] w-full rounded-[10px] border border-line object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPorBorrar(e)}
                      className="rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-[13px] font-semibold text-danger transition-colors hover:border-danger/30 hover:bg-danger/10"
                    >
                      Borrar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <ConfirmModal
        abierto={porBorrar != null}
        titulo="¿Borrar esta entrada de la bitácora?"
        mensaje={`Se eliminará "${porBorrar?.titulo ?? ""}" y sus imágenes.`}
        confirmando={borrando}
        onCancelar={() => setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
      />
    </>
  );
}
