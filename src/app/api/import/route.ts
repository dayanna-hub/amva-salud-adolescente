import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importSchema } from "@/lib/validation";
import { requireUser, authErrorResponse, canAccessMunicipality, hasRole } from "@/lib/auth";
import { phaseFromAge } from "@/lib/domain";

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Deriva phase en el servidor a partir de age para evitar spoofing del cliente. */
function withDerivedPhase<T extends { age?: number | null; phase?: string | null }>(row: T): T {
  const phase = row.age !== null && row.age !== undefined ? phaseFromAge(row.age) : row.phase;
  return { ...row, phase: phase ?? null };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!hasRole(user, ["SUPER_ADMIN", "ADMIN_MUNICIPAL", "DIGITADOR"])) {
      return NextResponse.json({ ok: false, error: "Sin permisos para importar." }, { status: 403 });
    }

    const parsed = importSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    if (payload.kind === "POPULATION") {
      // Validar que el usuario tiene permisos sobre los municipios de las filas
      const municipalityIds = new Set(payload.rows.map((r) => r.municipalityId));
      for (const mid of municipalityIds) {
        if (!canAccessMunicipality(user, mid)) {
          return NextResponse.json({ ok: false, error: `Sin permisos sobre el municipio ${mid}.` }, { status: 403 });
        }
      }

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
      await prisma.auditLog.create({
        data: {
          action: "IMPORT_POPULATION",
          entity: "Population",
          userId: user.id,
          afterData: { rows: payload.rows.length },
        },
      });
      return NextResponse.json({ ok: true, imported: payload.rows.length });
    }

    const s = payload.submission;
    if (!canAccessMunicipality(user, s.municipalityId)) {
      return NextResponse.json({ ok: false, error: "Sin permisos sobre este municipio." }, { status: 403 });
    }

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
    // Reemplazo solo permitido en DRAFT (corregido: antes permitía VALIDATED)
    if (existing && payload.kind === "MONTHLY_CONSOLIDATED" && existing.status !== "DRAFT") {
      return NextResponse.json(
        { ok: false, error: `El reemplazo del consolidado solo está permitido en borrador. Estado actual: ${existing.status}.` },
        { status: 409 },
      );
    }

    let submission = existing;
    if (!submission) {
      const { municipalityId, ...submissionRest } = s;
      submission = await prisma.submission.create({
        data: {
          ...submissionRest,
          municipality: { connect: { id: municipalityId } },
          createdBy: { connect: { id: user.id } },
        },
      });
    }

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
      const rows = payload.rows.map((row) => {
        const derived = withDerivedPhase(row);
        const { ...rest } = derived;
        return { ...rest, submissionId: submission.id, sourceFingerprint: fingerprint(row) };
      });
      const created = await prisma.caseRecord.createMany({ data: rows, skipDuplicates: true });
      await prisma.auditLog.create({
        data: {
          action: "IMPORT_CASES",
          entity: "Submission",
          entityId: submission.id,
          userId: user.id,
          afterData: { rows: created.count },
        },
      });
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

    // Capturar beforeData para trazabilidad
    const previousRows = await prisma.consolidatedRow.findMany({
      where: { submissionId: submission.id },
      select: { age: true, phase: true, sex: true, zone: true, diagnosis: true, cie10Code: true, causeOfDeath: true, deathCie10Code: true, educationLevel: true, stratum: true, ethnicity: true, affiliationRegime: true, caseCount: true },
    });

    const rowsWithPhase = payload.rows.map((row) => withDerivedPhase(row));
    const [, created] = await prisma.$transaction([
      prisma.consolidatedRow.deleteMany({ where: { submissionId: submission.id } }),
      prisma.consolidatedRow.createMany({ data: rowsWithPhase.map((row) => ({ ...row, submissionId: submission.id })) }),
    ]);
    await prisma.auditLog.create({
      data: {
        action: "IMPORT_CONSOLIDATED",
        entity: "Submission",
        entityId: submission.id,
        userId: user.id,
        beforeData: { rows: previousRows },
        afterData: { rows: created.count, mode: "replace" },
      },
    });
    return NextResponse.json({ ok: true, imported: created.count, submissionId: submission.id });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible importar la información." }, { status: 500 });
  }
}
