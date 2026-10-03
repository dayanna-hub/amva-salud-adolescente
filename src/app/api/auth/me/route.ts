import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
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
    const errResp = authErrorResponse(error);
    if (errResp) return errResp;
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error de sesión." }, { status: 500 });
  }
}
