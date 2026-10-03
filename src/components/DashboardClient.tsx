"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TrendChart } from "@/components/TrendChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { IconActivity, IconHealth, IconUsers, IconClipboard } from "@/components/ui/icons";

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
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/summary?year=${year}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "No fue posible cargar el tablero.");
        return json;
      })
      .then((json) => { if (!cancelled) { setData(json); setError(null); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : "No fue posible cargar el tablero."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [year]);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-end">
          <div className="h-10 w-32 rounded-xl bg-ink-100" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
          <div className="h-[340px] rounded-3xl border border-ink-200/70 bg-white shadow-card" />
          <div className="h-[340px] rounded-3xl border border-ink-200/70 bg-white shadow-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error}
        <div className="mt-2 text-rose-600">Verifica que la base de datos esté conectada y que las migraciones estén aplicadas.</div>
      </div>
    );
  }

  if (!data) return null;

  const monthlyMorbidity = data.monthly.map((m) => m.morbidity);
  const monthlyMortality = data.monthly.map((m) => m.mortality);

  const maxMuni = Math.max(...data.municipalities.map((m) => m.morbidity + m.mortality), 1);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Year selector */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-500">
          Mostrando datos para
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
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

      {/* KPI cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Casos de morbilidad"
          value={format.format(data.morbidity)}
          detail={`Períodos validados · ${data.year}`}
          accent="brand"
          icon={<IconActivity className="h-4 w-4" />}
          sparkline={monthlyMorbidity}
        />
        <MetricCard
          label="Defunciones"
          value={format.format(data.mortality)}
          detail={
            data.mortalityRatePer100k === null
              ? "Falta base poblacional"
              : `${data.mortalityRatePer100k.toFixed(2)} por 100.000`
          }
          accent="rose"
          icon={<IconHealth className="h-4 w-4" />}
          sparkline={monthlyMortality}
        />
        <MetricCard
          label="Períodos reportados"
          value={format.format(data.submissions)}
          detail="Morbilidad + mortalidad"
          accent="amber"
          icon={<IconClipboard className="h-4 w-4" />}
        />
        <MetricCard
          label="Población adolescente"
          value={format.format(data.population)}
          detail={`Base poblacional ${data.year}`}
          accent="violet"
          icon={<IconUsers className="h-4 w-4" />}
        />
      </section>

      {/* Chart + quick read */}
      <section className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
        <Card padding="lg">
          <CardHeader
            title="Evolución mensual"
            description="Solo incluye períodos validados o cerrados."
            eyebrow="Serie temporal"
            action={
              <div className="flex gap-1.5">
                <Badge variant="brand" dot>Morbilidad</Badge>
                <Badge variant="danger" dot>Mortalidad</Badge>
              </div>
            }
          />
          <div className="mt-5">
            <TrendChart data={data.monthly} />
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader title="Lectura rápida" eyebrow="Insights" />
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100/50">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Fuente oficial</div>
              <div className="mt-1.5 text-sm text-ink-700">
                Casos individuales o consolidado mensual, nunca ambos para el mismo municipio/período/evento.
              </div>
            </div>

            <div className="rounded-2xl bg-ink-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Tasa de mortalidad</div>
                {data.mortalityRatePer100k !== null && (
                  <div className="font-display text-xl font-bold tabular-nums text-rose-600">
                    {data.mortalityRatePer100k.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="mt-1.5 text-sm text-ink-600">
                {data.mortalityRatePer100k === null
                  ? "Pendiente de denominador poblacional"
                  : `por cada 100.000 adolescentes en ${data.year}`}
              </div>
            </div>

            <div className="rounded-2xl bg-ink-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Población</div>
                <div className="font-display text-xl font-bold tabular-nums text-ink-900">
                  {format.format(data.population)}
                </div>
              </div>
              <div className="mt-1.5 text-sm text-ink-600">
                Adolescentes cargados para {data.year}.
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Municipality table */}
      <Card padding="none">
        <div className="border-b border-ink-100 p-5 sm:p-6">
          <CardHeader
            title="Resumen por municipio"
            description="Totales disponibles para el año seleccionado, ordenados por morbilidad descendente."
            eyebrow="Distribución territorial"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                <th className="px-5 py-3 sm:px-6">Municipio</th>
                <th className="px-3 py-3 text-right">Morbilidad</th>
                <th className="px-3 py-3 text-right">Mortalidad</th>
                <th className="px-5 py-3 text-right sm:px-6">Total</th>
                <th className="px-3 py-3" style={{ minWidth: 180 }}>Distribución</th>
              </tr>
            </thead>
            <tbody>
              {data.municipalities.length ? (
                data.municipalities.map((row) => {
                  const total = row.morbidity + row.mortality;
                  const morbidPct = total > 0 ? (row.morbidity / maxMuni) * 100 : 0;
                  const mortalPct = total > 0 ? (row.mortality / maxMuni) * 100 : 0;
                  return (
                    <tr key={row.name} className="border-b border-ink-100 transition-colors hover:bg-ink-50/50 last:border-0">
                      <td className="px-5 py-3.5 font-medium text-ink-900 sm:px-6">{row.name}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink-700">
                        {format.format(row.morbidity)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink-700">
                        {format.format(row.mortality)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-ink-900 sm:px-6">
                        {format.format(total)}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
                            style={{ width: `${morbidPct}%` }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                            style={{ width: `${mortalPct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-500">
                    Aún no hay períodos validados o cerrados para {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
