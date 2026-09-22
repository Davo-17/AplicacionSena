import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AuthExpiredError,
  getToken,
  getYo,
  login as loginApi,
  logout as logoutApi,
  type Usuario,
} from "../lib/api";

interface AuthState {
  user: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  cargando: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setCargando(false);
      return;
    }
    getYo()
      .then((u) => {
        // Igual que el panel anterior: solo administradores.
        setUser(u.rol === "administrador" ? u : null);
        if (u.rol !== "administrador") logoutApi();
      })
      .catch(() => setUser(null))
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await loginApi(email, password);
    try {
      const u = await getYo();
      if (u.rol !== "administrador") {
        logoutApi();
        throw new Error("Esta zona es solo para administradores.");
      }
      setUser(u);
    } catch (e) {
      if (!(e instanceof Error) || e.message !== "Esta zona es solo para administradores.") {
        logoutApi();
      }
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
  }, []);

  useEffect(() => {
    const onExp = () => setUser(null);
    window.addEventListener("dajesa:logout", onExp);
    return () => window.removeEventListener("dajesa:logout", onExp);
  }, []);

  return <AuthContext.Provider value={{ user, cargando, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Traduce expiración de sesión a salida global (como el panel anterior). */
export function exigirSesion<T>(promesa: Promise<T>): Promise<T> {
  return promesa.catch((e) => {
    if (e instanceof AuthExpiredError) {
      window.dispatchEvent(new Event("dajesa:logout"));
    }
    throw e;
  });
}
