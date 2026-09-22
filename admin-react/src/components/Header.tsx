import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Header({
  query,
  onQuery,
  dark,
  onToggleTheme,
  onMenu,
  notifRead,
  onNotif,
}: {
  query: string;
  onQuery: (v: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
  onMenu: () => void;
  notifRead: boolean;
  onNotif: () => void;
}) {
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-[72px] items-center gap-[30px] border-b border-line bg-bg/90 px-7 backdrop-blur-[20px] max-md:gap-3 max-md:px-[15px]">
      <button
        onClick={onMenu}
        aria-label="Menú"
        className="hidden h-10 w-10 place-items-center rounded-[11px] border border-line bg-white/[0.025] text-muted max-lg:grid"
      >
        <Menu size={18} />
      </button>

      <div className="flex min-w-[265px] items-center gap-3 max-md:min-w-0">
        <div className="grid h-[42px] w-[42px] place-items-center overflow-hidden rounded-xl border border-neon/40 bg-white p-[3px] shadow-[0_0_24px_rgba(163,230,53,0.13)]">
          <img src="logo-sena.png" alt="Logo SENA" className="h-full w-full object-contain" />
        </div>
        <div>
          <div className="font-extrabold tracking-[0.3px] text-ink">DAJESA</div>
          <div className="mt-[2px] text-[10px] text-muted max-md:hidden">
            CFDCM — Panel Administrativo
          </div>
        </div>
      </div>

      <label className="flex h-[43px] max-w-[510px] flex-1 items-center gap-[10px] rounded-xl border border-neon/15 bg-white/[0.035] px-[15px] text-muted focus-within:border-neon/40 max-md:hidden">
        <Search size={17} className="shrink-0" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar programas, códigos, áreas..."
          className="w-full border-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted/70"
        />
      </label>

      <div className="ml-auto flex items-center gap-3 max-md:gap-[6px]">
        <a
          href="/"
          className="hidden h-10 items-center gap-2 rounded-[11px] border border-line bg-white/[0.025] px-3 text-[12px] font-bold text-muted transition-colors hover:border-neon/40 hover:text-neon md:inline-flex"
        >
          Ver sitio
        </a>
        <button
          onClick={onNotif}
          title="Notificaciones"
          className="relative grid h-10 w-10 place-items-center rounded-[11px] border border-line bg-white/[0.025] text-muted transition-colors duration-200 hover:border-neon/40 hover:text-neon"
        >
          <Bell size={18} />
          {!notifRead && (
            <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full bg-danger" />
          )}
        </button>
        <button
          onClick={onToggleTheme}
          title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="grid h-10 w-10 place-items-center rounded-[11px] border border-line bg-white/[0.025] text-muted transition-colors duration-200 hover:border-neon/40 hover:text-neon"
        >
          {dark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="relative flex items-center gap-[10px] border-l border-line pl-3 max-sm:hidden">
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuAbierto}
            className="flex items-center gap-[10px] rounded-[11px] bg-transparent p-0"
          >
            <div className="grid h-[38px] w-[38px] place-items-center rounded-full bg-gradient-to-br from-neon to-[#19a849] text-[14px] font-extrabold text-[#05200d]">
              {(user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <strong className="block max-w-[190px] truncate text-[12px] text-ink">
                {user?.email || "Administrador"}
              </strong>
              <small className="mt-[2px] block text-[10px] capitalize text-muted">
                {user?.rol || "Administrador"}
              </small>
            </div>
            <ChevronDown size={15} className="shrink-0 text-muted" />
          </button>
          {menuAbierto && (
            <>
              <button
                aria-label="Cerrar menú de usuario"
                className="fixed inset-0 z-10 cursor-default bg-transparent"
                onClick={() => setMenuAbierto(false)}
              />
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] rounded-xl border border-line bg-panel p-1 shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
                <div className="grid gap-[2px] border-b border-line px-3 py-2">
                  <strong className="truncate text-[13px] text-ink">{user?.email}</strong>
                  <small className="text-[11px] capitalize text-muted">{user?.rol}</small>
                </div>
                <a
                  href="/"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink hover:bg-neon/10"
                >
                  Ver sitio público
                </a>
                <button
                  onClick={() => {
                    setMenuAbierto(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-danger hover:bg-danger/10"
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
