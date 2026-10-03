"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  eventDate: string;
  age: number;
  sex: string;
  cie10Code: string | null;
  deathCie10Code: string | null;
  municipalityName: string;
  year: number;
  month: number;
  submissionStatus: string;
};

const sexLabel: Record<string, string> = { FEMALE: "Mujer", MALE: "Hombre", NOT_REPORTED: "Sin reporte" };
const statusLabel: Record<string, string> = { DRAFT: "Borrador", IN_REVIEW: "En revisión", VALIDATED: "Validado", CLOSED: "Cerrado" };

export function CasesTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<"ALL" | "MORBIDITY" | "MORTALITY">("ALL");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cases")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Error cargando casos");
        return json;
      })
      .then((json) => { if (!cancelled) setRows(json.rows ?? []); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "No fue posible cargar los casos."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visibleRows = eventTypeFilter === "ALL"
    ? rows
    : rows.filter((r) => {
        // El DTO ya no trae eventType directamente, pero podemos inferirlo:
        // si tiene causeOfDeath/deathCie10Code → MORTALITY, si no → MORBIDITY
        // Sin embargo, morbilidad puede tener deathCie10Code null. Mejor: filtramos en cliente por presencia de causa.
        return eventTypeFilter === "MORTALITY"
          ? r.deathCie10Code !== null
          : r.deathCie10Code === null;
      });

  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {(["ALL", "MORBIDITY", "MORTALITY"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setEventTypeFilter(t)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
              (eventTypeFilter === t ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100")
            }
          >
            {t === "ALL" ? "Todos" : t === "MORBIDITY" ? "Morbilidad" : "Mortalidad"}
          </button>
        ))}
      </div>
      <Link href="/casos/nuevo" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white">+ Registrar caso</Link>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      {loading ? (
        <div className="p-5 text-sm text-slate-500">Cargando casos…</div>
      ) : error ? (
        <div className="p-5 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                {["ID", "Municipio", "Edad", "Sexo", "Diagnóstico/Causa", "CIE-10", "Fecha", "Período", "Estado"].map((h) => (
                  <th className="px-4 py-3" key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? visibleRows.map((r) => {
                const isMortality = r.deathCie10Code !== null;
                const descriptor = isMortality ? "Defunción" : "Caso";
                return (
                  <tr className="border-t border-slate-100" key={r.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium">{r.municipalityName}</td>
                    <td className="px-4 py-3">{r.age}</td>
                    <td className="px-4 py-3">{sexLabel[r.sex] ?? r.sex}</td>
                    <td className="px-4 py-3">
                      <span className={"inline-flex items-center gap-1.5 " + (isMortality ? "text-rose-700" : "text-slate-700")}>
                        <span className={"inline-block h-1.5 w-1.5 rounded-full " + (isMortality ? "bg-rose-500" : "bg-teal-500")}></span>
                        {descriptor}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.cie10Code ?? r.deathCie10Code ?? "—"}</td>
                    <td className="px-4 py-3">{new Date(r.eventDate).toLocaleDateString("es-CO")}</td>
                    <td className="px-4 py-3 text-slate-500">{r.year}-{String(r.month).padStart(2, "0")}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-md px-2 py-0.5 text-xs " + (
                        r.submissionStatus === "CLOSED" ? "bg-slate-200 text-slate-700"
                        : r.submissionStatus === "VALIDATED" ? "bg-teal-100 text-teal-800"
                        : "bg-amber-100 text-amber-800"
                      )}>
                        {statusLabel[r.submissionStatus] ?? r.submissionStatus}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={9}>No hay casos individuales registrados con este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {rows.length > 0 && (
      <div className="mt-3 text-xs text-slate-500">
        Mostrando {visibleRows.length} de {rows.length} casos cargados.
      </div>
    )}
  </>;
}
