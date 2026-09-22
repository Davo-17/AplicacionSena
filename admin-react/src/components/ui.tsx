import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/* Tarjeta base: fondo panel, borde 1px sutil, rounded-2xl */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-panel p-[22px] transition-colors duration-200",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wide text-neon">{children}</div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="mt-1 text-[13px] font-extrabold text-ink">{children}</div>;
}

export function CardSub({ children }: { children: ReactNode }) {
  return <div className="mt-[3px] text-[10px] leading-relaxed text-muted">{children}</div>;
}

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-[7px]">
      <span className="text-[11px] font-semibold text-ink">
        {label} {required && <span className="text-neon">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-[42px] w-full rounded-[10px] border border-line bg-inputbg px-3 text-[13px] text-ink placeholder:text-muted/70 outline-none transition-all duration-200 focus:border-neon/50 focus:shadow-[0_0_0_3px_rgba(163,230,53,0.12)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={4}
      className={cn(inputCls, "h-auto min-h-[96px] resize-y py-2.5 leading-relaxed", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, props.className)} />;
}

export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex h-[43px] items-center justify-center gap-2 rounded-[10px] bg-neon px-[17px] text-[12px] font-bold text-[#071307] shadow-[0_8px_25px_rgba(163,230,53,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(163,230,53,0.35)] active:translate-y-0",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex h-[43px] items-center justify-center gap-2 rounded-[10px] border border-neon/25 bg-white/[0.025] px-[17px] text-[12px] font-bold text-ink transition-all duration-200 hover:-translate-y-px hover:border-neon/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function NivelBadge({ nivel }: { nivel: "Técnico" | "Tecnólogo" }) {
  return nivel === "Técnico" ? (
    <span className="inline-flex items-center rounded-full border border-[#25d353]/20 bg-[#25d353]/[.13] px-[9px] py-[5px] text-[8px] font-extrabold text-[#aaff87]">
      Técnico
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-[#cebf28]/[.22] bg-[#b6a317]/[.12] px-[9px] py-[5px] text-[8px] font-extrabold text-[#e8dc69]">
      Tecnólogo
    </span>
  );
}

export function ModalidadBadge({ modalidad }: { modalidad: string }) {
  const v = modalidad.toLowerCase();
  const virtual = v.includes("virtual");
  return virtual ? (
    <span className="inline-flex items-center rounded-full border border-[#8046e1]/[.18] bg-[#8046e1]/[.12] px-[9px] py-[5px] text-[8px] font-extrabold text-[#c59bff]">
      {modalidad}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-[#1982dc]/[.18] bg-[#1982dc]/[.12] px-[9px] py-[5px] text-[8px] font-extrabold text-[#71c8ff]">
      {modalidad}
    </span>
  );
}
