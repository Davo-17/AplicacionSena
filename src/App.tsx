import { useState, useEffect } from "react";
import { loadPrograms, type Program } from "./data/programs";
import { loadEvidence, type Evidence } from "./data/evidence";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";

// ── SENA Logo ──────────────────────────────────────────────────────
function SenaLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#39A900" />
      <circle cx="50" cy="50" r="44" fill="white" />
      <circle cx="50" cy="50" r="40" fill="#39A900" />
      <text x="50" y="44" textAnchor="middle" fill="white" fontSize="16" fontFamily="Outfit, sans-serif" fontWeight="800" letterSpacing="2">SENA</text>
      <text x="50" y="62" textAnchor="middle" fill="#F5C800" fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600" letterSpacing="1">COLOMBIA</text>
      <path d="M25 70 Q50 78 75 70" stroke="#F5C800" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ── Public Program Card ────────────────────────────────────────────
function PublicProgramCard({ program, delay }: { program: Program; delay: number }) {
  const sofiaPlusUrl = `https://oferta.senasofiaplus.edu.co/sofia-oferta/buscar-oferta.html?nombrePrograma=${encodeURIComponent(program.name)}`;

  return (
    <a
      href={sofiaPlusUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="program-card block bg-white rounded-2xl border border-green-100 overflow-hidden group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: program.level === "Tecnólogo" ? "#1a2e0f" : "#e8f7de",
                  color: program.level === "Tecnólogo" ? "#F5C800" : "#2d8400",
                }}
              >
                {program.level}
              </span>
              <span className="text-xs text-gray-400 font-mono">{program.code}</span>
            </div>
            <h3 className="font-display font-700 text-gray-900 text-base leading-snug group-hover:text-green-700 transition-colors" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              {program.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{program.area}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg">{program.duration}</span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{ background: "#39A900" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2">{program.description}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {program.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">{s}</span>
          ))}
          {program.skills.length > 3 && (
            <span className="text-xs text-gray-400 px-1 py-0.5">+{program.skills.length - 3} más</span>
          )}
        </div>
      </div>

      <div
        className="px-5 py-2.5 border-t border-green-50 flex items-center justify-between"
        style={{ background: "#f8fef5" }}
      >
        <span className="text-xs text-gray-500">{program.modalidad}</span>
        <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
          Inscribirme en Sofía Plus
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  );
}

// ── Category Accordion ─────────────────────────────────────────────
function CategorySection({
  title,
  subtitle,
  programs,
  accentColor,
  icon,
}: {
  title: string;
  subtitle: string;
  programs: Program[];
  accentColor: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      <button
        className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-4 transition-all duration-200"
        style={{ background: open ? accentColor : "white" }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
            style={{
              background: open ? "rgba(255,255,255,0.2)" : accentColor + "18",
              color: open ? "white" : accentColor,
            }}
          >
            {icon}
          </div>
          <div>
            <h2
              className="font-display text-2xl font-800 leading-tight transition-colors duration-200"
              style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, color: open ? "white" : "#1a2e0f" }}
            >
              {title}
            </h2>
            <p className="text-sm mt-0.5 transition-colors duration-200" style={{ color: open ? "rgba(255,255,255,0.75)" : "#6b7280" }}>
              {subtitle} · {programs.length} programas disponibles
            </p>
          </div>
        </div>

        <div
          className="flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300"
          style={{
            borderColor: open ? "rgba(255,255,255,0.5)" : accentColor,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke={open ? "white" : accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="slide-down p-4 md:p-6 border-t" style={{ borderColor: accentColor + "20" }}>
          {programs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No hay programas en esta categoría aún.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((p, i) => (
                <PublicProgramCard key={p.id} program={p} delay={i * 50} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chatbot ────────────────────────────────────────────────────────
function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! 👋 Soy el asistente virtual del SENA. ¿En qué te puedo orientar sobre nuestra oferta educativa?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const responses: Record<string, string> = {
    inscri: "Para inscribirte, haz clic en cualquier programa de la página y te llevará directamente a **Sofía Plus** donde puedes registrarte. ¡El proceso es 100% gratuito!",
    requisito: "Necesitas: cédula o tarjeta de identidad y diploma de bachiller para tecnologías, o haber cursado noveno grado para técnicas.",
    tecnolog: "Los programas **Tecnológicos** duran 22–24 meses y otorgan título de Tecnólogo. Son más profundos y completos.",
    tecnic: "Los programas **Técnicos** duran 10–12 meses. Son perfectos para ingresar rápidamente al mercado laboral.",
    costo: "¡Todos los programas del SENA son **completamente gratuitos**! Es una entidad pública financiada por las empresas colombianas.",
    duracion: "Las técnicas duran 10–12 meses y las tecnologías 22–24 meses.",
    virtual: "Sí, varios programas tienen modalidad virtual o a distancia. Puedes verlo en la ficha de cada programa.",
    sofia: "Sofía Plus es el sistema de inscripciones del SENA. Ingresa a **sofiaplus.edu.co**, crea tu usuario y elige el programa.",
    default: "Para más información llama a la línea gratuita: **01 8000 910 270** o visita **sena.edu.co**. ¿Hay algo más en lo que pueda ayudarte?",
  };

  function getResponse(msg: string) {
    const lower = msg.toLowerCase();
    for (const [key, val] of Object.entries(responses)) {
      if (key !== "default" && lower.includes(key)) return val;
    }
    return responses.default;
  }

  function send() {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: getResponse(text) }]);
      setTyping(false);
    }, 800 + Math.random() * 500);
  }

  return (
    <>
      <button
        className="chatbot-pulse fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 hover:scale-110"
        style={{ background: "#39A900" }}
        onClick={() => setOpen(!open)}
        aria-label="Abrir asistente"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 4l14 14M18 4L4 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z" fill="white" />
            <circle cx="8" cy="10" r="1.5" fill="#39A900" />
            <circle cx="12" cy="10" r="1.5" fill="#39A900" />
            <circle cx="16" cy="10" r="1.5" fill="#39A900" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: "480px" }}>
          <div className="p-4 flex items-center gap-3" style={{ background: "#39A900" }}>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
              <SenaLogo size={28} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Asesor Virtual SENA</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-200 animate-pulse" />
                <p className="text-green-100 text-xs">En línea</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: m.from === "user" ? "#39A900" : "#f3f4f6",
                    color: m.from === "user" ? "white" : "#1f2937",
                    borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                />
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 text-sm px-3.5 py-2 rounded-xl border border-gray-200 outline-none focus:border-green-400 transition-colors"
            />
            <button onClick={send} className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80" style={{ background: "#39A900" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8l12-6-6 12V9L2 8z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Recommender ────────────────────────────────────────────────────
function RecommenderQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const questions = [
    { question: "¿Cuánto tiempo tienes disponible para estudiar?", options: ["6–12 meses", "12–24 meses", "Más de 24 meses"] },
    { question: "¿Cuál es tu área de mayor interés?", options: ["Tecnología y Sistemas", "Negocios y Finanzas", "Artes, Diseño o Gastronomía", "Construcción o Mecánica"] },
    { question: "¿Prefieres estudiar en modalidad?", options: ["Presencial", "Virtual o a distancia", "Me es indiferente"] },
  ];

  function answer(opt: string) {
    const newAnswers = [...answers, opt];
    if (step < questions.length - 1) {
      setAnswers(newAnswers);
      setStep(step + 1);
    } else {
      const area = newAnswers[1];
      const time = newAnswers[0];
      let rec = "";
      if (area === "Tecnología y Sistemas" && time === "6–12 meses") rec = "Técnica en Sistemas";
      else if (area === "Tecnología y Sistemas") rec = "Tecnología en Análisis y Desarrollo de Software";
      else if (area === "Negocios y Finanzas" && time === "6–12 meses") rec = "Técnica en Contabilización de Operaciones Comerciales";
      else if (area === "Negocios y Finanzas") rec = "Tecnología en Gestión Empresarial";
      else if (area === "Artes, Diseño o Gastronomía") rec = "Técnica en Cocina o Tecnología en Producción Audiovisual";
      else if (area === "Construcción o Mecánica" && time === "6–12 meses") rec = "Técnica en Electricidad o Mecánica Automotriz";
      else rec = "Tecnología en Construcción de Obras Civiles";
      setResult(rec);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#1a2e0f" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 12a1 1 0 110-2 1 1 0 010 2zm1-4H9V6h2v4z" fill="#F5C800" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-800 text-lg text-gray-900" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>Encuentra tu programa ideal</h3>
          <p className="text-xs text-gray-500">Responde 3 preguntas rápidas</p>
        </div>
      </div>

      {result ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#e8f7de" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14l7 7L23 7" stroke="#39A900" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-2">Tu programa recomendado es:</p>
          <p className="font-display font-700 text-xl text-gray-900 mb-5" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>{result}</p>
          <button onClick={() => { setStep(0); setAnswers([]); setResult(null); }} className="text-sm text-green-700 underline underline-offset-2">
            Intentar de nuevo
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-1 mb-5">
            {questions.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= step ? "#39A900" : "#e5e7eb" }} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-4">{questions[step].question}</p>
          <div className="space-y-2">
            {questions[step].options.map((opt) => (
              <button key={opt} onClick={() => answer(opt)} className="w-full text-left text-sm px-4 py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-150 text-gray-700">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public Site ────────────────────────────────────────────────────
function PublicSite({ programs, evidence, onAdminClick }: { programs: Program[]; evidence: Evidence[]; onAdminClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tecnicas = programs.filter((p) => p.level === "Técnico");
  const tecnologias = programs.filter((p) => p.level === "Tecnólogo");

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.95)" : "white",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="float-logo">
              <SenaLogo size={48} />
            </div>
            <div>
              <p className="font-display font-800 text-gray-900 leading-none" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.1rem" }}>SENA</p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Oferta Educativa</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {["Inicio", "Programas", "Asistente IA"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-sm text-gray-600 hover:text-green-700 transition-colors font-medium">
                {item}
              </a>
            ))}
            <button
              onClick={onAdminClick}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4.5 6.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Administrativos
            </button>
          </nav>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a2e0f 0%, #2d5a1b 40%, #39A900 100%)", minHeight: "420px" }}
      >
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{ width: `${60 + i * 40}px`, height: `${60 + i * 40}px`, top: `${Math.sin(i) * 50 + 50}%`, left: `${(i * 5.5) % 100}%`, opacity: 0.3 - i * 0.01 }} />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-white/80 font-medium">Inscripciones abiertas 2026</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-800 text-white leading-tight mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>
              Transforma tu<br />
              <span style={{ color: "#F5C800" }}>futuro profesional</span>
            </h1>
            <p className="text-white/75 text-base md:text-lg max-w-md leading-relaxed mb-7">
              Explora más de {programs.length} programas técnicos y tecnológicos completamente gratuitos. Haz clic en cualquier programa para inscribirte directamente en Sofía Plus.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <a href="#programas" className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90" style={{ background: "#F5C800", color: "#1a2e0f" }}>
                Ver programas
              </a>
              <a href="https://oferta.senasofiaplus.edu.co/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition-all duration-200">
                Ir a Sofía Plus
              </a>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="float-logo">
              <div className="w-44 h-44 rounded-full border-4 border-white/20 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <SenaLogo size={110} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "100%", label: "Gratuito" },
              { value: `${programs.length}+`, label: "Programas" },
              { value: "2", label: "Niveles de formación" },
              { value: "4M+", label: "Aprendices en Colombia" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display font-800 text-xl md:text-2xl" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, color: "#F5C800" }}>{stat.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly activity evidence */}
      {evidence.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-14" id="evidencias">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#39A900" }}>Actividad semanal</p>
            <h2 className="font-display text-3xl md:text-4xl font-800 text-gray-900" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>Evidencias de actividades SENA</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">Conoce las actividades realizadas esta semana en el centro de CFDM.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {evidence.map((item) => (
              <article key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {item.fileType.startsWith("image/") ? (
                  <img src={item.fileData} alt={item.description} className="w-full h-52 object-cover bg-gray-50" />
                ) : (
                  <div className="h-52 flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-400">
                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                      <path d="M11 4h14l6 6v28H11V4z" fill="#e8f7de" stroke="#39A900" strokeWidth="2" />
                      <path d="M25 4v7h6M16 20h10M16 26h10M16 32h6" stroke="#39A900" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs font-medium">{item.fileName}</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("es-CO")}</span>
                    <a href={item.fileData} target="_blank" rel="noopener noreferrer" download={item.fileName} className="text-xs font-semibold text-green-700 hover:text-green-900 transition-colors">
                      Abrir evidencia →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Programs */}
      <section id="programas" className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#39A900" }}>Oferta formativa</p>
          <h2 className="font-display text-3xl md:text-4xl font-800 text-gray-900" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>Explora nuestros programas</h2>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto text-sm">
            Haz clic en cada categoría para ver todos los programas. Al seleccionar uno serás dirigido a Sofía Plus para inscribirte.
          </p>
        </div>

        <div className="space-y-4">
          <CategorySection
            title="Técnicas"
            subtitle="Programas de nivel técnico"
            programs={tecnicas}
            accentColor="#39A900"
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L3 7v8l8 5 8-5V7L11 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M3 7l8 5 8-5M11 12v8" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
          <CategorySection
            title="Tecnologías"
            subtitle="Programas de nivel tecnológico"
            programs={tecnologias}
            accentColor="#1a2e0f"
            icon={
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="12" y="12" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
        </div>
      </section>

      {/* AI Section */}
      <section id="asistente-ia" className="py-14" style={{ background: "linear-gradient(180deg, #f8faf6 0%, #e8f7de 100%)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#39A900" }}>Inteligencia Artificial</p>
            <h2 className="font-display text-3xl md:text-4xl font-800 text-gray-900" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>Herramientas inteligentes</h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto text-sm">Usa nuestro asistente y el recomendador para encontrar el programa ideal para ti.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#39A900" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M18 2H2a1 1 0 00-1 1v10a1 1 0 001 1h4l4 4 4-4h4a1 1 0 001-1V3a1 1 0 00-1-1z" fill="white" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-800 text-lg text-gray-900" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>Asesor Virtual 24/7</h3>
                  <p className="text-xs text-gray-500">Resuelve tus dudas al instante</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">Nuestro asistente de IA puede orientarte sobre programas, requisitos, duración, modalidades e inscripciones.</p>
              <ul className="space-y-2 mb-6">
                {["Información de programas", "Requisitos de inscripción", "Cómo usar Sofía Plus", "Costos y gratuidad"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#e8f7de" }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#39A900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                style={{ background: "#39A900", color: "white" }}
                onClick={() => document.querySelector<HTMLButtonElement>(".chatbot-pulse")?.click()}
              >
                Chatear ahora →
              </button>
            </div>
            <RecommenderQuiz />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#1a2e0f" }}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <SenaLogo size={40} />
                <div>
                  <p className="font-display font-800 text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SENA</p>
                  <p className="text-xs text-green-400">Colombia</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Servicio Nacional de Aprendizaje. Formación para el trabajo y el desarrollo humano.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Programas</p>
              <ul className="space-y-2">
                {["Técnicas", "Tecnologías", "Especialización", "Cursos cortos"].map((i) => (
                  <li key={i}><a href="#programas" className="text-sm text-gray-400 hover:text-green-400 transition-colors">{i}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Institución</p>
              <ul className="space-y-2">
                {["Sobre el SENA", "Sofía Plus", "Aprendices", "Empresas"].map((i) => (
                  <li key={i}><a href="https://sena.edu.co" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-green-400 transition-colors">{i}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Contacto</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 01 8000 910 270</li>
                <li>🌐 sena.edu.co</li>
                <li>📧 info@sena.edu.co</li>
              </ul>
              <div className="flex gap-3 mt-4">
                {[{ l: "F", h: "https://facebook.com/SENA.Colombia" }, { l: "Y", h: "https://youtube.com/@SENAColombia" }, { l: "I", h: "https://instagram.com/senacolombia" }].map((sn) => (
                  <a key={sn.l} href={sn.h} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors hover:bg-green-800" style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>
                    {sn.l}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© 2026 Servicio Nacional de Aprendizaje — SENA. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="text-xs text-gray-600 hover:text-green-400 transition-colors">Política de privacidad</a>
              <a href="#" className="text-xs text-gray-600 hover:text-green-400 transition-colors">Términos de uso</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────
type View = "public" | "login" | "admin";

export default function App() {
  const [view, setView] = useState<View>("public");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [programs, setPrograms] = useState<Program[]>(() => loadPrograms());
  const [evidence, setEvidence] = useState<Evidence[]>(() => loadEvidence());

  function handleLogin(u: { name: string; role: string }) {
    setUser(u);
    setView("admin");
  }

  function handleLogout() {
    setUser(null);
    setView("public");
  }

  if (view === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (view === "admin" && user) {
    return (
      <AdminDashboard
        programs={programs}
        onUpdate={setPrograms}
        evidence={evidence}
        onEvidenceUpdate={setEvidence}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return <PublicSite programs={programs} evidence={evidence} onAdminClick={() => setView("login")} />;
}
