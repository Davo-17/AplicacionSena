import { useCallback, useEffect, useMemo, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";
import { TIPOS_EVIDENCIA } from "../data/catalogos";
import { api, type Evidencia, type Ficha } from "../lib/api";
import { useToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import EvidenciaImagenesUploader, { MAX_BYTES, MAX_FOTOS, TIPOS_OK } from "./EvidenciaImagenesUploader";
import { Card, Field, PrimaryButton, Select, TextArea, TextInput } from "./ui";



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

  // Previews uniformes: se generan una vez por archivo y se liberan al cambiar.
  const previews = useMemo(() => archivos.map((f) => URL.createObjectURL(f)), [archivos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

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

  function mover(from: number, to: number) {
    setArchivos((a) => {
      if (to < 0 || to >= a.length) return a;
      const copia = [...a];
      const [f] = copia.splice(from, 1);
      copia.splice(to, 0, f);
      return copia;
    });
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
            <EvidenciaImagenesUploader
              archivos={archivos}
              previews={previews}
              onAgregar={validarYAgregar}
              onQuitar={quitar}
              onMover={mover}
              onError={(m) => setMsg(`✕ ${m}`)}
              deshabilitado={enviando}
            />
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
                      {(e.imagenes || []).map((u, i) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noopener"
                          title={i === 0 ? "Portada en la página principal" : `Foto ${i + 1}`}
                          className="relative block overflow-hidden rounded-[10px] border border-line focus-visible:outline-2 focus-visible:outline-neon"
                        >
                          {/* Marco fijo 4/3: cualquier imagen se recorta igual */}
                          <span className="block aspect-[4/3] w-full overflow-hidden bg-black/20">
                            <img
                              src={u}
                              alt={`${e.titulo} — foto ${i + 1}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </span>
                          {i === 0 && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-neon px-2 py-[2px] text-[10px] font-extrabold text-[#071307]">
                              Portada
                            </span>
                          )}
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
