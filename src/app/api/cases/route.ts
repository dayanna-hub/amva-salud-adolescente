import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submissionId");
  const municipalityId = searchParams.get("municipalityId");
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const eventType = searchParams.get("eventType");

  const rows = await prisma.caseRecord.findMany({
    where: {
      ...(submissionId ? { submissionId } : {}),
      submission: {
        ...(municipalityId ? { municipalityId } : {}),
        ...(year ? { year: Number(year) } : {}),
        ...(month ? { month: Number(month) } : {}),
        ...(eventType === "MORBIDITY" || eventType === "MORTALITY" ? { eventType } : {}),
      },
    },
    include: { submission: { include: { municipality: true } } },
    orderBy: { eventDate: "desc" },
    take: 500,
  });

  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  try {
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

    if (submission.eventType === "MORBIDITY" && !parsed.data.diagnosis && !parsed.data.cie10Code) {
      return NextResponse.json({ ok: false, error: "Para morbilidad se requiere diagnóstico o código CIE-10." }, { status: 400 });
    }
    if (submission.eventType === "MORTALITY" && !parsed.data.causeOfDeath && !parsed.data.deathCie10Code) {
      return NextResponse.json({ ok: false, error: "Para mortalidad se requiere causa de defunción o código CIE-10." }, { status: 400 });
    }

    const record = await prisma.caseRecord.create({ data: parsed.data });
    await prisma.auditLog.create({
      data: { action: "CREATE_CASE", entity: "CaseRecord", entityId: record.id, afterData: parsed.data },
    });
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible registrar el caso" }, { status: 500 });
  }
}
