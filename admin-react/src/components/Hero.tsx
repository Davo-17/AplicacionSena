import {
  Building2,
  ExternalLink,
  FileStack,
  GraduationCap,
  Megaphone,
  Plus,
  Radio,
  UserRound,
} from "lucide-react";

function desplazarA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Hero({
  total,
  tecnicos,
  tecnologos,
  areas,
  onNuevoPrograma,
}: {
  total: number;
  tecnicos: number;
  tecnologos: number;
  areas: number;
  onNuevoPrograma: () => void;
}) {
  const STATS = [
    { id: "total", Icon: FileStack, value: String(total), label: <>Total<br />programas</> },
    { id: "tec", Icon: UserRound, value: String(tecnicos), label: <>Técnicos</> },
    { id: "teg", Icon: GraduationCap, value: String(tecnologos), label: <>Tecnólogos</> },
    { id: "areas", Icon: Building2, value: String(areas), label: <>Áreas<br />cubiertas</> },
  ];

  return (
    <section className="anim-enter relative min-h-[295px] overflow-hidden rounded-[22px] border border-neon/25 bg-[#061b0c] shadow-[0_18px_55px_rgba(0,0,0,0.3),0_0_35px_rgba(163,230,53,0.06)]">
      {/* fondo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg,rgba(3,30,11,.98) 0%,rgba(4,34,14,.88) 43%,rgba(4,25,11,.62) 100%), radial-gradient(circle at 75% 20%,rgba(163,230,53,.22),transparent 35%), linear-gradient(135deg,#102d16,#061b0c)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg,transparent 55%,rgba(163,230,53,.08) 55.5%,transparent 56%), repeating-radial-gradient(circle at 100% 0,transparent 0 35px,rgba(163,230,53,.05) 36px 37px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[340px] -right-[180px] h-[500px] w-[500px] rounded-full bg-neon/10 blur-[70px]"
      />

      <div className="relative z-[2] max-w-[740px] px-[38px] pb-[34px] pt-[34px] max-sm:px-[22px] max-sm:pt-[26px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-neon/25 bg-[#1a5f23]/[.38] px-3 py-[7px] text-[10px] font-bold tracking-[0.8px] text-[#b8fcb1]">
          <span className="h-[7px] w-[7px] animate-[pulse-dot_1.8s_ease-in-out_infinite] rounded-full bg-neon" />
          CENTRO EN VIVO
          <Radio size={12} />
        </div>
        <h1 className="mb-2 mt-[17px] text-[40px] font-extrabold leading-[1.05] tracking-[-1.7px] text-white max-sm:text-[30px]">
          Hola, <span className="text-neon">administrador</span>
        </h1>
        <p className="max-w-[620px] text-[13px] leading-[1.65] text-[#c0d1c5]">
          Administra la oferta de formación, publica novedades y registra el avance de cada
          ficha desde un solo lugar.
        </p>

        <div className="mt-[23px] flex flex-wrap gap-[11px] max-sm:[&>*]:flex-1">
          <button
            onClick={onNuevoPrograma}
            className="inline-flex h-[43px] items-center justify-center gap-2 rounded-[10px] bg-neon px-[17px] text-[12px] font-bold text-[#071306] shadow-[0_8px_25px_rgba(163,230,53,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(163,230,53,0.35)]"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nuevo programa
          </button>
          <button
            onClick={() => desplazarA("novedades")}
            className="inline-flex h-[43px] items-center justify-center gap-2 rounded-[10px] border border-neon/25 bg-white/[0.025] px-[17px] text-[12px] font-bold text-white transition-all duration-200 hover:-translate-y-px hover:border-neon/50"
          >
            <Megaphone size={15} />
            Publicar novedad
          </button>
          <a
            href="/"
            className="inline-flex h-[43px] items-center justify-center gap-2 rounded-[10px] border border-neon/25 bg-white/[0.025] px-[17px] text-[12px] font-bold text-white transition-all duration-200 hover:-translate-y-px hover:border-neon/50"
          >
            <ExternalLink size={15} />
            Ver sitio público
          </a>
        </div>
      </div>

      <div className="absolute right-[25px] top-1/2 z-[3] grid w-[435px] max-w-[calc(100%-50px)] -translate-y-1/2 grid-cols-4 rounded-[18px] border border-neon/15 bg-[#021208]/[.62] backdrop-blur-[16px] max-lg:relative max-lg:right-auto max-lg:top-auto max-lg:m-[-10px_25px_25px] max-lg:w-[calc(100%-50px)] max-lg:translate-y-0 max-sm:m-[0_16px_16px] max-sm:w-[calc(100%-32px)] max-sm:grid-cols-2">
        {STATS.map(({ id, Icon, value, label }, i) => (
          <div
            key={id}
            className={
              "px-[15px] py-[22px] text-center " +
              (i < 3 ? "border-r border-neon/10 max-sm:[&:nth-child(2)]:border-r-0 " : "") +
              (i > 1 ? "max-sm:border-t max-sm:border-neon/10" : "")
            }
          >
            <div className="mb-3 flex justify-center text-neon">
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <strong className="block text-[24px] font-extrabold text-white">{value}</strong>
            <span className="text-[10px] leading-[1.4] text-muted">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
