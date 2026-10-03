import { PageHeader } from "@/components/PageHeader";

export default function UsersPage() {
  return <>
    <PageHeader title="Usuarios y roles" description="Base para controlar quién registra, revisa, cierra períodos y consulta información." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Super Admin","Gestión global"],["Admin municipal","Cierre y control local"],["Digitador","Registro y carga"],["Analista","Consulta y reportes"]].map(([t,d])=><div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="font-semibold">{t}</h2><p className="mt-2 text-sm text-slate-500">{d}</p></div>)}</div>
  </>;
}
