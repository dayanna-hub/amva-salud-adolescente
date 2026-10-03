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
  submission: { eventType: "MORBIDITY" | "MORTALITY"; municipality: { name: string } };
};

const sexLabel: Record<string, string> = { FEMALE: "Mujer", MALE: "Hombre", NOT_REPORTED: "Sin reporte" };

export function CasesTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cases")
      .then(async (r) => { const json = await r.json(); if (!r.ok) throw new Error(json.error ?? "Error cargando casos"); return json; })
      .then((json) => setRows(json.rows ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "No fue posible cargar los casos."))
      .finally(() => setLoading(false));
  }, []);

  return <>
    <div className="mb-4 flex justify-end"><Link href="/casos/nuevo" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white">+ Registrar caso</Link></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      {loading ? <div className="p-5 text-sm text-slate-500">Cargando casos…</div> : error ? <div className="p-5 text-sm text-rose-700">{error}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr>{["ID","Municipio","Evento","Edad","Sexo","CIE-10","Fecha"].map((h)=><th className="px-4 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r)=><tr className="border-t border-slate-100" key={r.id}><td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 12)}…</td><td className="px-4 py-3">{r.submission.municipality.name}</td><td className="px-4 py-3">{r.submission.eventType === "MORBIDITY" ? "Morbilidad" : "Mortalidad"}</td><td className="px-4 py-3">{r.age}</td><td className="px-4 py-3">{sexLabel[r.sex] ?? r.sex}</td><td className="px-4 py-3">{r.cie10Code ?? r.deathCie10Code ?? "—"}</td><td className="px-4 py-3">{new Date(r.eventDate).toLocaleDateString("es-CO")}</td></tr>) : <tr><td className="px-4 py-8 text-slate-500" colSpan={7}>No hay casos individuales registrados todavía.</td></tr>}</tbody></table></div>}
    </div>
  </>;
}
