import { useState } from "react";
import { type Program, savePrograms } from "../data/programs";
import { type Evidence, saveEvidence } from "../data/evidence";

interface Props {
  programs: Program[];
  onUpdate: (programs: Program[]) => void;
  evidence: Evidence[];
  onEvidenceUpdate: (evidence: Evidence[]) => void;
  user: { name: string; role: string };
  onLogout: () => void;
}

const AREAS = [
  "Tecnología de la Información y las Comunicaciones",
  "Finanzas y Administración",
  "Industria de la Alimentación",
  "Educación",
  "Turismo, Hotelería y Restauración",
  "Electricidad y Energía",
  "Mecánica",
  "Trabajo Social y Desarrollo Comunitario",
  "Comunicación, Arte y Diseño",
  "Gestión del Talento Humano",
  "Construcción e Infraestructura",
  "Comercio, Marketing y Logística",
  "Otra",
];

const EMPTY_PROGRAM: Omit<Program, "id"> = {
  name: "",
  code: "",
  duration: "",
  level: "Técnico",
  area: "",
  description: "",
  skills: [],
  modalidad: "Presencial",
  titulacion: "",
};

function SenaLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="#39A900" />
      <circle cx="50" cy="50" r="44" fill="white" />
      <circle cx="50" cy="50" r="40" fill="#39A900" />
      <text x="50" y="44" textAnchor="middle" fill="white" fontSize="16" fontFamily="Outfit, sans-serif" fontWeight="800" letterSpacing="2">SENA</text>
      <text x="50" y="62" textAnchor="middle" fill="#F5C800" fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600" letterSpacing="1">COLOMBIA</text>
      <path d="M25 70 Q50 78 75 70" stroke="#F5C800" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ── Program Form Modal ─────────────────────────────────────────────
function ProgramModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Program | null;
  onSave: (p: Program) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Program, "id">>(
    initial ? { ...initial } : { ...EMPTY_PROGRAM }
  );
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      set("skills", [...form.skills, s]);
    }
    setSkillInput("");
  }

  function removeSkill(s: string) {
    set("skills", form.skills.filter((x) => x !== s));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!form.code.trim()) e.code = "Código requerido";
    if (!form.duration.trim()) e.duration = "Duración requerida";
    if (!form.area.trim()) e.area = "Área requerida";
    if (!form.description.trim()) e.description = "Descripción requerida";
    if (!form.titulacion.trim()) e.titulacion = "Titulación requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      ...form,
      id: initial?.id ?? `p_${Date.now()}`,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-display font-800 text-lg text-gray-900" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>
            {initial ? "Editar programa" : "Nuevo programa"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Nivel */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel de formación</label>
            <div className="flex gap-2">
              {(["Técnico", "Tecnólogo"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => set("level", lvl)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150"
                  style={{
                    borderColor: form.level === lvl ? "#39A900" : "#e5e7eb",
                    background: form.level === lvl ? "#e8f7de" : "white",
                    color: form.level === lvl ? "#2d8400" : "#6b7280",
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre del programa *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej: Técnica en Sistemas"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-50"
                style={{ borderColor: errors.name ? "#ef4444" : "#e5e7eb" }}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Código SENA *</label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="Ej: 228118"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-50"
                style={{ borderColor: errors.code ? "#ef4444" : "#e5e7eb" }}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* Area & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Área de conocimiento *</label>
              <select
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-green-400 bg-white"
                style={{ borderColor: errors.area ? "#ef4444" : "#e5e7eb" }}
              >
                <option value="">Selecciona un área</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duración *</label>
              <input
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="Ej: 12 meses"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-50"
                style={{ borderColor: errors.duration ? "#ef4444" : "#e5e7eb" }}
              />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div>
          </div>

          {/* Modalidad & Titulacion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modalidad</label>
              <select
                value={form.modalidad}
                onChange={(e) => set("modalidad", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 bg-white"
              >
                <option>Presencial</option>
                <option>Virtual</option>
                <option>A distancia</option>
                <option>Presencial / Virtual</option>
                <option>Presencial / A distancia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Titulación *</label>
              <input
                value={form.titulacion}
                onChange={(e) => set("titulacion", e.target.value)}
                placeholder="Ej: Técnico en Sistemas"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-50"
                style={{ borderColor: errors.titulacion ? "#ef4444" : "#e5e7eb" }}
              />
              {errors.titulacion && <p className="text-xs text-red-500 mt-1">{errors.titulacion}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descripción del programa *</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe de qué trata el programa, qué forma y para qué perfil..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-green-400 focus:ring-2 focus:ring-green-50 resize-none"
              style={{ borderColor: errors.description ? "#ef4444" : "#e5e7eb" }}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Competencias clave</label>
            <div className="flex gap-2 mb-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Escribe y presiona Enter o +"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 transition-all"
              />
              <button
                type="button"
                onClick={addSkill}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: "#39A900" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-800 border border-green-100 px-2.5 py-1 rounded-full">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-green-600 hover:text-red-500 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
            style={{ background: "#39A900", color: "white" }}
          >
            {initial ? "Guardar cambios" : "Crear programa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-display font-700 text-gray-900 text-center mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>¿Eliminar programa?</h3>
        <p className="text-sm text-gray-500 text-center mb-5">
          Se eliminará <strong>"{name}"</strong> permanentemente. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function AdminDashboard({ programs, onUpdate, evidence, onEvidenceUpdate, user, onLogout }: Props) {
  const [modal, setModal] = useState<{ type: "create" | "edit"; program?: Program } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<"all" | "Técnico" | "Tecnólogo">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState<File | null>(null);

  const tecnicas = programs.filter((p) => p.level === "Técnico");
  const tecnologias = programs.filter((p) => p.level === "Tecnólogo");

  const filtered = programs.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.area.toLowerCase().includes(search.toLowerCase()) ||
      p.code.includes(search);
    const matchLevel = filterLevel === "all" || p.level === filterLevel;
    return matchSearch && matchLevel;
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave(p: Program) {
    let updated: Program[];
    if (modal?.type === "edit") {
      updated = programs.map((x) => x.id === p.id ? p : x);
      showToast("Programa actualizado correctamente");
    } else {
      updated = [...programs, p];
      showToast("Programa creado correctamente");
    }
    savePrograms(updated);
    onUpdate(updated);
    setModal(null);
  }

  function handleDelete(p: Program) {
    const updated = programs.filter((x) => x.id !== p.id);
    savePrograms(updated);
    onUpdate(updated);
    setDeleteTarget(null);
    showToast("Programa eliminado");
  }

  function handleEvidenceUpload() {
    const file = selectedEvidenceFile;
    if (!file) return;
    if (!evidenceDescription.trim()) {
      showToast("Escribe una descripción para la evidencia");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("El archivo no puede superar 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const item: Evidence = {
        id: `e_${Date.now()}`,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileData: String(reader.result),
        description: evidenceDescription.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [item, ...evidence];
      saveEvidence(updated);
      onEvidenceUpdate(updated);
      setEvidenceDescription("");
      setSelectedEvidenceFile(null);
      setFileInputKey((key) => key + 1);
      showToast("Evidencia publicada correctamente");
    };
    reader.readAsDataURL(file);
  }

  function handleEvidenceDelete(id: string) {
    const updated = evidence.filter((item) => item.id !== id);
    saveEvidence(updated);
    onEvidenceUpdate(updated);
    showToast("Evidencia eliminada");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="float-logo">
              <SenaLogo size={36} />
            </div>
            <div>
              <p className="font-display font-800 text-gray-900 text-sm leading-none" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SENA — Panel Administrativo</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name[0]}
              </div>
              <span className="text-xs font-semibold text-green-800">{user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 7h7M9 5l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 3V2H2v10h6v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total programas", value: programs.length, color: "#39A900", bg: "#e8f7de" },
            { label: "Técnicas", value: tecnicas.length, color: "#2d8400", bg: "#d1f0c2" },
            { label: "Tecnologías", value: tecnologias.length, color: "#1a2e0f", bg: "#c8dbbe" },
            { label: "Áreas cubiertas", value: new Set(programs.map((p) => p.area)).size, color: "#F5C800", bg: "#fef9c3" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o área..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 transition-all bg-white"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "Técnico", "Tecnólogo"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: filterLevel === lvl ? "#1a2e0f" : "white",
                  color: filterLevel === lvl ? "white" : "#6b7280",
                  border: filterLevel === lvl ? "none" : "1px solid #e5e7eb",
                }}
              >
                {lvl === "all" ? "Todos" : lvl}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 whitespace-nowrap"
            style={{ background: "#39A900", color: "white" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nuevo programa
          </button>
        </div>

        {/* Programs table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#f8faf6" }}>
                  {["Programa", "Código", "Nivel", "Área", "Duración", "Modalidad", "Acciones"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                      No se encontraron programas con los filtros actuales
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900 max-w-xs leading-snug">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.titulacion}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-500">{p.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: p.level === "Tecnólogo" ? "#1a2e0f" : "#e8f7de",
                            color: p.level === "Tecnólogo" ? "#F5C800" : "#2d8400",
                          }}
                        >
                          {p.level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 max-w-[180px] leading-snug">{p.area}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-lg whitespace-nowrap">{p.duration}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500 whitespace-nowrap">{p.modalidad}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ type: "edit", program: p })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M10 2l2 2-8 8H2v-2L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 4h10M5 4V2.5h4V4M11 4l-.8 8H3.8L3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">Mostrando {filtered.length} de {programs.length} programas</p>
            </div>
          )}
        </div>

        {/* Weekly evidence */}
        <section className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#39A900" }}>Contenido público</p>
              <h2 className="font-display font-800 text-xl text-gray-900 mt-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>Adjuntar evidencia de las actividades SENA del centro de CFDM realizadas esta semana</h2>
              <p className="text-sm text-gray-500 mt-1">Las evidencias publicadas aparecerán en la página principal de usuarios.</p>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">{evidence.length} publicadas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <label htmlFor="evidence-description" className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción breve</label>
              <textarea
                id="evidence-description"
                value={evidenceDescription}
                onChange={(event) => setEvidenceDescription(event.target.value)}
                placeholder="Ej: Jornada de formación práctica en el taller..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-400 resize-none bg-white"
              />
            </div>
            <div>
              <label htmlFor={`evidence-file-${fileInputKey}`} className="block text-xs font-semibold text-gray-600 mb-1.5">Foto o documento</label>
              <input
                key={fileInputKey}
                id={`evidence-file-${fileInputKey}`}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={(event) => setSelectedEvidenceFile(event.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-green-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-green-800 hover:file:bg-green-200"
              />
              <p className="text-[11px] text-gray-400 mt-1 truncate">{selectedEvidenceFile ? selectedEvidenceFile.name : "Tamaño máximo: 5 MB"}</p>
            </div>
            <button
              type="button"
              onClick={handleEvidenceUpload}
              disabled={!selectedEvidenceFile}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: "#39A900" }}
            >
              <svg width="15" height="15" viewBox="0 0 17 17" fill="none"><path d="M8.5 3v8M5 7l3.5-4L12 7M3 12.5v1h11v-1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Subir evidencia
            </button>
          </div>

          {evidence.length > 0 && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {evidence.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                  {item.fileType.startsWith("image/") ? <img src={item.fileData} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-50" /> : <div className="w-14 h-14 rounded-lg bg-green-50 flex items-center justify-center text-green-700 text-xs font-bold">DOC</div>}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.fileName}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                  </div>
                  <button onClick={() => handleEvidenceDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors" title="Eliminar evidencia" aria-label={`Eliminar ${item.fileName}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M11 4l-.8 8H3.8L3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {modal && (
        <ProgramModal
          initial={modal.program ?? null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl flex items-center gap-2"
          style={{ background: "#39A900" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
