import { GraduationCap, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";
import { useCollection } from "../hooks/useCollection";
import { api, nivelNorm, type Programa, type ProgramaIn } from "../lib/api";
import { cn } from "../lib/cn";
import ConfirmModal from "./ConfirmModal";
import ProgramModal from "./ProgramModal";
import { useToast } from "./Toast";
import { ModalidadBadge, NivelBadge, PrimaryButton } from "./ui";

const FILTROS = ["Todos", "Técnico", "Tecnólogo"] as const;

export default function ProgramsSection({
  query,
  onQuery,
  log,
}: {
  query: string;
  onQuery: (v: string) => void;
  log: (t: string) => void;
}) {
  const col = useCollection(api.programas);
  const toast = useToast();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Programa | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [porBorrar, setPorBorrar] = useState<Programa | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [msg, setMsg] = useState("");

  const filas = useMemo(() => {
    const q = query.toLowerCase().trim();
    return col.items.filter((p) => {
      const okQ =
        !q || `${p.nombre} ${p.codigo} ${p.area}`.toLowerCase().includes(q);
      if (filtro === "Todos") return okQ;
      return okQ && nivelNorm(p) === (filtro === "Tecnólogo" ? "tecnologia" : "tecnica");
    });
  }, [col.items, query, filtro]);

  function abrirNuevo() {
    setEditando(null);
    setErrorModal("");
    setModalAbierto(true);
  }

  // El botón "Nuevo programa" del hero abre este mismo modal.
  useEffect(() => {
    const abrir = () => {
      document.getElementById("programas")?.scrollIntoView({ behavior: "smooth" });
      abrirNuevo();
    };
    window.addEventListener("dajesa:nuevo-programa", abrir);
    return () => window.removeEventListener("dajesa:nuevo-programa", abrir);
  }, []);

  function abrirEditar(p: Programa) {
    setEditando(p);
    setErrorModal("");
    setModalAbierto(true);
  }

  async function guardar(datos: ProgramaIn) {
    setGuardando(true);
    setErrorModal("");
    try {
      const eraEdicion = editando != null;
      if (eraEdicion) {
        await exigirSesion(api.programas.editar(editando.id, datos));
      } else {
        await exigirSesion(api.programas.crear(datos));
      }
      await col.recargar();
      setModalAbierto(false);
      setEditando(null);
      const texto = eraEdicion ? "Programa actualizado" : "Programa creado";
      setMsg(`✓ ${texto}.`);
      toast(texto);
      log(texto);
    } catch (e) {
      setErrorModal(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porBorrar) return;
    setBorrando(true);
    try {
      await exigirSesion(api.programas.borrar(porBorrar.id));
      setPorBorrar(null);
      await col.recargar();
      setMsg("✓ Programa eliminado.");
      toast("Programa eliminado");
      log("Programa eliminado");
    } catch (e) {
      setMsg("✕ " + (e instanceof Error ? e.message : "Error"));
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <section
        className="rounded-[19px] border border-neon/15 bg-panel p-5 max-sm:p-[14px]"
        style={{ backgroundImage: "linear-gradient(145deg,var(--cardhi),var(--cardhi2))" }}
      >
        <div className="mb-[17px] flex flex-wrap items-center justify-between gap-[18px] max-md:flex-col max-md:items-stretch">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
              <GraduationCap size={20} />
            </span>
            <div>
              <div className="text-[17px] font-extrabold text-ink">Programas de formación</div>
              <div className="mt-1 text-[10px] text-muted">
                Busca, filtra y edita la oferta técnica y tecnológica que aparece en el sitio.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-md:w-full">
            <label className="flex h-10 w-[300px] flex-1 items-center gap-2 rounded-[10px] border border-line bg-white/[0.025] px-3 text-muted max-md:w-full">
              <Search size={15} className="shrink-0" />
              <input
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Buscar por nombre, código SENA o área..."
                className="w-full border-0 bg-transparent text-[11px] text-ink outline-none placeholder:text-muted/70"
              />
            </label>
            <div className="flex rounded-[10px] border border-line bg-white/[0.025] p-[3px] max-sm:w-full max-sm:justify-between">
              {FILTROS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    "h-8 rounded-[7px] px-3 text-[10px] font-bold transition-all duration-200 max-sm:flex-1",
                    filtro === f ? "bg-neon text-[#071307]" : "bg-transparent text-muted",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={abrirNuevo}>
              <Plus size={15} strokeWidth={2.5} />
              Nuevo programa
            </PrimaryButton>
          </div>
        </div>

        {msg && (
          <p role="status" className="mb-2 min-h-[1.2em] text-[13px] text-neon">
            {msg}
          </p>
        )}

        <div className="overflow-auto rounded-[13px] border border-neon/10">
          <table className="w-full min-w-[850px] border-collapse">
            <thead className="bg-neon/[0.045]">
              {["PROGRAMA", "CÓDIGO", "NIVEL", "ÁREA", "DURACIÓN", "MODALIDAD", "ACCIONES"].map(
                (h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-[14px] py-[13px] text-left text-[9px] font-bold tracking-[0.4px] text-muted"
                  >
                    {h}
                  </th>
                ),
              )}
            </thead>
            <tbody>
              {col.cargando ? (
                <tr>
                  <td colSpan={7} className="px-[14px] py-10 text-center text-[12px] text-muted">
                    Cargando programas…
                  </td>
                </tr>
              ) : (
                filas.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-neon/[0.075] transition-colors duration-200 hover:bg-neon/[0.035]"
                  >
                    <td className="px-[14px] py-[13px] text-[10px] font-bold text-ink">{p.nombre}</td>
                    <td className="px-[14px] py-[13px] font-mono text-[10px] text-muted">{p.codigo}</td>
                    <td className="px-[14px] py-[13px]">
                      <NivelBadge nivel={nivelNorm(p) === "tecnologia" ? "Tecnólogo" : "Técnico"} />
                    </td>
                    <td className="px-[14px] py-[13px] text-[10px] text-muted">{p.area}</td>
                    <td className="px-[14px] py-[13px] text-[10px] text-muted">{p.duracion}</td>
                    <td className="px-[14px] py-[13px]">
                      <ModalidadBadge modalidad={p.modalidad || "Presencial"} />
                    </td>
                    <td className="px-[14px] py-[13px]">
                      <div className="flex gap-[6px]">
                        <button
                          title="Editar"
                          aria-label={`Editar ${p.nombre}`}
                          onClick={() => abrirEditar(p)}
                          className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-transparent bg-transparent text-neon transition-colors duration-200 hover:bg-white/5"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title="Eliminar"
                          aria-label={`Eliminar ${p.nombre}`}
                          onClick={() => setPorBorrar(p)}
                          className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-transparent bg-transparent text-danger transition-colors duration-200 hover:bg-white/5"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!col.cargando && filas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-[14px] py-10 text-center text-[12px] text-muted">
                    No se encontraron programas con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-1 pt-3 text-[11px] text-muted">
          {col.items.length} {col.items.length === 1 ? "programa" : "programas"} en total.
        </p>
      </section>

      <ProgramModal
        abierto={modalAbierto}
        programa={editando}
        guardando={guardando}
        error={errorModal}
        onCerrar={() => {
          setModalAbierto(false);
          setEditando(null);
          setErrorModal("");
        }}
        onGuardar={guardar}
      />
      <ConfirmModal
        abierto={porBorrar != null}
        titulo="¿Eliminar programa?"
        mensaje={`Se eliminará "${porBorrar?.nombre ?? ""}" del sitio público.`}
        confirmando={borrando}
        onCancelar={() => setPorBorrar(null)}
        onConfirmar={confirmarBorrado}
      />
    </>
  );
}
