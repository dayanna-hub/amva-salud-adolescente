"use client";

import Papa from "papaparse";
import { useEffect, useState } from "react";
import { phaseFromAge } from "@/lib/domain";

type Municipality = { id: string; code: string; name: string };
type ImportKind = "INDIVIDUAL_CASES" | "MONTHLY_CONSOLIDATED" | "POPULATION";
type CsvRow = Record<string, string | undefined>;

const normalize = (value: unknown) => String(value ?? "").trim();
const key = (value: unknown) => normalize(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
const optional = (value: unknown) => normalize(value) || null;

function parseSex(value: unknown) {
  const v = key(value);
  if (["MUJER", "FEMENINO", "FEMALE", "F"].includes(v)) return "FEMALE";
  if (["HOMBRE", "MASCULINO", "MALE", "M"].includes(v)) return "MALE";
  return "NOT_REPORTED";
}

function parseZone(value: unknown) {
  const v = key(value);
  if (["URBANA", "URBANO", "URBAN"].includes(v)) return "URBAN";
  if (v === "RURAL") return "RURAL";
  return null;
}

function parseRegime(value: unknown) {
  const v = key(value);
  if (["SIN AFILIACION", "UNAFFILIATED"].includes(v)) return "UNAFFILIATED";
  if (["SUBSIDIADO", "SUBSIDIZED"].includes(v)) return "SUBSIDIZED";
  if (["CONTRIBUTIVO", "CONTRIBUTORY"].includes(v)) return "CONTRIBUTORY";
  return null;
}

function parseEvent(value: unknown) {
  const v = key(value);
  if (["MORBILIDAD", "MORBIDITY"].includes(v)) return "MORBIDITY" as const;
  if (["MORTALIDAD", "MORTALITY"].includes(v)) return "MORTALITY" as const;
  return null;
}

function parsePeriod(value: unknown) {
  const match = normalize(value).match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function ImportPanel() {
  const [kind, setKind] = useState<ImportKind>("INDIVIDUAL_CASES");
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [payload, setPayload] = useState<unknown>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "success" | "error"; message?: string }>({ kind: "idle" });

  useEffect(() => {
    fetch("/api/municipalities")
      .then((r) => r.json())
      .then((data) => data.ok && setMunicipalities(data.rows ?? []))
      .catch(() => undefined);
  }, []);

  function reset() {
    setFileName(null);
    setPreview([]);
    setPayload(null);
    setStatus({ kind: "idle" });
  }

  function municipalityByName(name: unknown) {
    const wanted = key(name);
    return municipalities.find((m) => key(m.name) === wanted);
  }

  function buildPayload(rows: CsvRow[]) {
    if (!rows.length) throw new Error("El archivo está vacío.");

    if (kind === "POPULATION") {
      const mapped = rows.map((row, index) => {
        const municipality = municipalityByName(row.municipio);
        if (!municipality) throw new Error(`Fila ${index + 2}: municipio no reconocido.`);
        const age = Number(row.edad);
        const year = Number(row.anio);
        const populationCount = Number(row.poblacion);
        if (!Number.isInteger(age) || age < 10 || age > 19) throw new Error(`Fila ${index + 2}: edad inválida.`);
        if (!Number.isInteger(year)) throw new Error(`Fila ${index + 2}: año inválido.`);
        if (!Number.isInteger(populationCount) || populationCount < 0) throw new Error(`Fila ${index + 2}: población inválida.`);
        return { municipalityId: municipality.id, year, age, sex: parseSex(row.sexo), populationCount };
      });
      return { kind: "POPULATION", rows: mapped };
    }

    const firstMunicipality = municipalityByName(rows[0].municipio);
    const firstPeriod = parsePeriod(rows[0].periodo);
    const firstEvent = parseEvent(rows[0].tipo_evento);
    if (!firstMunicipality) throw new Error("La primera fila contiene un municipio no reconocido.");
    if (!firstPeriod) throw new Error("El período debe tener formato AAAA-MM, por ejemplo 2026-10.");
    if (!firstEvent) throw new Error("tipo_evento debe ser MORBILIDAD o MORTALIDAD.");

    for (const [index, row] of rows.entries()) {
      const municipality = municipalityByName(row.municipio);
      const period = parsePeriod(row.periodo);
      const event = parseEvent(row.tipo_evento);
      if (!municipality || municipality.id !== firstMunicipality.id) throw new Error(`Fila ${index + 2}: el archivo debe contener un solo municipio.`);
      if (!period || period.year !== firstPeriod.year || period.month !== firstPeriod.month) throw new Error(`Fila ${index + 2}: el archivo debe contener un solo período.`);
      if (event !== firstEvent) throw new Error(`Fila ${index + 2}: el archivo debe contener un solo tipo de evento.`);
    }

    const submission = {
      municipalityId: firstMunicipality.id,
      year: firstPeriod.year,
      month: firstPeriod.month,
      eventType: firstEvent,
      sourceType: kind,
      inputMethod: "CSV",
    };

    if (kind === "INDIVIDUAL_CASES") {
      const mapped = rows.map((row, index) => {
        const age = Number(row.edad);
        const phase = phaseFromAge(age);
        if (!phase) throw new Error(`Fila ${index + 2}: la edad debe estar entre 10 y 19 años.`);
        if (!normalize(row.fecha_evento)) throw new Error(`Fila ${index + 2}: falta fecha_evento.`);
        return {
          eventDate: normalize(row.fecha_evento),
          municipalityIdSnapshot: firstMunicipality.id,
          age,
          phase,
          sex: parseSex(row.sexo),
          zone: parseZone(row.zona),
          diagnosis: optional(row.diagnostico),
          cie10Code: optional(row.codigo_cie10)?.toUpperCase() ?? null,
          causeOfDeath: optional(row.causa_defuncion),
          deathCie10Code: optional(row.codigo_cie10_defuncion)?.toUpperCase() ?? null,
          educationLevel: optional(row.nivel_educativo),
          stratum: normalize(row.estrato) ? Number(row.estrato) : null,
          ethnicity: optional(row.etnia),
          affiliationRegime: parseRegime(row.regimen_afiliacion),
        };
      });
      return { kind, submission, rows: mapped };
    }

    const mapped = rows.map((row, index) => {
      const age = normalize(row.edad) ? Number(row.edad) : null;
      const phase = age === null ? null : phaseFromAge(age);
      const caseCount = Number(row.numero_casos);
      if (age !== null && !phase) throw new Error(`Fila ${index + 2}: edad inválida.`);
      if (!Number.isInteger(caseCount) || caseCount <= 0) throw new Error(`Fila ${index + 2}: numero_casos debe ser un entero positivo.`);
      return {
        age,
        phase,
        sex: normalize(row.sexo) ? parseSex(row.sexo) : null,
        zone: parseZone(row.zona),
        diagnosis: optional(row.diagnostico),
        cie10Code: optional(row.codigo_cie10)?.toUpperCase() ?? null,
        causeOfDeath: optional(row.causa_defuncion),
        deathCie10Code: optional(row.codigo_cie10_defuncion)?.toUpperCase() ?? null,
        educationLevel: optional(row.nivel_educativo),
        stratum: normalize(row.estrato) ? Number(row.estrato) : null,
        ethnicity: optional(row.etnia),
        affiliationRegime: parseRegime(row.regimen_afiliacion),
        caseCount,
      };
    });
    return { kind, submission, rows: mapped };
  }

  function selectFile(file: File | undefined) {
    reset();
    if (!file) return;
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus({ kind: "error", message: "Esta versión funcional importa CSV. Usa las plantillas suministradas; XLSX se habilitará en la siguiente fase." });
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          setStatus({ kind: "error", message: `CSV inválido: ${result.errors[0].message}` });
          return;
        }
        try {
          const built = buildPayload(result.data);
          setPreview(result.data.slice(0, 5));
          setPayload(built);
          setStatus({ kind: "idle", message: `${result.data.length} filas listas para importar.` });
        } catch (error) {
          setStatus({ kind: "error", message: error instanceof Error ? error.message : "No fue posible validar el archivo." });
        }
      },
    });
  }

  async function importRows() {
    if (!payload) return;
    setStatus({ kind: "loading", message: "Importando y validando…" });
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus({ kind: "error", message: json.error ?? "La importación fue rechazada." });
      return;
    }
    setStatus({ kind: "success", message: `Importación completada: ${json.imported} filas procesadas.` });
  }

  const template = kind === "INDIVIDUAL_CASES" ? "/templates/casos_individuales.csv" : kind === "MONTHLY_CONSOLIDATED" ? "/templates/consolidado_mensual.csv" : "/templates/poblacion.csv";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap gap-2">
        {([
          ["INDIVIDUAL_CASES", "Casos individuales"],
          ["MONTHLY_CONSOLIDATED", "Consolidado mensual"],
          ["POPULATION", "Población"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => { setKind(value); reset(); }} className={`rounded-xl px-4 py-2 text-sm font-medium ${kind === value ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <div className="text-lg font-semibold">Importar archivo CSV</div>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">La plataforma valida municipio, período, edades, tipo de evento y consistencia de la fuente antes de guardar. Un período no puede mezclar casos individuales con consolidado mensual.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a href={template} download className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium">Descargar plantilla</a>
          <label className="inline-flex cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
            Seleccionar CSV
            <input className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => selectFile(e.target.files?.[0])} />
          </label>
        </div>
        {fileName && <div className="mt-3 text-sm text-slate-600">Archivo: {fileName}</div>}
      </div>

      {status.message && <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${status.kind === "success" ? "bg-emerald-50 text-emerald-800" : status.kind === "error" ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-600"}`}>{status.message}</div>}

      {preview.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Previsualización</h3><span className="text-xs text-slate-500">Primeras {preview.length} filas</span></div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-slate-50 text-left text-slate-500"><tr>{Object.keys(preview[0]).map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
              <tbody>{preview.map((row, index) => <tr key={index} className="border-t border-slate-100">{Object.keys(preview[0]).map((h) => <td key={h} className="px-3 py-2">{row[h] ?? ""}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end"><button type="button" disabled={!payload || status.kind === "loading"} onClick={importRows} className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{status.kind === "loading" ? "Importando…" : "Confirmar importación"}</button></div>
        </div>
      )}
    </div>
  );
}
