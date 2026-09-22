import { ArrowRight, CalendarCheck, Check, Clock3 } from "lucide-react";
import { Card, CardSub, CardTitle, Eyebrow } from "./ui";

export function FollowCard({ areas, total }: { areas: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((areas / Math.max(1, total)) * 100)) : 0;
  return (
    <Card className="min-h-[148px] p-[22px] before:absolute before:-bottom-[25px] before:-right-[100px] before:h-[80px] before:w-[340px] before:rotate-[-8deg] before:rounded-[50%] before:border-t before:border-neon/10">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
            <Clock3 size={20} />
          </span>
          <div>
            <Eyebrow>Seguimiento</Eyebrow>
            <CardTitle>Programas por área</CardTitle>
            <CardSub>{total} {total === 1 ? "programa publicado" : "programas publicados"}</CardSub>
          </div>
        </div>
        <div className="text-[12px] font-extrabold text-ink">{total} activos</div>
      </div>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--neon) ${pct * 3.6}deg, rgba(163,230,53,.14) 0deg)` }}
          role="img"
          aria-label={`${pct} por ciento de cobertura`}
        >
          <span className="absolute h-[53px] w-[53px] rounded-full bg-panel" />
          <span className="relative z-[1] text-[12px] font-extrabold text-ink">{pct}%</span>
        </div>
        <div>
          <div className="text-[11px] text-muted">Cobertura actual</div>
          <div className="mt-1 text-[18px] font-extrabold text-ink">{areas} áreas</div>
        </div>
      </div>
    </Card>
  );
}

export function ActivityCard({ items }: { items: Array<{ texto: string; tiempo: string }> }) {
  const lista = items.slice(0, 2);
  return (
    <Card className="flex min-h-[148px] items-center gap-[15px] p-[22px] before:absolute before:-bottom-[25px] before:-right-[100px] before:h-[80px] before:w-[340px] before:rotate-[-8deg] before:rounded-[50%] before:border-t before:border-neon/10">
      <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] border border-neon/15 bg-neon/[0.08] text-neon">
        <CalendarCheck size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <Eyebrow>Al día</Eyebrow>
        <CardTitle>Actividad reciente</CardTitle>
        <CardSub>Últimos movimientos del panel.</CardSub>
        <ul className="mt-3 grid gap-2">
          {lista.length === 0 && (
            <li className="text-[11px] text-muted">Sin movimientos todavía. Publica algo y aparece aquí.</li>
          )}
          {lista.map((a) => (
            <li key={a.texto + a.tiempo} className="flex items-center gap-2 text-[11px] text-muted">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neon/10 text-neon">
                <Check size={11} strokeWidth={3} />
              </span>
              <span className="truncate">
                {a.texto} <span className="text-muted/70">· {a.tiempo}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ArrowRight size={18} className="shrink-0 text-neon" />
    </Card>
  );
}
