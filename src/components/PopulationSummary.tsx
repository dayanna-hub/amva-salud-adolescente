"use client";

import { useEffect, useState } from "react";

type Summary = { year: number; total: number; municipalities: { municipalityId: string; name?: string; population: number }[] };
const format = new Intl.NumberFormat("es-CO");

export function PopulationSummary() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`/api/population?year=${year}`)
      .then(async (r) => { const json = await r.json(); if (!r.ok) throw new Error(json.error ?? "Error consultando población"); return json; })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "No fue posible consultar población."));
  }, [year]);

  return <>
    <div className="mb-5 flex justify-end"><label className="text-sm font-medium text-slate-600">Año<select value={year} onChange={(e) => setYear(Number(e.target.value))} className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2">{[year - 2, year - 1, year, year + 1].map((y, i, arr) => arr.indexOf(y) === i && <option key={y}>{y}</option>)}</select></label></div>
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div> : <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div className="text-sm text-slate-500">Población adolescente</div><div className="mt-2 text-2xl font-semibold">{format.format(data?.total ?? 0)}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div className="text-sm text-slate-500">Municipios con datos</div><div className="mt-2 text-2xl font-semibold">{data?.municipalities.length ?? 0}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div className="text-sm text-slate-500">Rango de edad</div><div className="mt-2 text-2xl font-semibold">10–19</div></div>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">Municipio</th><th className="px-4 py-3">Población</th></tr></thead><tbody>{data?.municipalities.length ? data.municipalities.map((m) => <tr key={m.municipalityId} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{m.name ?? m.municipalityId}</td><td className="px-4 py-3">{format.format(m.population)}</td></tr>) : <tr><td colSpan={2} className="px-4 py-8 text-slate-500">No hay población cargada para {year}. Usa Carga mensual → Población.</td></tr>}</tbody></table></div></div>
    </>}
  </>;
}
