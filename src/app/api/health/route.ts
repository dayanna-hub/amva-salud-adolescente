import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DeepHealthRow = {
  database_name: string;
  database_user: string;
  neon_project_id: string | null;
  neon_branch_id: string | null;
  neon_endpoint_id: string | null;
};

export async function GET() {
  let identity: DeepHealthRow | null = null;

  try {
    const rows = await prisma.$queryRaw<DeepHealthRow[]>`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        current_setting('neon.project_id', true) AS neon_project_id,
        current_setting('neon.branch_id', true) AS neon_branch_id,
        current_setting('neon.endpoint_id', true) AS neon_endpoint_id
    `;
    identity = rows[0] ?? null;

    const [municipalityCount, submissionCount, populationCount] = await Promise.all([
      prisma.municipality.count(),
      prisma.submission.count(),
      prisma.population.count(),
    ]);

    return NextResponse.json({
      ok: true,
      database: "connected",
      schema: "ready",
      identity,
      counts: {
        municipalities: municipalityCount,
        submissions: submissionCount,
        populationRows: populationCount,
      },
    });
  } catch (error) {
    console.error(error);

    const known = error instanceof Prisma.PrismaClientKnownRequestError
      ? {
          code: error.code,
          meta: error.meta
            ? {
                modelName: typeof error.meta.modelName === "string" ? error.meta.modelName : null,
                table: typeof error.meta.table === "string" ? error.meta.table : null,
                column: typeof error.meta.column === "string" ? error.meta.column : null,
              }
            : null,
        }
      : null;

    return NextResponse.json(
      {
        ok: false,
        database: identity ? "connected" : "error",
        schema: "error",
        identity,
        error: error instanceof Error ? error.name : "UnknownError",
        prisma: known,
      },
      { status: 503 },
    );
  }
}
