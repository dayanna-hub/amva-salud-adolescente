import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Sesión mínima basada en cookies httpOnly firmadas con HMAC-SHA256.
 *
 * No es un reemplazo completo de Better Auth / NextAuth: es un mecanismo
 * provisional, seguro en criptografía, que permite:
 *   - identificar al usuario autenticado en cada request
 *   - poblar createdById / userId en auditoría
 *   - aplicar RBAC por rol y municipio
 *
 * El secreto se lee de AUTH_SECRET (env). Si no está definido, la
 * autenticación falla en modo "denegar por defecto".
 */

const COOKIE_NAME = "amva_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 horas

export type SessionPayload = {
  userId: string;
  role: string;
  municipalityId: string | null;
  exp: number;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET no definido o demasiado corto (mínimo 32 caracteres).");
  }
  return s;
}

function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token: string): SessionPayload | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const token = sign({ ...payload, exp: Date.now() + SESSION_TTL_MS });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN_MUNICIPAL" | "DIGITADOR" | "ANALISTA";
  municipalityId: string | null;
};

/**
 * Devuelve el usuario autenticado. Lanza si la sesión es inválida o el
 * usuario ya no existe / está inactivo. En rutas de API, el llamador
 * debe capturar y devolver 401.
 */
export async function requireUser(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) {
    const err = new Error("NO_SESSION") as Error & { code?: string };
    err.code = "NO_SESSION";
    throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) {
    const err = new Error("USER_INACTIVE") as Error & { code?: string };
    err.code = "USER_INACTIVE";
    throw err;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    municipalityId: user.municipalityId,
  };
}

/**
 * Helper para responder 401 / 403 uniformemente desde rutas de API.
 */
export function authErrorResponse(error: unknown): Response | null {
  if (error instanceof Error && "code" in error) {
    if (error.code === "NO_SESSION") {
      return new Response(JSON.stringify({ ok: false, error: "No autenticado." }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    if (error.code === "USER_INACTIVE") {
      return new Response(JSON.stringify({ ok: false, error: "Usuario inactivo." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
  }
  return null;
}

/**
 * Verifica que el usuario puede operar sobre un municipio dado.
 * - SUPER_ADMIN: siempre.
 * - ADMIN_MUNICIPAL / DIGITADOR / ANALISTA: solo sobre su municipio.
 */
export function canAccessMunicipality(user: AuthUser, municipalityId: string | null | undefined): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  if (!municipalityId) return false;
  return user.municipalityId === municipalityId;
}

/**
 * Verifica que el usuario tiene uno de los roles permitidos.
 */
export function hasRole(user: AuthUser, roles: AuthUser["role"][]): boolean {
  return roles.includes(user.role);
}
