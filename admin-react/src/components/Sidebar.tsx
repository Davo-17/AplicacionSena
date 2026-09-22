import {
  ClipboardList,
  FileText,
  Files,
  GraduationCap,
  History,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/cn";

import type { LucideIcon } from "lucide-react";

const ITEMS: Array<{ id: string; label: string; Icon: LucideIcon; dot?: boolean; target?: string }> = [
  { id: "programas", label: "Programas", Icon: GraduationCap },
  { id: "novedades", label: "Novedades", Icon: Megaphone, dot: true },
  { id: "postulaciones", label: "Postulaciones", Icon: ClipboardList },
  { id: "fichas", label: "Fichas", Icon: FileText },
  { id: "bitacora", label: "Bitácora", Icon: History },
  { id: "archivos", label: "Archivos", Icon: Files, target: "bitacora" },
];

export default function Sidebar({
  open,
  active,
  onNavigate,
}: {
  open: boolean;
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-[72px] flex h-[calc(100vh-72px)] w-[260px] shrink-0 flex-col border-r border-line bg-bg2/80 px-[18px] py-[25px] transition-[left] duration-200 max-lg:fixed max-lg:left-[-280px] max-lg:top-[72px] max-lg:z-40",
        open && "max-lg:left-0",
      )}
    >
      <div className="px-3 pb-[10px] text-[10px] uppercase tracking-[1.2px] text-muted/80">
        Secciones
      </div>
      <nav className="flex flex-col gap-[5px]">
        {ITEMS.map(({ id, label, Icon, dot, target }) => (
          <a
            key={id}
            href={`#${target ?? id}`}
            onClick={() => onNavigate(id)}
            className={cn(
              "flex h-[47px] items-center gap-3 rounded-xl border border-transparent px-[13px] text-[13px] transition-all duration-200",
              active === id
                ? "bg-neon font-bold text-[#071308] shadow-[0_7px_25px_rgba(163,230,53,0.16)] [&_svg]:text-[#09200d]"
                : "text-muted hover:border-neon/10 hover:bg-neon/[0.055] hover:text-ink",
            )}
          >
            <Icon size={18} strokeWidth={1.8} className="shrink-0" />
            {label}
            {dot && (
              <span className="ml-auto h-[6px] w-[6px] rounded-full bg-neon" aria-hidden />
            )}
          </a>
        ))}
      </nav>

      <div className="mt-[30px] rounded-[15px] border border-neon/15 bg-gradient-to-br from-neon/[0.07] to-white/[0.015] p-[18px]">
        <ShieldCheck size={20} className="text-neon" />
        <p className="my-[10px] text-[11px] leading-[1.6] text-muted">
          Lo que publiques aquí se ve en el sitio.
        </p>
        <a href="/" className="text-[11px] font-bold text-neon no-underline">
          Abrir el sitio público →
        </a>
      </div>
    </aside>
  );
}
