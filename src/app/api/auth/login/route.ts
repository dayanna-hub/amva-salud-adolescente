import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email y contraseña son obligatorios." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active || !user.passwordHash) {
      return NextResponse.json({ ok: false, error: "Credenciales inválidas." }, { status: 401 });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Credenciales inválidas." }, { status: 401 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await setSessionCookie({
      userId: user.id,
      role: user.role,
      municipalityId: user.municipalityId,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        municipalityId: user.municipalityId,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "No fue posible iniciar sesión." }, { status: 500 });
  }
}
