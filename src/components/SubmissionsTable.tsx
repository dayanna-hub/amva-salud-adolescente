"use client";

import { useCallback, useEffect, useState } from "react";

type Submission = {
  id: string;
  year: number;
  month: number;
  eventType: "MORBIDITY" | "MORTALITY";
  sourceType: "INDIVIDUAL_CASES" | "MONTHLY_CONSOLIDATED";
  status: "DRAFT" | "IN_REVIEW" | "VALIDATED" | "CLOSED";
  municipality: { name: string };
  _count: { cases: number; consolidatedRows: number };
};

const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const statusLabels: Record<string, string> = { DRAFT: "Borrador", IN_REVIEW: "En revisión", VALIDATED: "Validado", CLOSED: "Cerrado" };

export function SubmissionsTable() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((json) => setRows(json.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((json) => { if (!cancelled) { setRows(json.rows ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function close(id: string) {
    if (!window.confirm("¿Cerrar este período? Después no se podrán agregar registros sin reabrirlo administrativamente.")) return;
    const response = await fetch(`/api/submissions/${id}/close`, { method: "POST" });
    const json = await response.json();
    setMessage(response.ok ? "Período cerrado correctamente." : json.error ?? "No fue posible cerrar el período.");
    if (response.ok) load();
  }

  return <>
    {message && <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      {loading ? <div className="p-5 text-sm text-slate-500">Cargando períodos…</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr>{["Municipio","Período","Evento","Fuente","Filas","Estado","Acción"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r)=>{
        const count = r.sourceType === "INDIVIDUAL_CASES" ? r._count.cases : r._count.consolidatedRows;
        return <tr key={r.id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{r.municipality.name}</td><td className="px-4 py-3">{monthNames[r.month - 1]} {r.year}</td><td className="px-4 py-3">{r.eventType === "MORBIDITY" ? "Morbilidad" : "Mortalidad"}</td><td className="px-4 py-3">{r.sourceType === "INDIVIDUAL_CASES" ? "Casos individuales" : "Consolidado mensual"}</td><td className="px-4 py-3">{count}</td><td className="px-4 py-3">{statusLabels[r.status] ?? r.status}</td><td className="px-4 py-3">{r.status === "CLOSED" ? <span className="text-slate-400">Cerrado</span> : <button onClick={() => close(r.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">Cerrar período</button>}</td></tr>;
      }) : <tr><td className="px-4 py-8 text-slate-500" colSpan={7}>Aún no hay períodos de reporte.</td></tr>}</tbody></table></div>}
    </div>
  </>;
}
