"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconDashboard,
  IconCases,
  IconUpload,
  IconClipboard,
  IconUsers,
  IconActivity,
  IconLogout,
  IconPlus,
  IconHealth,
} from "@/components/ui/icons";

type NavItem = {
  label: string;
  href: string;
  icon: typeof IconDashboard;
  section: "principal" | "operación" | "administración";
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: IconDashboard, section: "principal" },
  { label: "Casos", href: "/casos", icon: IconCases, section: "operación" },
  { label: "Registrar caso", href: "/casos/nuevo", icon: IconPlus, section: "operación" },
  { label: "Carga mensual", href: "/carga-mensual", icon: IconUpload, section: "operación" },
  { label: "Consolidados", href: "/consolidados", icon: IconClipboard, section: "operación" },
  { label: "Población", href: "/poblacion", icon: IconUsers, section: "operación" },
  { label: "Auditoría", href: "/auditoria", icon: IconActivity, section: "administración" },
  { label: "Usuarios", href: "/usuarios", icon: IconUsers, section: "administración" },
];

const sectionLabels: Record<NavItem["section"], string> = {
  principal: "Panel principal",
  operación: "Operación",
  administración: "Administración",
};

const sectionOrder: NavItem["section"][] = ["principal", "operación", "administración"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.ok) setUser(json.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setClosing(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "··";

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN_MUNICIPAL: "Admin Municipal",
    DIGITADOR: "Digitador",
    ANALISTA: "Analista",
  };

  return (
    <aside className="flex flex-col border-b border-ink-800/60 bg-ink-950 text-ink-100 lg:min-h-screen lg:border-b-0 lg:border-r lg:border-ink-800/60">
      {/* Brand */}
      <div className="border-b border-ink-800/60 px-5 py-6 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
            <IconHealth className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-accent-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">AMVA</div>
            <div className="truncate font-display text-base font-semibold text-white">Salud Adolescente</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 lg:px-4">
        {sectionOrder.map((section) => {
          const items = navItems.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section} className="mb-5">
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                {sectionLabels[section]}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ease-out-expo " +
                        (active
                          ? "bg-gradient-to-r from-brand-600 to-brand-700 font-medium text-white shadow-glow"
                          : "text-ink-300 hover:bg-ink-900 hover:text-white")
                      }
                    >
                      <Icon className={"h-4 w-4 shrink-0 transition-transform duration-200 " + (active ? "" : "group-hover:scale-110")} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-300" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User card + logout */}
      <div className="border-t border-ink-800/60 p-3 lg:p-4">
        <div className="rounded-2xl bg-ink-900/60 p-3 ring-1 ring-ink-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white ring-2 ring-ink-950">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {user?.name ?? "Cargando…"}
              </div>
              <div className="truncate text-[11px] text-ink-400">
                {user ? roleLabel[user.role] ?? user.role : "—"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={closing}
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-all duration-200 hover:bg-ink-800 hover:text-rose-400 disabled:opacity-60"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
