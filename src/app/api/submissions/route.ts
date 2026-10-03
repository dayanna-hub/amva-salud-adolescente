import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submissionSchema, safeInt } from "@/lib/validation";
import { requireUser, authErrorResponse, canAccessMunicipality, hasRole } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const year = safeInt(searchParams.get("year"));
    const month = safeInt(searchParams.get("month"));
    const municipalityId = searchParams.get("municipalityId") ?? undefined;

    // Restricción por municipio salvo SUPER_ADMIN
    const scopeMunicipalityId = user.role === "SUPER_ADMIN" ? municipalityId : user.municipalityId ?? undefined;

    const rows = await prisma.submission.findMany({
      where: {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
        ...(scopeMunicipalityId ? { municipalityId: scopeMunicipalityId } : {}),
      },
      include: { municipality: true, _count: { select: { cases: true, consolidatedRows: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }, { municipality: { name: "asc" } }],
      take: 250,
    });

    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar los períodos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!hasRole(user, ["SUPER_ADMIN", "ADMIN_MUNICIPAL", "DIGITADOR"])) {
      return NextResponse.json({ ok: false, error: "Sin permisos para crear períodos." }, { status: 403 });
    }

    const parsed = submissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    if (!canAccessMunicipality(user, data.municipalityId)) {
      return NextResponse.json({ ok: false, error: "Sin permisos sobre este municipio." }, { status: 403 });
    }

    const existing = await prisma.submission.findUnique({
      where: {
        municipalityId_year_month_eventType: {
          municipalityId: data.municipalityId,
          year: data.year,
          month: data.month,
          eventType: data.eventType,
        },
      },
    });

    if (existing) {
      if (existing.sourceType !== data.sourceType) {
        return NextResponse.json(
          { ok: false, error: "El período ya tiene otra fuente oficial. No se pueden mezclar casos individuales y consolidado mensual." },
          { status: 409 },
        );
      }
      if (existing.status === "CLOSED") {
        return NextResponse.json({ ok: false, error: "El período ya está cerrado." }, { status: 409 });
      }
      return NextResponse.json({ ok: true, submission: existing, existing: true });
    }

    const { municipalityId, ...rest } = data;
    const submission = await prisma.submission.create({
      data: {
        ...rest,
        municipality: { connect: { id: municipalityId } },
        createdBy: { connect: { id: user.id } },
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "CREATE_SUBMISSION",
        entity: "Submission",
        entityId: submission.id,
        userId: user.id,
        afterData: data,
      },
    });

    return NextResponse.json({ ok: true, submission, existing: false }, { status: 201 });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible crear el período de reporte." }, { status: 500 });
  }
}
