import { useCallback, useEffect, useState } from "react";
import { exigirSesion } from "../auth/AuthContext";

interface Recurso<T extends { id: number }, In> {
  listar: () => Promise<T[]>;
  crear: (d: In) => Promise<T>;
  editar: (id: number, d: In) => Promise<T>;
  borrar: (id: number) => Promise<void>;
}

/** CRUD con estado de edición, espejo del flujo del panel anterior. */
export function useCollection<T extends { id: number }, In>(recurso: Recurso<T, In>) {
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      setItems(await exigirSesion(recurso.listar()));
    } catch {
      /* el mensaje lo muestra quien llama */
    } finally {
      setCargando(false);
    }
  }, [recurso]);

  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = useCallback(
    async (datos: In) => {
      if (editingId == null) {
        await exigirSesion(recurso.crear(datos));
      } else {
        await exigirSesion(recurso.editar(editingId, datos));
      }
      setEditingId(null);
      await recargar();
    },
    [editingId, recargar, recurso],
  );

  const borrarUno = useCallback(
    async (id: number) => {
      await exigirSesion(recurso.borrar(id));
      if (editingId === id) setEditingId(null);
      await recargar();
    },
    [editingId, recargar, recurso],
  );

  return { items, cargando, editingId, setEditingId, guardar, borrarUno, recargar };
}
