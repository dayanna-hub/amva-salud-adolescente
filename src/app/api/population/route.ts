import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { safeInt } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const requestedYear = safeInt(searchParams.get("year"));
    const year = requestedYear ?? new Date().getFullYear();
    const municipalityId = user.role === "SUPER_ADMIN" ? undefined : user.municipalityId ?? undefined;

    const grouped = await prisma.population.groupBy({
      by: ["municipalityId"],
      where: { year, ...(municipalityId ? { municipalityId } : {}) },
      _sum: { populationCount: true },
    });
    const municipalities = await prisma.municipality.findMany({ where: { id: { in: grouped.map((x) => x.municipalityId) } } });
    const names = new Map(municipalities.map((m) => [m.id, m.name]));

    return NextResponse.json({
      ok: true,
      year,
      total: grouped.reduce((sum, x) => sum + (x._sum.populationCount ?? 0), 0),
      municipalities: grouped.map((x) => ({ municipalityId: x.municipalityId, name: names.get(x.municipalityId), population: x._sum.populationCount ?? 0 })),
    });
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar la población." }, { status: 500 });
  }
}
