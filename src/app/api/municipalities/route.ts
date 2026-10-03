import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    // Restricción por municipio salvo SUPER_ADMIN
    const municipalityId = user.role === "SUPER_ADMIN" ? undefined : user.municipalityId ?? undefined;

    const rows = await prisma.municipality.findMany({
      where: { active: true, ...(municipalityId ? { id: municipalityId } : {}) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, rows: [], error: "Base de datos no disponible." }, { status: 503 });
  }
}
