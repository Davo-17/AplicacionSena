export default function ConfirmModal({
  abierto,
  titulo,
  mensaje,
  confirmando,
  onCancelar,
  onConfirmar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  confirmando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="anim-enter w-full max-w-[400px] rounded-2xl border border-line bg-panel p-6 text-center">
        <div className="mx-auto mb-3 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-danger/10 text-danger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-[17px] font-bold text-ink">{titulo}</h3>
        <p className="mb-5 text-[14px] text-muted">{mensaje}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-[10px] border border-line bg-transparent px-3 py-3 text-[14px] font-bold text-muted transition-colors hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={confirmando}
            className="flex-1 rounded-[10px] bg-gradient-to-b from-[#f87171] to-[#dc2626] px-3 py-3 text-[14px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
          >
            {confirmando ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
