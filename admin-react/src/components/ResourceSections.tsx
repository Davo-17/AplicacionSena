import { useEffect, useMemo, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { api, type Ficha, type Novedad, type Postulacion } from "../lib/api";
import { useToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import CrudSection, { type FormValues, ItemActions } from "./CrudSection";
import NovedadImagenUploader from "./NovedadImagenUploader";

const ICON_NOV = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4V5z" /><path d="M8 9h8M8 12h5" /></svg>
);
const ICON_POS = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4-8 4-8-4 8-4z" /><path d="M4 11l8 4 8-4M4 15l8 4 8-4" /></svg>
);
const ICON_FIC = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
);

function desplazarA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function NovedadesSection({ log }: { log: (t: string) => void }) {
  const col = useCollection(api.novedades);
  const toast = useToast();
  const [values, setValues] = useState<FormValues>({});
  const [msg, setMsg] = useState("");
  const [porBorrar, setPorBorrar] = useState<Novedad | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [imagenActual, setImagenActual] = useState("");
  const [avisoStorage, setAvisoStorage] = useState("");

  const imagenPreview = useMemo(
    () => (imagenArchivo ? URL.createObjectURL(imagenArchivo) : ""),
    [imagenArchivo],
  );
  useEffect(() => () => {
    if (imagenPreview) URL.revokeObjectURL(imagenPreview);
  }, [imagenPreview]);

  useEffect(() => {
    exigirSesion(api.novedades.status())
      .then((e) => setAvisoStorage(!e.bucket || !e.puede_subir ? `⚠ ${e.detalle}` : ""))
      .catch(() => {});
  }, []);

  function limpiarImagen() {
    setImagenArchivo(null);
    setImagenActual("");
  }

  async function submit() {
    setMsg(imagenArchivo ? "Subiendo portada…" : "Guardando…");
    try {
      const eraEdicion = col.editingId != null;
      let imagenUrl = imagenActual;
      if (imagenArchivo) {
        const sub = await exigirSesion(api.novedades.subir(imagenArchivo));
        imagenUrl = sub.url;
      }
      await col.guardar({
        titulo: (values.titulo || "").trim(),
        descripcion: (values.descripcion || "").trim(),
        fecha: (values.fecha || "").trim(),
        etiqueta: (values.etiqueta || "").trim() || "Noticia",
        imagen: imagenUrl,
      });
      setValues({});
      limpiarImagen();
      setMsg(eraEdicion ? "✓ Novedad actualizada." : "✓ Novedad publicada.");
      toast(eraEdicion ? "Novedad actualizada" : "Novedad publicada");
      log(eraEdicion ? "Novedad actualizada" : "Novedad publicada");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
    }
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await col.borrarUno(porBorrar.id);
      setPorBorrar(null);
      setMsg("✓ Novedad eliminada.");
      toast("Novedad eliminada");
      log("Novedad eliminada");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <CrudSection<Novedad>
        id="sec-novedades"
        icon={ICON_NOV}
        title="Novedades de la semana"
        sub="Convocatorias, eventos y noticias destacadas."
        fields={[
          { key: "titulo", label: "Título", required: true, placeholder: "Ej. Nueva convocatoria virtual 2026 — 15.000 cupos", maxLength: 120 },
          { key: "etiqueta", label: "Etiqueta", placeholder: "Ej. Convocatoria · Nuevo · Evento", maxLength: 30 },
          { key: "fecha", label: "Fecha", placeholder: "Ej. 4 Sep, 2026", maxLength: 30 },
          { key: "descripcion", label: "Descripción", required: true, type: "textarea", placeholder: "Ej. Se abren 15.000 cupos…", maxLength: 500, hint: "Máximo 500 caracteres. Aparece en la tarjeta de novedades." },
        ]}
        items={col.items}
        values={values}
        onValues={setValues}
        editing={col.editingId != null}
        submitNew="Publicar novedad"
        submitEdit="Guardar cambios"
        emptyText="Aún no hay novedades. Publica la primera con el formulario de arriba."
        msg={msg}
        formExtra={
          <>
            {avisoStorage && (
              <p role="status" className="rounded-[10px] border border-neon/30 bg-neon/[0.07] px-3 py-2 text-[12px] font-semibold text-neon">
                {avisoStorage}
              </p>
            )}
            <NovedadImagenUploader
              archivo={imagenArchivo}
              preview={imagenPreview}
              actual={imagenActual}
              onElegir={(f) => {
                setImagenArchivo(f);
                setMsg("");
              }}
              onQuitar={limpiarImagen}
              onError={(m) => {
                setMsg(`✕ ${m}`);
                toast(m);
              }}
            />
          </>
        }
        renderItem={(n, acc) => (
          <>
            {n.imagen && (
              <span className="block aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-black/20">
                <img src={n.imagen} alt={n.titulo} loading="lazy" className="h-full w-full object-cover" />
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <strong className="text-[14px] text-ink">{n.titulo}</strong>
              <span className="flex-none rounded-full border border-neon/30 bg-neon/10 px-2 py-[3px] text-[11px] font-extrabold text-neon">
                {n.etiqueta || "Noticia"}
              </span>
            </div>
            {n.descripcion && <p className="text-[13px] leading-relaxed text-muted">{n.descripcion}</p>}
            <div className="flex items-center justify-between gap-2">
              <small className="text-[12px] text-muted">{n.fecha || "Sin fecha"}</small>
              <ItemActions onEdit={acc.onEdit} onDelete={acc.onDelete} />
            </div>
          </>
        )}
        onSubmit={submit}
        onCancel={() => {
          col.setEditingId(null);
          setValues({});
          limpiarImagen();
          setMsg("");
        }}
        onEdit={(n) => {
          col.setEditingId(n.id);
          setValues({ titulo: n.titulo || "", etiqueta: n.etiqueta || "", fecha: n.fecha || "", descripcion: n.descripcion || "" });
          setImagenArchivo(null);
          setImagenActual(n.imagen || "");
          setMsg("");
          desplazarA("sec-novedades");
        }}
        onDelete={(n) => setPorBorrar(n)}
      />
      <ConfirmModal
        abierto={porBorrar != null}
        titulo="¿Eliminar novedad?"
        mensaje={`Se eliminará "${porBorrar?.titulo ?? ""}" permanentemente.`}
        confirmando={borrando}
        onCancelar={() => setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
      />
    </>
  );
}

export function PostulacionesSection({ log }: { log: (t: string) => void }) {
  const col = useCollection(api.postulaciones);
  const toast = useToast();
  const [values, setValues] = useState<FormValues>({});
  const [msg, setMsg] = useState("");
  const [porBorrar, setPorBorrar] = useState<Postulacion | null>(null);
  const [borrando, setBorrando] = useState(false);

  async function submit() {
    setMsg("Guardando…");
    try {
      const eraEdicion = col.editingId != null;
      await col.guardar({
        titulo: (values.titulo || "").trim(),
        descripcion: (values.descripcion || "").trim(),
        cupos: Number(values.cupos) || 0,
        fecha_cierre: (values.fecha_cierre || "").trim(),
      });
      setValues({});
      setMsg(eraEdicion ? "✓ Postulación actualizada." : "✓ Postulación abierta.");
      toast(eraEdicion ? "Postulación actualizada" : "Postulación abierta");
      log(eraEdicion ? "Postulación actualizada" : "Postulación abierta");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
    }
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await col.borrarUno(porBorrar.id);
      setPorBorrar(null);
      setMsg("✓ Postulación eliminada.");
      toast("Postulación eliminada");
      log("Postulación eliminada");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <CrudSection<Postulacion>
        id="sec-postulaciones"
        icon={ICON_POS}
        title="Postulaciones"
        sub="Cursos y convocatorias con cupos limitados."
        fields={[
          { key: "titulo", label: "Título", required: true, placeholder: "Ej. Curso de liderazgo — 40 h", maxLength: 120 },
          { key: "cupos", label: "Cupos", required: true, type: "number", placeholder: "Ej. 40" },
          { key: "fecha_cierre", label: "Cierre", placeholder: "Ej. 30 Sep, 2026", maxLength: 30 },
          { key: "descripcion", label: "Descripción", required: true, type: "textarea", placeholder: "Ej. Formación complementaria de 40 horas…", maxLength: 500, hint: "Indica modalidad, duración y requisitos si aplican." },
        ]}
        items={col.items}
        values={values}
        onValues={setValues}
        editing={col.editingId != null}
        submitNew="Abrir postulación"
        submitEdit="Guardar cambios"
        emptyText="No hay postulaciones abiertas. Abre la primera con el formulario de arriba."
        msg={msg}
        renderItem={(p, acc) => (
          <>
            <div className="flex items-start justify-between gap-2">
              <strong className="text-[14px] text-ink">{p.titulo}</strong>
              <span className="flex-none rounded-full border border-neon/30 bg-neon/10 px-2 py-[3px] text-[11px] font-extrabold text-neon">
                {p.cupos} {p.cupos === 1 ? "cupo" : "cupos"}
              </span>
            </div>
            {p.descripcion && <p className="text-[13px] leading-relaxed text-muted">{p.descripcion}</p>}
            <div className="flex items-center justify-between gap-2">
              <small className="text-[12px] text-muted">
                {p.fecha_cierre ? `Cierra ${p.fecha_cierre}` : "Sin fecha de cierre"}
              </small>
              <ItemActions onEdit={acc.onEdit} onDelete={acc.onDelete} />
            </div>
          </>
        )}
        onSubmit={submit}
        onCancel={() => {
          col.setEditingId(null);
          setValues({});
          setMsg("");
        }}
        onEdit={(p) => {
          col.setEditingId(p.id);
          setValues({
            titulo: p.titulo || "",
            descripcion: p.descripcion || "",
            cupos: String(p.cupos ?? ""),
            fecha_cierre: p.fecha_cierre || "",
          });
          setMsg("");
          desplazarA("sec-postulaciones");
        }}
        onDelete={(p) => setPorBorrar(p)}
      />
      <ConfirmModal
        abierto={porBorrar != null}
        titulo="¿Eliminar postulación?"
        mensaje={`Se eliminará "${porBorrar?.titulo ?? ""}" permanentemente.`}
        confirmando={borrando}
        onCancelar={() => setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
      />
    </>
  );
}

export function FichasSection({
  log,
  onChanged,
}: {
  log: (t: string) => void;
  onChanged: () => void;
}) {
  const col = useCollection(api.fichas);
  const toast = useToast();
  const [values, setValues] = useState<FormValues>({});
  const [msg, setMsg] = useState("");
  const [porBorrar, setPorBorrar] = useState<Ficha | null>(null);
  const [borrando, setBorrando] = useState(false);

  async function submit() {
    setMsg("Guardando…");
    try {
      const eraEdicion = col.editingId != null;
      await col.guardar({
        numero: (values.numero || "").trim(),
        programa: (values.programa || "").trim(),
        jornada: (values.jornada || "").trim(),
      });
      onChanged();
      setValues({});
      setMsg(eraEdicion ? "✓ Ficha actualizada." : "✓ Ficha guardada.");
      toast(eraEdicion ? "Ficha actualizada" : "Ficha guardada");
      log(eraEdicion ? "Ficha actualizada" : "Ficha guardada");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
    }
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await col.borrarUno(porBorrar.id);
      onChanged();
      setPorBorrar(null);
      setMsg("✓ Ficha eliminada.");
      toast("Ficha eliminada");
      log("Ficha eliminada");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <CrudSection<Ficha>
        id="sec-fichas"
        icon={ICON_FIC}
        title="Fichas"
        sub="Grupos de formación por programa y jornada. Cada ficha tiene su bitácora y sus archivos."
        fields={[
          { key: "numero", label: "Número de ficha", required: true, placeholder: "Ej. 2981234", maxLength: 20 },
          { key: "jornada", label: "Jornada", required: true, placeholder: "Ej. Diurna · Nocturna · Mixta", maxLength: 30 },
          { key: "programa", label: "Programa", required: true, placeholder: "Ej. Análisis y Desarrollo de Software", maxLength: 120 },
        ]}
        items={col.items}
        values={values}
        onValues={setValues}
        editing={col.editingId != null}
        submitNew="Guardar ficha"
        submitEdit="Guardar cambios"
        emptyText="Aún no hay fichas registradas. Crea la primera con el formulario."
        msg={msg}
        tableHead={["FICHA", "PROGRAMA", "JORNADA", "ACCIONES"]}
        renderRow={(f, acc) => (
          <>
            <td className="px-[14px] py-[13px] font-mono text-[11px] text-ink">{f.numero}</td>
            <td className="px-[14px] py-[13px] text-[11px] text-muted">{f.programa}</td>
            <td className="px-[14px] py-[13px] text-[11px] text-muted">{f.jornada}</td>
            <td className="px-[14px] py-[13px]">
              <ItemActions onEdit={acc.onEdit} onDelete={acc.onDelete} />
            </td>
          </>
        )}
        onSubmit={submit}
        onCancel={() => {
          col.setEditingId(null);
          setValues({});
          setMsg("");
        }}
        onEdit={(f) => {
          col.setEditingId(f.id);
          setValues({ numero: f.numero || "", programa: f.programa || "", jornada: f.jornada || "" });
          setMsg("");
          desplazarA("sec-fichas");
        }}
        onDelete={(f) => setPorBorrar(f)}
      />
      <ConfirmModal
        abierto={porBorrar != null}
        titulo="¿Eliminar ficha?"
        mensaje={`Se eliminará la ficha ${porBorrar?.numero ?? ""}. Su bitácora quedará sin ficha asociada.`}
        confirmando={borrando}
        onCancelar={() => setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
      />
    </>
  );
}
