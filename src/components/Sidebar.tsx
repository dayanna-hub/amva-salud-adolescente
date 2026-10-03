import Link from "next/link";

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
  return (
    <aside className="border-b border-slate-200 bg-slate-950 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r lg:border-slate-800">
      <div className="p-5 lg:p-7">
        <div className="mb-7">
          <div className="text-xs font-semibold uppercase tracking-[.22em] text-teal-300">AMVA</div>
          <div className="mt-1 text-xl font-semibold">Salud Adolescente</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">Morbilidad · Mortalidad · Población</div>
        </div>
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
          {items.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
