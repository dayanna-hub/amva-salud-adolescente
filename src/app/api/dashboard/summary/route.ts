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
    const requestedMunicipalityId = searchParams.get("municipalityId") || undefined;
    // Restricción por municipio salvo SUPER_ADMIN
    const municipalityId = user.role === "SUPER_ADMIN" ? requestedMunicipalityId : user.municipalityId ?? undefined;

    const submissions = await prisma.submission.findMany({
      where: {
        year,
        ...(municipalityId ? { municipalityId } : {}),
        status: { in: ["VALIDATED", "CLOSED"] },
      },
      include: { municipality: true, _count: { select: { cases: true, consolidatedRows: true } } },
    });

    // Agregación en BD en lugar de cargar todas las filas en memoria
    const individualCasesAgg = await prisma.caseRecord.groupBy({
      by: ["submissionId"],
      where: {
        submission: {
          year,
          ...(municipalityId ? { municipalityId } : {}),
          status: { in: ["VALIDATED", "CLOSED"] },
          sourceType: "INDIVIDUAL_CASES",
        },
      },
      _count: { _all: true },
    });

    const consolidatedAgg = await prisma.consolidatedRow.groupBy({
      by: ["submissionId"],
      where: {
        submission: {
          year,
          ...(municipalityId ? { municipalityId } : {}),
          status: { in: ["VALIDATED", "CLOSED"] },
          sourceType: "MONTHLY_CONSOLIDATED",
        },
      },
      _sum: { caseCount: true },
    });

    const individualCount = new Map(individualCasesAgg.map((row) => [row.submissionId, row._count._all]));
    const consolidatedCount = new Map(consolidatedAgg.map((row) => [row.submissionId, row._sum.caseCount ?? 0]));

    const population = await prisma.population.aggregate({
      where: { year, ...(municipalityId ? { municipalityId } : {}) },
      _sum: { populationCount: true },
    });

    let morbidity = 0;
    let mortality = 0;
    const monthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, morbidity: 0, mortality: 0 }));
    const municipalityTotals = new Map<string, { name: string; morbidity: number; mortality: number }>();

    for (const submission of submissions) {
      const total =
        submission.sourceType === "INDIVIDUAL_CASES"
          ? individualCount.get(submission.id) ?? 0
          : consolidatedCount.get(submission.id) ?? 0;

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
  } catch (error) {
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar el resumen." }, { status: 500 });
  }
}
