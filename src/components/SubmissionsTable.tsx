"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconClipboard } from "@/components/ui/icons";

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
const statusLabel: Record<string, string> = { DRAFT: "Borrador", IN_REVIEW: "En revisión", VALIDATED: "Validado", CLOSED: "Cerrado" };
const statusVariant: Record<string, "neutral" | "brand" | "success" | "warning"> = {
  DRAFT: "warning",
  IN_REVIEW: "neutral",
  VALIDATED: "brand",
  CLOSED: "success",
};

export function SubmissionsTable() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((json) => setRows(json.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setRows(json.rows ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function close(id: string) {
    if (!window.confirm("¿Cerrar este período? Después no se podrán agregar registros sin reabrirlo administrativamente.")) return;
    setClosingId(id);
    try {
      const response = await fetch(`/api/submissions/${id}/close`, { method: "POST" });
      const json = await response.json();
      setMessage({
        type: response.ok ? "success" : "error",
        text: response.ok ? "Período cerrado correctamente." : json.error ?? "No fue posible cerrar el período.",
      });
      if (response.ok) load();
    } catch {
      setMessage({ type: "error", text: "Error de red." });
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {message && (
        <div
          className={
            "animate-fade-in rounded-xl border px-4 py-3 text-sm " +
            (message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700")
          }
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  <th className="px-5 py-3 sm:px-6">Municipio</th>
                  <th className="px-3 py-3">Período</th>
                  <th className="px-3 py-3">Evento</th>
                  <th className="px-3 py-3">Fuente</th>
                  <th className="px-3 py-3 text-right">Filas</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-5 py-3 text-right sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r) => {
                    const count = r.sourceType === "INDIVIDUAL_CASES" ? r._count.cases : r._count.consolidatedRows;
                    const isClosed = r.status === "CLOSED";
                    return (
                      <tr key={r.id} className="border-b border-ink-100 transition-colors hover:bg-ink-50/50 last:border-0">
                        <td className="px-5 py-3.5 font-medium text-ink-900 sm:px-6">{r.municipality.name}</td>
                        <td className="px-3 py-3.5 capitalize text-ink-700">
                          <span className="font-mono text-xs">{monthNames[r.month - 1]} {r.year}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge variant={r.eventType === "MORBIDITY" ? "brand" : "danger"} dot>
                            {r.eventType === "MORBIDITY" ? "Morbilidad" : "Mortalidad"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-ink-600">
                          {r.sourceType === "INDIVIDUAL_CASES" ? "Casos individuales" : "Consolidado"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink-700">{count}</td>
                        <td className="px-3 py-3.5">
                          <Badge variant={statusVariant[r.status] ?? "neutral"} dot>
                            {statusLabel[r.status] ?? r.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          {isClosed ? (
                            <span className="text-xs text-ink-400">Cerrado</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => close(r.id)}
                              disabled={closingId === r.id}
                              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"
                            >
                              {closingId === r.id ? "Cerrando…" : "Cerrar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<IconClipboard className="h-6 w-6" />}
                        title="Aún no hay períodos de reporte"
                        description="Cuando registres tu primer caso o cargues un consolidado aparecerá aquí el período asociado."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
