import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } } } });
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible consultar la auditoría." }, { status: 500 });
  }
}
