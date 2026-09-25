import { useCallback, useEffect, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";
import { api, type UsuarioGestion } from "../lib/api";
import { useToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";
import { Card, Field, PrimaryButton, Select, TextInput } from "./ui";

const ROLES = ["administrador", "instructor", "aprendiz"] as const;

function insigniaRol(rol: string) {
  if (rol === "administrador")
    return "border-neon/40 bg-neon/10 text-neon";
  if (rol === "instructor")
    return "border-[#36a9ff]/30 bg-[#36a9ff]/10 text-[#7cc4ff]";
  return "border-line bg-white/[0.03] text-muted";
}

/** Gestión de usuarios: el admin asigna roles a correos institucionales. */
export default function UsuariosSection({ log }: { log: (t: string) => void }) {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState<UsuarioGestion[]>([]);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<string>("instructor");
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [pendiente, setPendiente] = useState<{ email: string; rol: string } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setUsuarios(await exigirSesion(api.usuarios.listar()));
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error al listar usuarios"));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function asignar(e: React.FormEvent) {
    e.preventDefault();
    const correo = email.trim().toLowerCase();
    if (!correo) {
      setMsg("✕ Escribe un correo institucional.");
      return;
    }
    setPendiente({ email: correo, rol });
  }

  async function confirmar() {
    if (!pendiente) return;
    setAplicando(true);
    try {
      await exigirSesion(api.usuarios.cambiarRol(pendiente.email, pendiente.rol));
      setMsg(`✓ ${pendiente.email} ahora es ${pendiente.rol}.`);
      toast(`Rol asignado: ${pendiente.rol}`);
      log(`Rol ${pendiente.rol} → ${pendiente.email}`);
      setPendiente(null);
      setEmail("");
      await cargar();
    } catch (err) {
      setMsg("✕ " + (err instanceof Error ? err.message : "Error"));
      setPendiente(null);
    } finally {
      setAplicando(false);
    }
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.6c2.9.3 5.5 2 5.5 5.4" /></svg>
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-neon">Administración</div>
            <h3 className="text-[17px] font-extrabold text-ink">Usuarios y roles</h3>
            <p className="mt-1 text-[10px] text-muted">
              Asigna el rol de administrador (u otro rol) a correos institucionales
              (@sena.edu.co o @soy.sena.edu.co). La cuenta debe existir: pídele a la persona
              que se registre primero.
            </p>
          </div>
          <button
            type="button"
            onClick={cargar}
            className="ml-auto flex-none rounded-[10px] border border-line bg-white/[0.02] px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-neon/10 hover:text-neon"
          >
            ↻ Actualizar
          </button>
        </div>

        <form onSubmit={asignar} className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <Field label="Correo institucional" required>
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej. instructor@sena.edu.co"
              maxLength={254}
              required
            />
          </Field>
          <Field label="Rol">
            <Select value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={aplicando} className="w-full sm:w-auto disabled:opacity-60">
              Asignar rol
            </PrimaryButton>
          </div>
        </form>

        {msg && (
          <p role="status" className="mb-2 min-h-[1.2em] text-[13px] text-neon">
            {msg}
          </p>
        )}

        {cargando ? (
          <p className="text-[13px] text-muted">Cargando usuarios…</p>
        ) : usuarios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white/[0.02] p-6 text-center text-[13px] text-muted">
            No se pudieron cargar los usuarios o aún no hay cuentas registradas.
          </p>
        ) : (
          <div className="grid gap-2">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-4 py-2.5"
              >
                <strong className="min-w-[180px] flex-1 overflow-hidden text-ellipsis text-[13px] text-ink">
                  {u.email}
                </strong>
                <span className={`rounded-full border px-2 py-[3px] text-[11px] font-bold ${insigniaRol(u.rol)}`}>
                  {u.rol}
                </span>
                <Select
                  value={ROLES.includes(u.rol as (typeof ROLES)[number]) ? u.rol : "instructor"}
                  onChange={(e) => setPendiente({ email: u.email, rol: e.target.value })}
                  aria-label={`Cambiar rol de ${u.email}`}
                  className="h-[34px] w-auto flex-none py-1 text-[12px]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        )}
      </Card>
      <ConfirmModal
        abierto={pendiente != null}
        titulo="¿Asignar este rol?"
        mensaje={pendiente ? `${pendiente.email} quedará como "${pendiente.rol}".` : ""}
        confirmando={aplicando}
        onCancelar={() => setPendiente(null)}
        onConfirmar={confirmar}
      />
    </>
  );
}
