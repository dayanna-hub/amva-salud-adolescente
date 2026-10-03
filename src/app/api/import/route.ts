import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importSchema } from "@/lib/validation";

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function POST(request: Request) {
  try {
    const parsed = importSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    if (payload.kind === "POPULATION") {
      const operations = payload.rows.map((row) =>
        prisma.population.upsert({
          where: {
            municipalityId_year_age_sex: {
              municipalityId: row.municipalityId,
              year: row.year,
              age: row.age,
              sex: row.sex,
            },
          },
          update: { populationCount: row.populationCount },
          create: row,
        }),
      );
      await prisma.$transaction(operations);
      await prisma.auditLog.create({ data: { action: "IMPORT_POPULATION", entity: "Population", afterData: { rows: payload.rows.length } } });
      return NextResponse.json({ ok: true, imported: payload.rows.length });
    }

    const s = payload.submission;
    const existing = await prisma.submission.findUnique({
      where: {
        municipalityId_year_month_eventType: {
          municipalityId: s.municipalityId,
          year: s.year,
          month: s.month,
          eventType: s.eventType,
        },
      },
    });

    if (existing && existing.sourceType !== s.sourceType) {
      return NextResponse.json({ ok: false, error: "El período ya usa otra fuente oficial. Importación bloqueada para evitar doble conteo." }, { status: 409 });
    }
    if (existing?.status === "CLOSED") {
      return NextResponse.json({ ok: false, error: "El período está cerrado." }, { status: 409 });
    }

    const submission = existing ?? await prisma.submission.create({ data: s });

    if (payload.kind === "INDIVIDUAL_CASES") {
      for (const [index, row] of payload.rows.entries()) {
        if (row.municipalityIdSnapshot !== submission.municipalityId) {
          return NextResponse.json({ ok: false, error: `Fila ${index + 2}: el municipio no coincide con el período.` }, { status: 400 });
        }
        const date = new Date(row.eventDate);
        if (date.getUTCFullYear() !== submission.year || date.getUTCMonth() + 1 !== submission.month) {
          return NextResponse.json({ ok: false, error: `Fila ${index + 2}: la fecha no pertenece al período ${submission.year}-${String(submission.month).padStart(2, "0")}.` }, { status: 400 });
        }
        if (submission.eventType === "MORBIDITY" && !row.diagnosis && !row.cie10Code) {
          return NextResponse.json({ ok: false, error: `Fila ${index + 2}: morbilidad requiere diagnóstico o CIE-10.` }, { status: 400 });
        }
        if (submission.eventType === "MORTALITY" && !row.causeOfDeath && !row.deathCie10Code) {
          return NextResponse.json({ ok: false, error: `Fila ${index + 2}: mortalidad requiere causa de defunción o CIE-10.` }, { status: 400 });
        }
      }
      const rows = payload.rows.map((row) => ({ ...row, submissionId: submission.id, sourceFingerprint: fingerprint(row) }));
      const created = await prisma.caseRecord.createMany({ data: rows, skipDuplicates: true });
      await prisma.auditLog.create({ data: { action: "IMPORT_CASES", entity: "Submission", entityId: submission.id, afterData: { rows: created.count } } });
      return NextResponse.json({ ok: true, imported: created.count, submissionId: submission.id });
    }

    for (const [index, row] of payload.rows.entries()) {
      if (submission.eventType === "MORBIDITY" && !row.diagnosis && !row.cie10Code) {
        return NextResponse.json({ ok: false, error: `Fila ${index + 2}: morbilidad requiere diagnóstico o CIE-10.` }, { status: 400 });
      }
      if (submission.eventType === "MORTALITY" && !row.causeOfDeath && !row.deathCie10Code) {
        return NextResponse.json({ ok: false, error: `Fila ${index + 2}: mortalidad requiere causa de defunción o CIE-10.` }, { status: 400 });
      }
    }

    const [, created] = await prisma.$transaction([
      prisma.consolidatedRow.deleteMany({ where: { submissionId: submission.id } }),
      prisma.consolidatedRow.createMany({ data: payload.rows.map((row) => ({ ...row, submissionId: submission.id })) }),
    ]);
    await prisma.auditLog.create({ data: { action: "IMPORT_CONSOLIDATED", entity: "Submission", entityId: submission.id, afterData: { rows: created.count, mode: "replace" } } });
    return NextResponse.json({ ok: true, imported: created.count, submissionId: submission.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible importar la información." }, { status: 500 });
  }
}
