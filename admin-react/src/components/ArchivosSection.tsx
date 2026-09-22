import { useCallback, useEffect, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";
import { api, type Evidencia } from "../lib/api";
import { Card } from "./ui";

function nombreDeUrl(u: string): string {
  try {
    const p = u.split("?")[0].split("/");
    return decodeURIComponent(p[p.length - 1] || "archivo");
  } catch {
    return "archivo";
  }
}

/** Espejo de archivos por ficha (igual que el panel anterior). */
export default function ArchivosSection({
  ficha,
  tick,
}: {
  ficha: string;
  tick: number;
}) {
  const [items, setItems] = useState<Evidencia[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!ficha) {
      setItems([]);
      return;
    }
    setCargando(true);
    try {
      setItems(await exigirSesion(api.evidencias.listar(ficha)));
    } catch {
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [ficha]);

  useEffect(() => {
    cargar();
  }, [cargar, tick]);

  const urls = items.flatMap((e) =>
    (e.imagenes || []).map((url) => ({ url, titulo: e.titulo || "Evidencia", fecha: e.fecha || "" })),
  );

  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6M9 11h2" /></svg>
        </span>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neon">
            Documentos por ficha
          </div>
          <h3 className="text-[17px] font-extrabold text-ink">Archivos de la ficha</h3>
          <p className="mt-1 text-[10px] text-muted">
            Todo lo que subas en la bitácora aparece aquí organizado por ficha, listo para
            descargar o compartir.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-[7px] text-[13px] font-bold text-neon">
          Ficha · {ficha || "—"}
        </span>
        <button
          type="button"
          onClick={cargar}
          className="ml-auto rounded-[10px] border border-line bg-white/[0.02] px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-neon/10 hover:text-neon"
        >
          ↻ Actualizar archivos
        </button>
      </div>

      {cargando ? (
        <p className="text-[13px] text-muted">Cargando archivos…</p>
      ) : urls.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line bg-white/[0.02] p-6 text-center text-[13px] text-muted">
          {!ficha
            ? "Elige una ficha en la bitácora para ver sus archivos aquí."
            : `La ficha ${ficha} aún no tiene archivos. Súbelos desde la bitácora y aparecerán aquí.`}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((a) => (
            <div
              key={a.url}
              className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-3 transition-all hover:-translate-y-px hover:border-neon/30"
            >
              <img
                src={a.url}
                alt={a.titulo}
                loading="lazy"
                className="h-[52px] w-[52px] flex-none rounded-[10px] border border-line object-cover"
              />
              <div className="grid min-w-0 flex-1 gap-[3px]">
                <strong className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink">
                  {nombreDeUrl(a.url)}
                </strong>
                <small className="text-[11px] text-muted">
                  {a.titulo}
                  {a.fecha ? ` · ${a.fecha}` : ""}
                </small>
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener"
                download
                className="flex-none rounded-[9px] border border-neon/30 bg-transparent px-3 py-[7px] text-[12px] font-bold text-neon transition-colors hover:bg-neon/10"
              >
                Descargar
              </a>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
