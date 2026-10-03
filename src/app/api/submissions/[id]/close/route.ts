import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { _count: { select: { cases: true, consolidatedRows: true } } },
    });

    if (!submission) return NextResponse.json({ ok: false, error: "Período no encontrado." }, { status: 404 });
    if (submission.status === "CLOSED") return NextResponse.json({ ok: true, submission });

    const count = submission.sourceType === "INDIVIDUAL_CASES" ? submission._count.cases : submission._count.consolidatedRows;
    if (count === 0) {
      return NextResponse.json({ ok: false, error: "No se puede cerrar un período sin información." }, { status: 409 });
    }

    const closed = await prisma.submission.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { action: "CLOSE_SUBMISSION", entity: "Submission", entityId: id, afterData: { status: "CLOSED" } },
    });

    return NextResponse.json({ ok: true, submission: closed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible cerrar el período." }, { status: 500 });
  }
}
