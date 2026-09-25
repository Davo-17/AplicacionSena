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

/** Login principal del sitio (fuera del panel): ahí se vuelve al salir. */
const LOGIN_PRINCIPAL = "/login.html";

function irALoginPrincipal() {
  window.location.replace(LOGIN_PRINCIPAL);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    if (!getToken()) {
      setCargando(false);
      return;
    }
    let vivo = true;
    // Si el backend no responde, no colgamos el splash: se cae al login.
    const limite = new Promise<null>((resolver) => setTimeout(() => resolver(null), 8000));
    Promise.race([getYo(), limite])
      .then((u) => {
        if (!vivo) return;
        if (!u) {
          setUser(null);
          return;
        }
        // Igual que el panel anterior: solo administradores.
        setUser(u.rol === "administrador" ? u : null);
        if (u.rol !== "administrador") logoutApi();
      })
      .catch(() => {
        if (vivo) setUser(null);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
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
    // Al salir del panel se vuelve al login principal, no al del panel.
    irALoginPrincipal();
  }, []);

  useEffect(() => {
    // Sesión expirada a mitad del trabajo: también vuelve al login principal.
    const onExp = () => {
      setUser(null);
      irALoginPrincipal();
    };
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
