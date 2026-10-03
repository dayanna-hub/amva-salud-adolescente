import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.municipality.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, rows: [], error: "Base de datos no disponible." }, { status: 503 });
  }
}
