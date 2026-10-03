"use client";

import { useEffect, useState } from "react";

type Row = { id: string; action: string; entity: string; entityId: string | null; createdAt: string; user: { name: string; email: string } | null };

const labels: Record<string, string> = {
  CREATE_SUBMISSION: "Período creado",
  CREATE_CASE: "Caso registrado",
  IMPORT_CASES: "Casos importados",
  IMPORT_CONSOLIDATED: "Consolidado importado",
  IMPORT_POPULATION: "Población importada",
  CLOSE_SUBMISSION: "Período cerrado",
};

export function AuditTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/audit").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }).then((j) => setRows(j.rows ?? [])).catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div>;
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div className="space-y-4 text-sm">{rows.length ? rows.map((r) => <div key={r.id} className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 last:border-0 sm:flex-row"><div><div className="font-medium">{labels[r.action] ?? r.action}</div><div className="mt-1 text-slate-500">{r.entity}{r.entityId ? ` · ${r.entityId}` : ""}{r.user ? ` · ${r.user.name}` : ""}</div></div><div className="whitespace-nowrap text-xs text-slate-400">{new Date(r.createdAt).toLocaleString("es-CO")}</div></div>) : <div className="py-4 text-slate-500">Todavía no hay eventos de auditoría.</div>}</div></div>;
}
