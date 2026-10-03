import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submissionSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const municipalityId = searchParams.get("municipalityId");

  const rows = await prisma.submission.findMany({
    where: {
      ...(year ? { year: Number(year) } : {}),
      ...(month ? { month: Number(month) } : {}),
      ...(municipalityId ? { municipalityId } : {}),
    },
    include: { municipality: true, _count: { select: { cases: true, consolidatedRows: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }, { municipality: { name: "asc" } }],
    take: 250,
  });

  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  try {
    const parsed = submissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
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

    const submission = await prisma.submission.create({ data });
    await prisma.auditLog.create({
      data: { action: "CREATE_SUBMISSION", entity: "Submission", entityId: submission.id, afterData: data },
    });

    return NextResponse.json({ ok: true, submission, existing: false }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible crear el período de reporte." }, { status: 500 });
  }
}
