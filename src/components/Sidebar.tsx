"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const items = [
  ["Dashboard", "/dashboard"],
  ["Casos", "/casos"],
  ["Registrar caso", "/casos/nuevo"],
  ["Carga mensual", "/carga-mensual"],
  ["Consolidados", "/consolidados"],
  ["Población", "/poblacion"],
  ["Usuarios", "/usuarios"],
  ["Auditoría", "/auditoria"],
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  async function handleLogout() {
    setClosing(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <aside className="border-b border-slate-200 bg-slate-950 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r lg:border-slate-800">
      <div className="flex h-full flex-col p-5 lg:p-7">
        <div className="mb-7">
          <div className="text-xs font-semibold uppercase tracking-[.22em] text-teal-300">AMVA</div>
          <div className="mt-1 text-xl font-semibold">Salud Adolescente</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">Morbilidad · Mortalidad · Población</div>
        </div>
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {items.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-xl px-3 py-2.5 text-sm transition " +
                  (active
                    ? "bg-teal-700 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white")
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={closing}
            className="w-full rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:opacity-60"
          >
            {closing ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>
      </div>
    </aside>
  );
}
