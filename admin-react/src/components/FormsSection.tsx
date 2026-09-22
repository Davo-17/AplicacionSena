import { useState } from "react";
import { fichas } from "../data/mock";
import { Card, CardSub, CardTitle, Eyebrow, Field, PrimaryButton, TextArea, TextInput } from "./ui";

function CardHead({
  icon,
  eyebrow,
  title,
  sub,
}: {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
        {icon}
      </span>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <CardTitle>{title}</CardTitle>
        <CardSub>{sub}</CardSub>
      </div>
    </div>
  );
}

export function NovedadesCard() {
  const [desc, setDesc] = useState("");
  return (
    <Card>
      <CardHead
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H8l-4 4V5z" /><path d="M8 9h8M8 12h5" /></svg>
        }
        title="Novedades de la semana"
        sub="Convocatorias, eventos y noticias destacadas."
      />
      <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Título" required>
          <TextInput placeholder="Ej. Nueva convocatoria virtual 2026 — 15.000 cupos" maxLength={120} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Etiqueta">
            <TextInput placeholder="Ej. Convocatoria · Nuevo · Evento" maxLength={30} />
          </Field>
          <Field label="Fecha">
            <TextInput placeholder="Ej. 4 Sep, 2026" maxLength={30} />
          </Field>
        </div>
        <Field
          label="Descripción"
          required
          hint={`${desc.length}/500 caracteres. Aparece en la tarjeta de novedades.`}
        >
          <TextArea
            value={desc}
            maxLength={500}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ej. Se abren 15.000 cupos en desarrollo de software, IA y gestión empresarial…"
          />
        </Field>
        <PrimaryButton type="submit" className="w-full">
          Publicar novedad
        </PrimaryButton>
      </form>
    </Card>
  );
}

export function PostulacionesCard() {
  return (
    <Card>
      <CardHead
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4-8 4-8-4 8-4z" /><path d="M4 11l8 4 8-4M4 15l8 4 8-4" /></svg>
        }
        title="Postulaciones"
        sub="Cursos y convocatorias con cupos limitados."
      />
      <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Título" required>
          <TextInput placeholder="Ej. Curso de liderazgo y trabajo en equipo — 40 h" maxLength={120} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cupos" required>
            <TextInput type="number" min={1} placeholder="Ej. 40" />
          </Field>
          <Field label="Cierre">
            <TextInput placeholder="Ej. 30 Sep, 2026" maxLength={30} />
          </Field>
        </div>
        <Field label="Descripción" required hint="Indica modalidad, duración y requisitos si aplican.">
          <TextArea placeholder="Ej. Formación complementaria de 40 horas, modalidad presencial…" />
        </Field>
        <PrimaryButton type="submit" className="w-full">
          Abrir postulación
        </PrimaryButton>
      </form>
    </Card>
  );
}

export function FichasCard() {
  return (
    <Card className="lg:col-span-2">
      <CardHead
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
        }
        title="Fichas"
        sub="Grupos de formación por programa y jornada."
      />
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <form className="grid content-start gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número de ficha" required>
              <TextInput placeholder="Ej. 2981234" maxLength={20} inputMode="numeric" />
            </Field>
            <Field label="Jornada" required>
              <TextInput placeholder="Ej. Diurna · Nocturna · Mixta" maxLength={30} />
            </Field>
          </div>
          <Field label="Programa" required>
            <TextInput placeholder="Ej. Análisis y Desarrollo de Software" maxLength={120} />
          </Field>
          <PrimaryButton type="submit" className="w-full">
            Guardar ficha
          </PrimaryButton>
        </form>

        <div className="min-w-0 overflow-auto rounded-[13px] border border-neon/10">
          <table className="w-full min-w-[520px] border-collapse">
            <thead className="bg-neon/[0.045]">
              {["FICHA", "PROGRAMA", "JORNADA", "ACCIONES"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-[14px] py-[13px] text-left text-[9px] font-bold tracking-[0.4px] text-muted"
                >
                  {h}
                </th>
              ))}
            </thead>
            <tbody>
              {fichas.map((f) => (
                <tr key={f.numero} className="border-t border-neon/[0.075]">
                  <td className="px-[14px] py-[13px] font-mono text-[10px] text-ink">{f.numero}</td>
                  <td className="px-[14px] py-[13px] text-[10px] text-muted">
                    <div className="font-semibold text-ink">{f.programa}</div>
                    <div className="mt-1.5 h-[5px] w-full max-w-[220px] overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-neon shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                        style={{ width: `${f.ocupacion}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-[14px] py-[13px] text-[10px] text-muted">{f.jornada}</td>
                  <td className="px-[14px] py-[13px] text-[10px] font-bold text-neon">
                    {f.ocupacion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
