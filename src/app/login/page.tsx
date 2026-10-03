"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconHealth, IconAlert, IconCheck } from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No fue posible iniciar sesión.");
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Mesh gradient */}
        <div className="absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-700/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
            <IconHealth className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">AMVA</div>
            <div className="font-display text-lg font-semibold text-white">Salud Adolescente</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-white xl:text-5xl">
            Morbilidad y mortalidad adolescente, en una sola plataforma.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-400">
            Registro, consolidación y análisis epidemiológico para los 10 municipios del Área Metropolitana del Valle de Aburrá.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Dos fuentes oficiales por período sin doble conteo",
              "Deduplicación por huella SHA-256",
              "Auditoría completa con atribución de usuario",
              "Tasas calculadas automáticamente por 100.000",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-ink-300">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-300">
                  <IconCheck className="h-3 w-3" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-ink-500">
          © {new Date().getFullYear()} Área Metropolitana del Valle de Aburrá
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
                <IconHealth className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">AMVA</div>
                <div className="font-display text-base font-semibold text-ink-900">Salud Adolescente</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">Bienvenido de nuevo</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              Inicia sesión para acceder a la plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@amva.gov.co"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Ingresando…
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-ink-200 bg-ink-50/50 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Usuarios sembrados (demo)
            </div>
            <div className="grid gap-1.5 text-xs text-ink-600">
              <div className="flex justify-between gap-3">
                <span className="font-mono">admin@amva.gov.co</span>
                <span className="text-ink-400">Super Admin</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-mono">medellin@amva.gov.co</span>
                <span className="text-ink-400">Admin Municipal</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-mono">caldas@amva.gov.co</span>
                <span className="text-ink-400">Digitador</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-mono">analista@amva.gov.co</span>
                <span className="text-ink-400">Analista</span>
              </div>
              <div className="mt-1 border-t border-ink-200 pt-1.5 text-ink-500">
                Contraseña por defecto: <span className="font-mono font-semibold text-ink-700">Cambiar123!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
