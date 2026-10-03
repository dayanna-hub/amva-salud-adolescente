"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";

type Summary = {
  year: number;
  total: number;
  municipalities: { municipalityId: string; name?: string; population: number }[];
};

const format = new Intl.NumberFormat("es-CO");

export function PopulationSummary() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/population?year=${year}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Error consultando población");
        return json;
      })
      .then((json) => { if (!cancelled) { setData(json); setError(null); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : "No fue posible consultar población."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [year]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-500">Año seleccionado</div>
        <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
          {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].filter((v, i, a) => a.indexOf(v) === i).map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 " +
                (year === y ? "bg-brand-700 text-white shadow-sm" : "text-ink-600 hover:bg-ink-100")
              }
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <Card padding="lg">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card hover padding="md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Población adolescente</div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-ink-900">
                {format.format(data.total)}
              </div>
              <div className="mt-1 text-xs text-ink-500">Adolescentes (10–19 años) en {data.year}</div>
            </Card>
            <Card hover padding="md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Municipios con datos</div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-ink-900">
                {data.municipalities.length}
              </div>
              <div className="mt-1 text-xs text-ink-500">De 10 municipios del AMVA</div>
            </Card>
            <Card hover padding="md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Rango de edad</div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-ink-900">10–19</div>
              <div className="mt-1 text-xs text-ink-500">Adolescencia temprana, media y tardía</div>
            </Card>
          </div>

          <Card padding="none">
            <div className="border-b border-ink-100 p-5 sm:p-6">
              <CardHeader
                title="Distribución por municipio"
                description="Población adolescente por municipio para el año seleccionado."
                eyebrow="Denominadores"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    <th className="px-5 py-3 sm:px-6">Municipio</th>
                    <th className="px-3 py-3 text-right">Población</th>
                    <th className="px-5 py-3 sm:px-6" style={{ minWidth: 200 }}>Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {data.municipalities.length ? (
                    data.municipalities
                      .slice()
                      .sort((a, b) => b.population - a.population)
                      .map((m) => {
                        const pct = data.total > 0 ? (m.population / data.total) * 100 : 0;
                        return (
                          <tr key={m.municipalityId} className="border-b border-ink-100 transition-colors hover:bg-ink-50/50 last:border-0">
                            <td className="px-5 py-3.5 font-medium text-ink-900 sm:px-6">{m.name ?? m.municipalityId}</td>
                            <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink-700">
                              {format.format(m.population)}
                            </td>
                            <td className="px-5 py-3.5 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right font-mono text-[11px] tabular-nums text-ink-500">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-ink-500">
                        No hay población cargada para {year}. Usa Carga mensual → Población para importar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
