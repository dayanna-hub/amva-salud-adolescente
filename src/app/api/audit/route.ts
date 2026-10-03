import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true, email: true } } },
      // Super Admin ve todo, los demás solo su municipio
      where: user.role === "SUPER_ADMIN" ? {} : { user: { municipalityId: user.municipalityId ?? "" } },
    });
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar la auditoría." }, { status: 500 });
  }
}
