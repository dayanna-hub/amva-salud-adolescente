"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconActivity } from "@/components/ui/icons";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
  user: { name: string; email: string } | null;
};

const actionLabel: Record<string, string> = {
  CREATE_SUBMISSION: "Crear período",
  CREATE_CASE: "Crear caso",
  IMPORT_POPULATION: "Importar población",
  IMPORT_CASES: "Importar casos",
  IMPORT_CONSOLIDATED: "Importar consolidado",
  CLOSE_SUBMISSION: "Cerrar período",
  USER_SEED: "Siembra de usuarios",
};

const actionVariant: Record<string, "brand" | "info" | "success" | "warning" | "neutral"> = {
  CREATE_SUBMISSION: "info",
  CREATE_CASE: "brand",
  IMPORT_POPULATION: "warning",
  IMPORT_CASES: "warning",
  IMPORT_CONSOLIDATED: "warning",
  CLOSE_SUBMISSION: "success",
  USER_SEED: "neutral",
};

const format = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AuditTable() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/audit")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Error");
        return json;
      })
      .then((json) => { if (!cancelled) setRows(json.rows ?? []); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "No fue posible consultar auditoría."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <SkeletonTable rows={6} cols={5} />;

  if (error) {
    return (
      <Card padding="lg">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              <th className="px-5 py-3 sm:px-6">Acción</th>
              <th className="px-3 py-3">Entidad</th>
              <th className="px-3 py-3">Usuario</th>
              <th className="px-3 py-3">Detalle</th>
              <th className="px-5 py-3 text-right sm:px-6">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => {
                const afterData = r.afterData as Record<string, unknown> | null;
                const beforeData = r.beforeData as Record<string, unknown> | null;
                const detailParts: string[] = [];
                if (afterData && typeof afterData === "object") {
                  if (typeof afterData.rows === "number") detailParts.push(`filas: ${afterData.rows}`);
                  if (typeof afterData.mode === "string") detailParts.push(`modo: ${afterData.mode}`);
                  if (typeof afterData.municipality === "string") detailParts.push(afterData.municipality);
                  if (typeof afterData.year === "number" && typeof afterData.month === "number") {
                    detailParts.push(`${afterData.year}-${String(afterData.month).padStart(2, "0")}`);
                  }
                  if (typeof afterData.status === "string") detailParts.push(`→ ${afterData.status}`);
                }
                if (beforeData && typeof beforeData === "object" && typeof beforeData.status === "string") {
                  detailParts.unshift(`${beforeData.status} →`);
                }
                return (
                  <tr key={r.id} className="border-b border-ink-100 transition-colors hover:bg-ink-50/50 last:border-0">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Badge variant={actionVariant[r.action] ?? "neutral"} dot>
                        {actionLabel[r.action] ?? r.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[11px] text-ink-500">{r.entity}</td>
                    <td className="px-3 py-3.5">
                      {r.user ? (
                        <div>
                          <div className="font-medium text-ink-900">{r.user.name}</div>
                          <div className="text-[11px] text-ink-400">{r.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">Sistema</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-ink-600">
                      {detailParts.length ? detailParts.join(" · ") : <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-ink-500 sm:px-6">
                      {format.format(new Date(r.createdAt))}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<IconActivity className="h-6 w-6" />}
                    title="Aún no hay eventos registrados"
                    description="Las acciones de creación, importación y cierre aparecerán aquí con su autor y marca temporal."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="border-t border-ink-100 bg-ink-50/40 px-5 py-3 text-xs text-ink-500 sm:px-6">
          Mostrando los últimos <span className="font-semibold text-ink-700">{rows.length}</span> eventos.
        </div>
      )}
    </Card>
  );
}
