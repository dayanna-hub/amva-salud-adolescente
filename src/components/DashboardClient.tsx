"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TrendChart } from "@/components/TrendChart";

type Summary = {
  year: number;
  morbidity: number;
  mortality: number;
  population: number;
  mortalityRatePer100k: number | null;
  submissions: number;
  monthly: { month: number; morbidity: number; mortality: number }[];
  municipalities: { name: string; morbidity: number; mortality: number }[];
};

const format = new Intl.NumberFormat("es-CO");

export function DashboardClient() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/summary?year=${year}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "No fue posible cargar el tablero.");
        return json;
      })
      .then((json) => { if (!cancelled) { setData(json); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "No fue posible cargar el tablero."); });
    return () => { cancelled = true; };
  }, [year]);

  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error} Verifica que PostgreSQL/Neon esté conectado y que las migraciones estén aplicadas.</div>;
  if (!data) return <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando indicadores…</div>;

  return <>
    <div className="mb-5 flex justify-end">
      <label className="text-sm font-medium text-slate-600">Año
        <select className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[year - 2, year - 1, year, year + 1].map((y, i, arr) => arr.indexOf(y) === i && <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
    </div>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Casos de morbilidad" value={format.format(data.morbidity)} detail={`${data.year} · períodos validados/cerrados`} />
      <MetricCard label="Defunciones" value={format.format(data.mortality)} detail={data.mortalityRatePer100k === null ? "Falta base poblacional para tasa" : `${data.mortalityRatePer100k.toFixed(2)} por 100.000`} />
      <MetricCard label="Períodos reportados" value={format.format(data.submissions)} detail="Morbilidad + mortalidad" />
      <MetricCard label="Población adolescente" value={format.format(data.population)} detail={`Base poblacional ${data.year}`} />
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-3"><h2 className="font-semibold">Evolución mensual</h2><p className="text-sm text-slate-500">Solo incluye períodos validados o cerrados.</p></div>
        <TrendChart data={data.monthly} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="font-semibold">Lectura rápida</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-xl bg-slate-50 p-3"><span className="font-medium text-slate-950">Fuente:</span> casos individuales o consolidado mensual, nunca ambos para el mismo municipio/período/evento.</div>
          <div className="rounded-xl bg-slate-50 p-3"><span className="font-medium text-slate-950">Tasa de mortalidad:</span> {data.mortalityRatePer100k === null ? "pendiente de denominador poblacional" : `${data.mortalityRatePer100k.toFixed(2)} por 100.000 adolescentes`}.</div>
          <div className="rounded-xl bg-slate-50 p-3"><span className="font-medium text-slate-950">Población:</span> {format.format(data.population)} adolescentes cargados para {data.year}.</div>
        </div>
      </div>
    </section>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4"><h2 className="font-semibold">Resumen por municipio</h2><p className="text-sm text-slate-500">Totales disponibles para el año seleccionado.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="text-left text-slate-500"><tr><th className="py-3">Municipio</th><th>Morbilidad</th><th>Mortalidad</th></tr></thead>
          <tbody>{data.municipalities.length ? data.municipalities.map((row) => <tr key={row.name} className="border-t border-slate-100"><td className="py-3 font-medium">{row.name}</td><td>{format.format(row.morbidity)}</td><td>{format.format(row.mortality)}</td></tr>) : <tr><td className="py-6 text-slate-500" colSpan={3}>Aún no hay períodos validados o cerrados para este año.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  </>;
}
