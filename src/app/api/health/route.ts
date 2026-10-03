import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type HealthRow = {
  database_name: string;
};

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<HealthRow[]>`
      SELECT current_database() AS database_name
    `;
    const ok = rows.length > 0;

    const [municipalityCount, submissionCount, populationCount] = await Promise.all([
      prisma.municipality.count(),
      prisma.submission.count(),
      prisma.population.count(),
    ]);

    return NextResponse.json({
      ok: true,
      database: ok ? "connected" : "error",
      schema: "ready",
      counts: {
        municipalities: municipalityCount,
        submissions: submissionCount,
        populationRows: populationCount,
      },
    });
  } catch (error) {
    console.error(error);
    // No exponer metadatos internos de Prisma al cliente
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        schema: "error",
        error: "DB_CONNECTION_ERROR",
      },
      { status: 503 },
    );
  }
}
