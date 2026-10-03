import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const municipalityId = searchParams.get("municipalityId") || undefined;

  const submissions = await prisma.submission.findMany({
    where: {
      year,
      ...(municipalityId ? { municipalityId } : {}),
      status: { in: ["VALIDATED", "CLOSED"] },
    },
    include: { municipality: true, cases: true, consolidatedRows: true },
  });

  const population = await prisma.population.aggregate({
    where: { year, ...(municipalityId ? { municipalityId } : {}) },
    _sum: { populationCount: true },
  });

  let morbidity = 0;
  let mortality = 0;
  const monthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, morbidity: 0, mortality: 0 }));
  const municipalityTotals = new Map<string, { name: string; morbidity: number; mortality: number }>();

  for (const submission of submissions) {
    const total = submission.sourceType === "INDIVIDUAL_CASES"
      ? submission.cases.length
      : submission.consolidatedRows.reduce((sum, row) => sum + row.caseCount, 0);

    const bucket = monthly[submission.month - 1];
    const municipality = municipalityTotals.get(submission.municipalityId) ?? {
      name: submission.municipality.name,
      morbidity: 0,
      mortality: 0,
    };

    if (submission.eventType === "MORBIDITY") {
      morbidity += total;
      bucket.morbidity += total;
      municipality.morbidity += total;
    } else {
      mortality += total;
      bucket.mortality += total;
      municipality.mortality += total;
    }
    municipalityTotals.set(submission.municipalityId, municipality);
  }

  const populationTotal = population._sum.populationCount ?? 0;
  const mortalityRatePer100k = populationTotal > 0 ? (mortality / populationTotal) * 100000 : null;

  return NextResponse.json({
    ok: true,
    year,
    morbidity,
    mortality,
    population: populationTotal,
    mortalityRatePer100k,
    submissions: submissions.length,
    monthly,
    municipalities: [...municipalityTotals.values()].sort((a, b) => b.morbidity - a.morbidity),
  });
}
