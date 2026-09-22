import { LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Field, PrimaryButton, TextInput } from "./ui";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <form
        onSubmit={enviar}
        className="anim-enter w-full max-w-[400px] rounded-2xl border border-line bg-panel p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-[42px] w-[42px] place-items-center overflow-hidden rounded-xl border border-neon/40 bg-white p-[3px]">
            <img src="logo-sena.png" alt="Logo SENA" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="font-extrabold tracking-[0.3px] text-ink">DAJESA</div>
            <div className="mt-[2px] text-[10px] text-muted">CFDCM — Panel Administrativo</div>
          </div>
        </div>
        <div className="grid gap-4">
          <Field label="Correo institucional" required>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@soy.sena.edu.co"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Contraseña" required>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>
          {error && (
            <p role="alert" className="text-[12px] font-semibold text-danger">
              ✕ {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={enviando} className="w-full disabled:opacity-60">
            <LogIn size={15} />
            {enviando ? "Verificando…" : "Ingresar"}
          </PrimaryButton>
          <p className="text-center text-[11px] text-muted">
            Solo cuentas de administrador (@soy.sena.edu.co).
          </p>
        </div>
      </form>
    </div>
  );
}
