import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import { cn } from "../lib/cn";

export const MAX_FOTOS = 4;
export const MAX_BYTES = 5 * 1024 * 1024;
export const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  archivos: File[];
  previews: string[];
  onAgregar: (files: FileList | File[]) => void;
  onQuitar: (i: number) => void;
  onMover: (from: number, to: number) => void;
  onError: (msg: string) => void;
  deshabilitado?: boolean;
}

/**
 * Uploader profesional de evidencias.
 * - Zona drag & drop con estados visuales.
 * - Previsualización uniforme (misma proporción y recorte para cualquier imagen).
 * - La primera foto es la portada que verá la página principal.
 * - Permite reordenar y eliminar antes de publicar.
 */
export default function EvidenciaImagenesUploader({
  archivos,
  previews,
  onAgregar,
  onQuitar,
  onMover,
  onError,
  deshabilitado,
}: Props) {
  const [arrastrando, setArrastrando] = useState(false);
  const [rechazo, setRechazo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!rechazo) return;
    const t = setTimeout(() => setRechazo(""), 4500);
    return () => clearTimeout(t);
  }, [rechazo]);

  function manejarArchivos(origen: FileList | File[]) {
    const lista = Array.from(origen);
    if (!lista.length) return;
    if (archivos.length + lista.length > MAX_FOTOS) {
      const msg = `Máximo ${MAX_FOTOS} fotos por evidencia.`;
      setRechazo(msg);
      onError(msg);
    }
    // El padre valida tipo/peso y avisa con toast; aquí solo delegamos.
    onAgregar(lista);
  }

  const restantes = MAX_FOTOS - archivos.length;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-ink">
          Imágenes de la evidencia <span className="font-normal text-muted">(opcional)</span>
        </span>
        {archivos.length > 0 && (
          <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-[3px] text-[11px] font-bold text-muted">
            {archivos.length} / {MAX_FOTOS}
          </span>
        )}
      </div>

      {/* Zona de carga */}
      <div
        role="button"
        tabIndex={deshabilitado ? -1 : 0}
        aria-label="Insertar imágenes: arrastra archivos o haz clic para explorar"
        aria-disabled={deshabilitado}
        onClick={() => !deshabilitado && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (deshabilitado) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          if (deshabilitado) return;
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
          if (deshabilitado) return;
          if (e.dataTransfer?.files) manejarArchivos(e.dataTransfer.files);
        }}
        className={cn(
          "group grid cursor-pointer place-items-center gap-1 rounded-[14px] border-[1.5px] border-dashed px-5 py-6 text-center transition-all",
          arrastrando
            ? "scale-[1.005] border-neon bg-neon/[0.09] shadow-[0_0_0_4px_rgba(163,230,53,0.12)]"
            : "border-neon/30 bg-gradient-to-b from-neon/[0.06] to-transparent hover:border-neon hover:bg-neon/[0.05]",
          deshabilitado && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          disabled={deshabilitado}
          onChange={(e) => {
            if (e.target.files) manejarArchivos(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-neon/10 text-neon transition-transform group-hover:scale-105">
          {arrastrando ? <UploadCloud size={22} /> : <ImagePlus size={22} />}
        </span>
        <p className="text-[14px] font-semibold text-ink">
          {arrastrando ? (
            "Suelta para agregarlas"
          ) : archivos.length === 0 ? (
            "Selecciona tus fotos"
          ) : restantes > 0 ? (
            "Agregar más"
          ) : (
            "Límite alcanzado"
          )}
        </p>
        <p className="max-w-[420px] text-[12px] leading-relaxed text-muted">
          JPG · PNG · WebP · máx. 5 MB c/u
        </p>
      </div>

      {rechazo && (
        <p role="alert" className="rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] font-semibold text-danger">
          {rechazo}
        </p>
      )}

      {/* Vista previa uniforme */}
      {archivos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {archivos.map((f, i) => (
            <figure
              key={`${f.name}-${f.size}-${i}`}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-white/[0.02] transition-colors",
                i === 0 ? "border-neon/50" : "border-line",
              )}
            >
              {/* Marco uniforme: cualquier imagen —vertical, panorámica, pequeña— ocupa el mismo espacio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                <img
                  src={previews[i]}
                  alt={`Vista previa ${i + 1}: ${f.name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {i === 0 ? (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-neon px-2 py-[3px] text-[10px] font-extrabold text-[#071307] shadow">
                    <Star size={11} strokeWidth={2.5} /> Portada
                  </span>
                ) : (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/65 px-2 py-[3px] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Quitar ${f.name}`}
                  title="Quitar"
                  disabled={deshabilitado}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuitar(i);
                  }}
                  className="absolute right-1.5 top-1.5 grid h-[26px] w-[26px] place-items-center rounded-full bg-black/70 text-white opacity-100 transition-colors hover:bg-danger sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <figcaption className="grid gap-1 px-2 py-1.5">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-muted">
                  {f.name} · {Math.max(1, Math.round(f.size / 1024))} KB
                </span>
                <span className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    disabled={deshabilitado || i === 0}
                    onClick={() => onMover(i, i - 1)}
                    title="Mover a la izquierda (más cerca de portada)"
                    aria-label={`Mover foto ${i + 1} a la izquierda`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-line px-1.5 py-1 text-[10px] font-bold text-muted transition-colors hover:border-neon/40 hover:text-neon disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowLeft size={11} /> Izq.
                  </button>
                  <button
                    type="button"
                    disabled={deshabilitado || i === archivos.length - 1}
                    onClick={() => onMover(i, i + 1)}
                    title="Mover a la derecha"
                    aria-label={`Mover foto ${i + 1} a la derecha`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-line px-1.5 py-1 text-[10px] font-bold text-muted transition-colors hover:border-neon/40 hover:text-neon disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Der. <ArrowRight size={11} />
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
