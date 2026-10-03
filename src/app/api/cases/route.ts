import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { caseSchema, safeInt } from "@/lib/validation";
import { requireUser, authErrorResponse, canAccessMunicipality, hasRole } from "@/lib/auth";

const PHASE_VALUES = ["EARLY_10_13", "MIDDLE_14_17", "LATE_18_19"] as const;
type PhaseValue = (typeof PHASE_VALUES)[number];

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId") ?? undefined;
    const requestedMunicipalityId = searchParams.get("municipalityId") ?? undefined;
    const year = safeInt(searchParams.get("year"));
    const month = safeInt(searchParams.get("month"));
    const eventTypeParam = searchParams.get("eventType");
    const eventType = eventTypeParam === "MORBIDITY" || eventTypeParam === "MORTALITY" ? eventTypeParam : undefined;
    const phaseParam = searchParams.get("phase");
    const phase: PhaseValue | undefined = PHASE_VALUES.includes(phaseParam as PhaseValue) ? (phaseParam as PhaseValue) : undefined;

    // Restricción por municipio salvo SUPER_ADMIN
    const scopeMunicipalityId = user.role === "SUPER_ADMIN" ? requestedMunicipalityId : user.municipalityId ?? undefined;

    const where: Prisma.CaseRecordWhereInput = {
      ...(submissionId ? { submissionId } : {}),
      ...(phase ? { phase } : {}),
      submission: {
        ...(scopeMunicipalityId ? { municipalityId: scopeMunicipalityId } : {}),
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(eventType ? { eventType } : {}),
      },
    };

    const rows = await prisma.caseRecord.findMany({
      where,
      include: { submission: { include: { municipality: true } } },
      orderBy: { eventDate: "desc" },
      take: 500,
    });

    // DTO saneado: no exponer internals de Prisma
    const safeRows = rows.map((row) => ({
      id: row.id,
      eventDate: row.eventDate,
      municipalityId: row.municipalityIdSnapshot,
      municipalityName: row.submission.municipality.name,
      age: row.age,
      phase: row.phase,
      sex: row.sex,
      zone: row.zone,
      diagnosis: row.diagnosis,
      cie10Code: row.cie10Code,
      causeOfDeath: row.causeOfDeath,
      deathCie10Code: row.deathCie10Code,
      educationLevel: row.educationLevel,
      stratum: row.stratum,
      ethnicity: row.ethnicity,
      affiliationRegime: row.affiliationRegime,
      submissionId: row.submissionId,
      submissionStatus: row.submission.status,
      year: row.submission.year,
      month: row.submission.month,
    }));

    return NextResponse.json({ ok: true, rows: safeRows });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar los casos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!hasRole(user, ["SUPER_ADMIN", "ADMIN_MUNICIPAL", "DIGITADOR"])) {
      return NextResponse.json({ ok: false, error: "Sin permisos para registrar casos." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = caseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({ where: { id: parsed.data.submissionId } });
    if (!submission) return NextResponse.json({ ok: false, error: "Período no encontrado" }, { status: 404 });
    if (submission.status === "CLOSED") return NextResponse.json({ ok: false, error: "El período está cerrado" }, { status: 409 });
    if (submission.sourceType !== "INDIVIDUAL_CASES") {
      return NextResponse.json({ ok: false, error: "Este período usa consolidado mensual como fuente oficial" }, { status: 409 });
    }
    if (parsed.data.municipalityIdSnapshot !== submission.municipalityId) {
      return NextResponse.json({ ok: false, error: "El municipio del caso no coincide con el período de reporte." }, { status: 409 });
    }
    if (!canAccessMunicipality(user, submission.municipalityId)) {
      return NextResponse.json({ ok: false, error: "Sin permisos sobre este municipio." }, { status: 403 });
    }

    // Validar que eventDate cae dentro del período (year/month)
    const eventDate = new Date(parsed.data.eventDate);
    if (eventDate.getUTCFullYear() !== submission.year || eventDate.getUTCMonth() + 1 !== submission.month) {
      return NextResponse.json(
        { ok: false, error: `La fecha del evento no pertenece al período ${submission.year}-${String(submission.month).padStart(2, "0")}.` },
        { status: 400 },
      );
    }

    if (submission.eventType === "MORBIDITY" && !parsed.data.diagnosis && !parsed.data.cie10Code) {
      return NextResponse.json({ ok: false, error: "Para morbilidad se requiere diagnóstico o código CIE-10." }, { status: 400 });
    }
    if (submission.eventType === "MORTALITY" && !parsed.data.causeOfDeath && !parsed.data.deathCie10Code) {
      return NextResponse.json({ ok: false, error: "Para mortalidad se requiere causa de defunción o código CIE-10." }, { status: 400 });
    }

    const { submissionId, ...caseData } = parsed.data;
    const record = await prisma.caseRecord.create({
      data: {
        ...caseData,
        submission: { connect: { id: submissionId } },
        createdBy: { connect: { id: user.id } },
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "CREATE_CASE",
        entity: "CaseRecord",
        entityId: record.id,
        userId: user.id,
        afterData: parsed.data as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible registrar el caso" }, { status: 500 });
  }
}
