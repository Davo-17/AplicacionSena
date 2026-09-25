import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { cn } from "../lib/cn";

export const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  archivo: File | null;
  preview: string;
  actual: string;
  onElegir: (f: File) => void;
  onQuitar: () => void;
  onError: (msg: string) => void;
  deshabilitado?: boolean;
}

/**
 * Portada de la novedad (una sola imagen).
 * Vista previa 16/10 idéntica a la tarjeta de la página principal:
 * cualquier foto —vertical, panorámica o pequeña— se ve igual que las fakes.
 */
export default function NovedadImagenUploader({
  archivo,
  preview,
  actual,
  onElegir,
  onQuitar,
  onError,
  deshabilitado,
}: Props) {
  const [arrastrando, setArrastrando] = useState(false);
  const [rota, setRota] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const vista = preview || actual;

  useEffect(() => {
    setRota(false);
  }, [preview, actual]);

  useEffect(() => {
    if (!arrastrando) return;
    const t = setTimeout(() => setArrastrando(false), 4000);
    return () => clearTimeout(t);
  }, [arrastrando]);

  function revisar(f: File) {
    if (!TIPOS_OK.includes(f.type)) {
      onError("Solo se aceptan JPG, PNG o WebP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      onError("La imagen supera los 5 MB.");
      return;
    }
    onElegir(f);
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-ink">
          Portada <span className="font-normal text-muted">(opcional)</span>
        </span>
        {vista && (
          <span className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-[3px] text-[11px] font-bold text-neon">
            {archivo ? "Nueva imagen lista" : "Imagen guardada"}
          </span>
        )}
      </div>

      {vista ? (
        <figure className="group relative overflow-hidden rounded-[14px] border border-neon/30 bg-white/[0.02]">
          {/* Mismo marco que la tarjeta pública: 16/10 + recorte centrado */}
          <div className="relative aspect-[16/10] min-h-[180px] w-full overflow-hidden bg-black/20">
            {!rota ? (
              <img
                src={vista}
                alt="Portada de la novedad"
                onError={() => setRota(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <p className="text-[12px] font-semibold text-danger">
                  No se pudo mostrar esta imagen aquí. Prueba con otro archivo JPG, PNG o WebP.
                </p>
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-[3px] text-[10px] font-bold text-white">
              Vista previa
            </span>
          </div>
          <figcaption className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted">
              {archivo ? `${archivo.name} · ${Math.max(1, Math.round(archivo.size / 1024))} KB` : actual}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={deshabilitado}
              title="Cambiar imagen"
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted transition-colors hover:border-neon/40 hover:text-neon disabled:opacity-40"
            >
              <RotateCcw size={12} /> Cambiar
            </button>
            <button
              type="button"
              onClick={onQuitar}
              disabled={deshabilitado}
              title="Quitar imagen"
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-40"
            >
              <Trash2 size={12} /> Quitar
            </button>
          </figcaption>
        </figure>
      ) : (
        <div
          role="button"
          tabIndex={deshabilitado ? -1 : 0}
          aria-label="Insertar portada: arrastra una imagen o haz clic para explorar"
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
            const f = e.dataTransfer?.files?.[0];
            if (f) revisar(f);
          }}
          className={cn(
            "group grid cursor-pointer place-items-center gap-1 rounded-[14px] border-[1.5px] border-dashed px-5 py-6 text-center transition-all",
            arrastrando
              ? "scale-[1.005] border-neon bg-neon/[0.09] shadow-[0_0_0_4px_rgba(163,230,53,0.12)]"
              : "border-neon/30 bg-gradient-to-b from-neon/[0.06] to-transparent hover:border-neon hover:bg-neon/[0.05]",
            deshabilitado && "pointer-events-none opacity-60",
          )}
        >
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-neon/10 text-neon transition-transform group-hover:scale-105">
            {arrastrando ? <UploadCloud size={22} /> : <ImagePlus size={22} />}
          </span>
          <p className="text-[14px] font-semibold text-ink">
            {arrastrando ? "Suelta para agregarla" : "Selecciona la portada"}
          </p>
          <p className="max-w-[420px] text-[12px] leading-relaxed text-muted">
            JPG · PNG · WebP · máx. 5 MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={deshabilitado}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) revisar(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
