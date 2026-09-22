import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Toast {
  id: number;
  texto: string;
}

const ToastContext = createContext<(texto: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const mostrar = useCallback((texto: string) => {
    const id = ++idRef.current;
    setAvisos((a) => [...a.slice(-2), { id, texto }]);
    setTimeout(() => setAvisos((a) => a.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {avisos.map((t) => (
          <div
            key={t.id}
            role="status"
            className="anim-enter rounded-xl border border-neon/30 bg-panel px-5 py-3 text-[13px] font-semibold text-ink shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          >
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
