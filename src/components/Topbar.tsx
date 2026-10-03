"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconCalendar } from "@/components/ui/icons";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/casos": "Casos",
  "/casos/nuevo": "Registrar caso",
  "/carga-mensual": "Carga mensual",
  "/consolidados": "Consolidados",
  "/poblacion": "Población",
  "/auditoria": "Auditoría",
  "/usuarios": "Usuarios",
};

const today = new Date().toLocaleDateString("es-CO", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function Topbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.ok) setUser(json.user);
      })
      .catch(() => {});
  }, []);

  const label = routeLabels[pathname] ?? "AMVA";
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "··";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-ink-400">AMVA</span>
            <span className="text-ink-300">/</span>
            <span className="font-medium text-ink-900">{label}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs text-ink-500 ring-1 ring-ink-200/60 sm:flex">
            <IconCalendar className="h-3.5 w-3.5 text-brand-600" />
            <span className="capitalize">{today}</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-full bg-ink-50/80 py-1 pl-1 pr-3 ring-1 ring-ink-200/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-xs sm:block">
              <div className="font-medium text-ink-900">{user?.name ?? "—"}</div>
              <div className="text-ink-400">{user?.email ?? ""}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
