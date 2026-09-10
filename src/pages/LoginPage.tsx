import { useState } from "react";

interface Props {
  onLogin: (user: { name: string; role: string }) => void;
}

// Demo credentials — in production these would come from a real auth backend
const ADMINS = [
  { username: "admin", password: "sena2026", name: "Administrador General", role: "Administrador" },
  { username: "coord", password: "coord123", name: "Coordinador Académico", role: "Coordinador" },
];

function SenaLogo({ size = 56 }: { size?: number }) {
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

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const match = ADMINS.find(
        (a) => a.username === username.trim() && a.password === password
      );
      if (match) {
        onLogin({ name: match.name, role: match.role });
      } else {
        setError("Usuario o contraseña incorrectos. Verifica tus credenciales.");
        setLoading(false);
      }
    }, 700);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #1a2e0f 0%, #2d5a1b 50%, #39A900 100%)" }}
    >
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-14">
        <div className="flex items-center gap-3">
          <div className="float-logo">
            <SenaLogo size={48} />
          </div>
          <div>
            <p className="font-display font-800 text-white text-xl" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SENA</p>
            <p className="text-green-300 text-xs">Portal Administrativo</p>
          </div>
        </div>

        <div>
          <h1 className="font-display text-5xl font-800 text-white leading-tight mb-5" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>
            Gestión de<br />
            <span style={{ color: "#F5C800" }}>Oferta Educativa</span>
          </h1>
          <p className="text-green-200 text-base leading-relaxed max-w-sm">
            Administra los programas de formación técnica y tecnológica del SENA de manera centralizada y eficiente.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: "📋", label: "Gestión de programas", desc: "Crea, edita y publica programas" },
              { icon: "👥", label: "Control de contenido", desc: "Administra la información visible" },
              { icon: "📊", label: "Estadísticas", desc: "Visualiza métricas en tiempo real" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(255,255,255,0.1)" }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.label}</p>
                  <p className="text-green-300 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-green-500 text-xs">© 2026 SENA Colombia — Acceso restringido al personal autorizado</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="float-logo">
                <SenaLogo size={56} />
              </div>
            </div>

            <div className="mb-7">
              <h2 className="font-display font-800 text-2xl text-gray-900 mb-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>
                Iniciar sesión
              </h2>
              <p className="text-sm text-gray-500">Acceso exclusivo para personal administrativo</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-100 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPwd ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0 mt-0.5" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                    <path d="M8 5v4M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-60 mt-2"
                style={{ background: "#39A900", color: "white" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  "Ingresar al panel"
                )}
              </button>
            </form>

            <div className="mt-6 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700 font-semibold mb-1">Credenciales de demo</p>
              <p className="text-xs text-amber-600">Usuario: <code className="bg-amber-100 px-1 rounded">admin</code> / Contraseña: <code className="bg-amber-100 px-1 rounded">sena2026</code></p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              ¿Eres aprendiz?{" "}
              <a href="/" className="text-green-600 hover:underline font-medium">
                Ver oferta educativa
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
