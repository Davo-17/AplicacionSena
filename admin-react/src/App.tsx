import { useCallback, useEffect, useState } from "react";
import { AuthProvider, exigirSesion, useAuth } from "./auth/AuthContext";
import ArchivosSection from "./components/ArchivosSection";
import BitacoraSection from "./components/BitacoraSection";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Login from "./components/Login";
import ProgramsSection from "./components/ProgramsSection";
import { FichasSection, NovedadesSection, PostulacionesSection } from "./components/ResourceSections";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { ActivityCard, FollowCard } from "./components/TrackingCards";
import { api, nivelNorm } from "./lib/api";

interface Actividad {
  texto: string;
  tiempo: string;
}

function horaActual(): string {
  try {
    return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Ahora";
  }
}

function Panel() {
  const { user, cargando } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("programas");
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [notifRead, setNotifRead] = useState(false);

  const [total, setTotal] = useState(0);
  const [tecnicos, setTecnicos] = useState(0);
  const [tecnologos, setTecnologos] = useState(0);
  const [areas, setAreas] = useState(0);
  const [actividad, setActividad] = useState<Actividad[]>([
    { texto: "Panel administrativo listo", tiempo: "Ahora" },
  ]);

  const [fichasTick, setFichasTick] = useState(0);
  const [ficha, setFicha] = useState("");
  const [evidenciasTick, setEvidenciasTick] = useState(0);

  const log = useCallback((texto: string) => {
    setActividad((a) => [{ texto, tiempo: horaActual() }, ...a].slice(0, 8));
  }, []);

  const recargarStats = useCallback(async () => {
    try {
      const programas = await exigirSesion(api.programas.listar());
      setTotal(programas.length);
      setTecnicos(programas.filter((p) => nivelNorm(p) === "tecnica").length);
      setTecnologos(programas.filter((p) => nivelNorm(p) === "tecnologia").length);
      setAreas(new Set(programas.map((p) => (p.area || "").trim()).filter(Boolean)).size);
    } catch {
      /* sin sesión o backend caído: se conservan los últimos valores */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  useEffect(() => {
    if (user) recargarStats();
  }, [user, recargarStats]);

  // Los cambios en programas/fichas/bitácora refrescan las cifras del hero.
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(recargarStats, 800);
    return () => clearTimeout(t);
  }, [actividad, user, recargarStats]);

  // Marca las secciones laterales según el scroll (igual que el panel anterior).
  useEffect(() => {
    if (!user) return;
    const ids = ["programas", "novedades", "postulaciones", "fichas", "bitacora"];
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveNav(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [user]);

  if (cargando) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-[13px] text-muted">
        Verificando sesión…
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <Header
        query={query}
        onQuery={setQuery}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
        onMenu={() => setSidebarOpen((o) => !o)}
        notifRead={notifRead}
        onNotif={() => setNotifRead(true)}
      />

      <div className="grid min-h-[calc(100vh-72px)] grid-cols-[260px_minmax(0,1fr)] max-lg:grid-cols-1">
        <Sidebar
          open={sidebarOpen}
          active={activeNav}
          onNavigate={(id) => {
            setActiveNav(id);
            setSidebarOpen(false);
          }}
        />

        <main className="min-w-0 px-[30px] pb-[50px] pt-7 max-md:px-[15px] max-md:pt-[18px]">
          <div className="mx-auto grid max-w-[1330px] content-start gap-[15px]">
            <Hero
              total={total}
              tecnicos={tecnicos}
              tecnologos={tecnologos}
              areas={areas}
              onNuevoPrograma={() =>
                window.dispatchEvent(new Event("dajesa:nuevo-programa"))
              }
            />

            <div className="grid items-start gap-[15px] lg:grid-cols-[1.35fr_0.95fr]">
              <FollowCard areas={areas} total={total} />
              <ActivityCard items={actividad} />
            </div>

            <div id="programas" className="scroll-mt-[80px]">
              <ProgramsSection query={query} onQuery={setQuery} log={log} />
            </div>

            <div className="grid items-start gap-[15px] lg:grid-cols-2" id="novedades">
              <NovedadesSection log={log} />
              <div id="postulaciones" className="contents scroll-mt-[80px]">
                <PostulacionesSection log={log} />
              </div>
            </div>

            <div id="fichas" className="grid scroll-mt-[80px] items-start gap-[15px]">
              <FichasSection log={log} onChanged={() => setFichasTick((t) => t + 1)} />
            </div>

            <div id="bitacora" className="grid scroll-mt-[80px] items-start gap-[15px]">
              <BitacoraSection
                fichasTick={fichasTick}
                ficha={ficha}
                onFicha={setFicha}
                log={log}
                onChanged={() => setEvidenciasTick((t) => t + 1)}
              />
              <ArchivosSection ficha={ficha} tick={evidenciasTick} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Panel />
      </ToastProvider>
    </AuthProvider>
  );
}
