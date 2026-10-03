"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { phaseFromAge } from "@/lib/domain";

const fieldClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

type Municipality = { id: string; code: string; name: string };
type EventType = "MORBIDITY" | "MORTALITY";

function phaseLabel(phase: ReturnType<typeof phaseFromAge>) {
  if (phase === "EARLY_10_13") return "Temprana (10–13)";
  if (phase === "MIDDLE_14_17") return "Media (14–17)";
  if (phase === "LATE_18_19") return "Tardía (18–19)";
  return "Fuera del rango";
}

export function CaseForm() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [municipalityId, setMunicipalityId] = useState("");
  const [eventType, setEventType] = useState<EventType>("MORBIDITY");
  const [eventDate, setEventDate] = useState("");
  const [age, setAge] = useState(15);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "success" | "error"; message?: string }>({ kind: "idle" });
  const phase = useMemo(() => phaseFromAge(age), [age]);

  useEffect(() => {
    fetch("/api/municipalities")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.rows?.length) {
          setMunicipalities(data.rows);
          setMunicipalityId(data.rows[0].id);
        }
      })
      .catch(() => setStatus({ kind: "error", message: "No fue posible cargar los municipios. Verifica la conexión de la base de datos." }));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!municipalityId || !eventDate || !phase) {
      setStatus({ kind: "error", message: "Completa municipio, fecha y una edad entre 10 y 19 años." });
      return;
    }

    setStatus({ kind: "loading", message: "Registrando…" });
    const form = new FormData(event.currentTarget);
    const date = new Date(`${eventDate}T12:00:00`);

    const submissionResponse = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        municipalityId,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        eventType,
        sourceType: "INDIVIDUAL_CASES",
        inputMethod: "FORM",
      }),
    });
    const submissionJson = await submissionResponse.json();
    if (!submissionResponse.ok) {
      setStatus({ kind: "error", message: submissionJson.error ?? "No fue posible abrir el período de reporte." });
      return;
    }

    const text = (key: string) => {
      const value = String(form.get(key) ?? "").trim();
      return value || null;
    };

    const payload = {
      submissionId: submissionJson.submission.id,
      eventDate,
      municipalityIdSnapshot: municipalityId,
      age,
      phase,
      sex: form.get("sex"),
      zone: form.get("zone") || null,
      diagnosis: eventType === "MORBIDITY" ? text("diagnosis") : null,
      cie10Code: eventType === "MORBIDITY" ? text("cie10Code")?.toUpperCase() : null,
      causeOfDeath: eventType === "MORTALITY" ? text("causeOfDeath") : null,
      deathCie10Code: eventType === "MORTALITY" ? text("deathCie10Code")?.toUpperCase() : null,
      educationLevel: text("educationLevel"),
      stratum: Number(form.get("stratum")) || null,
      ethnicity: text("ethnicity"),
      affiliationRegime: form.get("affiliationRegime") || null,
    };

    const response = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus({ kind: "error", message: json.error ?? "No fue posible registrar el caso." });
      return;
    }

    setStatus({ kind: "success", message: `Caso registrado correctamente. ID: ${json.id}` });
    event.currentTarget.reset();
    setAge(15);
    setEventDate("");
  }

  return (
    <form className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft lg:grid-cols-2" onSubmit={submit}>
      <label className="text-sm font-medium">Municipio
        <select className={fieldClass} value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)} required>
          {municipalities.length === 0 && <option value="">Cargando municipios…</option>}
          {municipalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">Tipo de evento
        <select className={fieldClass} value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
          <option value="MORBIDITY">Morbilidad</option><option value="MORTALITY">Mortalidad</option>
        </select>
      </label>
      <label className="text-sm font-medium">Fecha del evento<input className={fieldClass} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required /></label>
      <label className="text-sm font-medium">Edad<input className={fieldClass} type="number" min={10} max={19} value={age} onChange={(e) => setAge(Number(e.target.value))} required /><span className="mt-1 block text-xs text-slate-500">Fase calculada: {phaseLabel(phase)}</span></label>
      <label className="text-sm font-medium">Sexo<select name="sex" className={fieldClass}><option value="FEMALE">Mujer</option><option value="MALE">Hombre</option><option value="NOT_REPORTED">Sin reporte</option></select></label>
      <label className="text-sm font-medium">Zona<select name="zone" className={fieldClass} defaultValue="URBAN"><option value="URBAN">Urbana</option><option value="RURAL">Rural</option></select></label>

      {eventType === "MORBIDITY" ? <>
        <label className="text-sm font-medium">Diagnóstico<input name="diagnosis" className={fieldClass} placeholder="Ej. Dengue" /></label>
        <label className="text-sm font-medium">Código CIE-10<input name="cie10Code" className={fieldClass} placeholder="Ej. A90" /></label>
      </> : <>
        <label className="text-sm font-medium">Causa de defunción<input name="causeOfDeath" className={fieldClass} placeholder="Causa principal" /></label>
        <label className="text-sm font-medium">Código CIE-10 de causa<input name="deathCie10Code" className={fieldClass} placeholder="Ej. V89.2" /></label>
      </>}

      <label className="text-sm font-medium">Nivel educativo<select name="educationLevel" className={fieldClass}><option value="Sin educación">Sin educación</option><option value="Primaria">Primaria</option><option value="Básica">Básica</option><option value="Secundaria">Secundaria</option></select></label>
      <label className="text-sm font-medium">Estrato<select name="stratum" className={fieldClass}>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <label className="text-sm font-medium">Etnia<select name="ethnicity" className={fieldClass}><option value="">Sin dato</option><option value="Indígena">Indígena</option><option value="Afrocolombiana">Afrocolombiana</option><option value="Raizal">Raizal</option><option value="Gitano">Gitano</option></select></label>
      <label className="text-sm font-medium">Régimen de afiliación<select name="affiliationRegime" className={fieldClass}><option value="UNAFFILIATED">Sin afiliación</option><option value="SUBSIDIZED">Subsidiado</option><option value="CONTRIBUTORY">Contributivo</option></select></label>

      <div className="lg:col-span-2 border-t border-slate-100 pt-5">
        {status.message && <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${status.kind === "success" ? "bg-emerald-50 text-emerald-800" : status.kind === "error" ? "bg-rose-50 text-rose-800" : "bg-slate-50 text-slate-600"}`}>{status.message}</div>}
        <div className="flex justify-end gap-3">
          <button type="reset" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Limpiar</button>
          <button disabled={status.kind === "loading" || municipalities.length === 0} type="submit" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{status.kind === "loading" ? "Registrando…" : "Registrar caso"}</button>
        </div>
      </div>
    </form>
  );
}
