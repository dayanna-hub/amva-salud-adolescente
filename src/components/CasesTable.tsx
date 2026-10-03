"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { IconPlus, IconSearch, IconCases } from "@/components/ui/icons";

type Row = {
  id: string;
  eventDate: string;
  age: number;
  sex: string;
  cie10Code: string | null;
  deathCie10Code: string | null;
  diagnosis: string | null;
  causeOfDeath: string | null;
  municipalityName: string;
  year: number;
  month: number;
  submissionStatus: string;
};

const sexLabel: Record<string, string> = { FEMALE: "Mujer", MALE: "Hombre", NOT_REPORTED: "Sin reporte" };
const sexDot: Record<string, string> = { FEMALE: "bg-rose-400", MALE: "bg-sky-400", NOT_REPORTED: "bg-ink-300" };
const statusLabel: Record<string, string> = { DRAFT: "Borrador", IN_REVIEW: "En revisión", VALIDATED: "Validado", CLOSED: "Cerrado" };
const statusVariant: Record<string, "neutral" | "brand" | "success" | "warning"> = {
  DRAFT: "warning",
  IN_REVIEW: "neutral",
  VALIDATED: "brand",
  CLOSED: "success",
};

export function CasesTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<"ALL" | "MORBIDITY" | "MORTALITY">("ALL");
  const [search, setSearch] = useState("");

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

  const visibleRows = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return rows.filter((r) => {
      const isMortality = r.deathCie10Code !== null;
      const matchesType =
        eventTypeFilter === "ALL"
          ? true
          : eventTypeFilter === "MORTALITY"
            ? isMortality
            : !isMortality;
      if (!matchesType) return false;
      if (!lowerSearch) return true;
      const haystack = [
        r.municipalityName,
        r.diagnosis ?? "",
        r.causeOfDeath ?? "",
        r.cie10Code ?? "",
        r.deathCie10Code ?? "",
        sexLabel[r.sex] ?? r.sex,
        String(r.age),
      ].join(" ").toLowerCase();
      return haystack.includes(lowerSearch);
    });
  }, [rows, eventTypeFilter, search]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
            {(["ALL", "MORBIDITY", "MORTALITY"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventTypeFilter(t)}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 " +
                  (eventTypeFilter === t ? "bg-brand-700 text-white shadow-sm" : "text-ink-600 hover:bg-ink-100")
                }
              >
                {t === "ALL" ? "Todos" : t === "MORBIDITY" ? "Morbilidad" : "Mortalidad"}
              </button>
            ))}
          </div>

          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Buscar diagnóstico, municipio, CIE-10…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-200 hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none"
            />
          </div>
        </div>

        <Link href="/casos/nuevo" className="btn-primary">
          <IconPlus className="h-4 w-4" />
          Registrar caso
        </Link>
      </div>

      {/* Table or states */}
      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : error ? (
        <Card padding="lg">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  <th className="px-5 py-3">Municipio</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3 text-right">Edad</th>
                  <th className="px-3 py-3">Sexo</th>
                  <th className="px-3 py-3">Diagnóstico / Causa</th>
                  <th className="px-3 py-3">CIE-10</th>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Período</th>
                  <th className="px-5 py-3 text-right sm:px-6">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? (
                  visibleRows.map((r) => {
                    const isMortality = r.deathCie10Code !== null;
                    const descriptor = isMortality ? "Defunción" : "Caso";
                    const text = isMortality ? r.causeOfDeath : r.diagnosis;
                    return (
                      <tr key={r.id} className="border-b border-ink-100 transition-colors hover:bg-ink-50/50 last:border-0">
                        <td className="px-5 py-3.5 font-medium text-ink-900 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isMortality ? "#e11d48" : "#0d9488" }} />
                            {r.municipalityName}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={"text-xs font-medium " + (isMortality ? "text-rose-700" : "text-brand-700")}>
                            {descriptor}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono text-xs tabular-nums text-ink-700">{r.age}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={"h-2 w-2 rounded-full " + (sexDot[r.sex] ?? "bg-ink-300")} />
                            {sexLabel[r.sex] ?? r.sex}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 max-w-[280px]">
                          <div className="truncate text-xs text-ink-700" title={text ?? ""}>
                            {text ?? <span className="text-ink-400">—</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-[11px] text-ink-700">
                            {r.cie10Code ?? r.deathCie10Code ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-ink-500">
                          {new Date(r.eventDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-3 py-3.5 font-mono text-[11px] text-ink-500">
                          {r.year}-{String(r.month).padStart(2, "0")}
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <Badge variant={statusVariant[r.submissionStatus] ?? "neutral"} dot>
                            {statusLabel[r.submissionStatus] ?? r.submissionStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon={<IconCases className="h-6 w-6" />}
                        title={search ? "Sin resultados" : "No hay casos individuales"}
                        description={
                          search
                            ? "No encontramos casos que coincidan con tu búsqueda. Prueba con otros términos."
                            : "Cuando registres tu primer caso individual aparecerá aquí."
                        }
                        action={
                          !search && (
                            <Link href="/casos/nuevo" className="btn-primary">
                              <IconPlus className="h-4 w-4" />
                              Registrar primer caso
                            </Link>
                          )
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="border-t border-ink-100 bg-ink-50/40 px-5 py-3 text-xs text-ink-500 sm:px-6">
              Mostrando <span className="font-semibold text-ink-700">{visibleRows.length}</span> de{" "}
              <span className="font-semibold text-ink-700">{rows.length}</span> casos.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
