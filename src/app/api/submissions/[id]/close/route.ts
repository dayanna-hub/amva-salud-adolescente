import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse, canAccessMunicipality, hasRole } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!hasRole(user, ["SUPER_ADMIN", "ADMIN_MUNICIPAL"])) {
      return NextResponse.json({ ok: false, error: "Solo un administrador puede cerrar períodos." }, { status: 403 });
    }

    const { id } = await context.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { _count: { select: { cases: true, consolidatedRows: true } } },
    });

    if (!submission) return NextResponse.json({ ok: false, error: "Período no encontrado." }, { status: 404 });
    if (!canAccessMunicipality(user, submission.municipalityId)) {
      return NextResponse.json({ ok: false, error: "Sin permisos sobre este municipio." }, { status: 403 });
    }
    if (submission.status === "CLOSED") return NextResponse.json({ ok: true, submission });

    const count = submission.sourceType === "INDIVIDUAL_CASES" ? submission._count.cases : submission._count.consolidatedRows;
    if (count === 0) {
      return NextResponse.json({ ok: false, error: "No se puede cerrar un período sin información." }, { status: 409 });
    }

    const before = { status: submission.status };
    const closed = await prisma.submission.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        action: "CLOSE_SUBMISSION",
        entity: "Submission",
        entityId: id,
        userId: user.id,
        beforeData: before,
        afterData: { status: "CLOSED" },
      },
    });

    return NextResponse.json({ ok: true, submission: closed });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible cerrar el período." }, { status: 500 });
  }
}
