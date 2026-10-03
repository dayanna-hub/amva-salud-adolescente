import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const grouped = await prisma.population.groupBy({
    by: ["municipalityId"],
    where: { year },
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
}
