import { ImportPanel } from "@/components/ImportPanel";
import { PageHeader } from "@/components/PageHeader";

const modes = [
  ["Casos individuales", "Cada fila representa un caso. La plataforma genera el consolidado mensual automáticamente."],
  ["Consolidado mensual", "Cada fila representa una combinación de variables y una cantidad de casos."],
  ["Plantillas controladas", "La plataforma suministrará formatos estandarizados para reducir errores de carga."],
];

export default function MonthlyLoadPage() {
  return <>
    <PageHeader title="Carga mensual" description="Dos caminos de captura, una sola capa de análisis. El período evita mezclar o duplicar casos individuales con consolidados." />
    <div className="mb-6 grid gap-4 md:grid-cols-3">{modes.map(([t,d])=><div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{d}</p></div>)}</div>
    <ImportPanel />
  </>;
}
