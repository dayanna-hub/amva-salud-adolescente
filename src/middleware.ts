import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "amva_session";

const PUBLIC_PATHS = new Set<string>(["/login"]);

function isPublicApiPath(pathname: string): boolean {
  // /api/auth/login y /api/health son públicos. /api/auth/logout requiere
  // cookie pero no requiere sesión previa (es idempotente). El resto
  // requiere sesión.
  if (pathname === "/api/health") return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname === "/api/auth/logout") return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Activos estáticos y archivos de plantilla son públicos
  if (pathname.startsWith("/_next") || pathname.startsWith("/templates") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Exponer el pathname al layout (server component) mediante un header.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // APIs públicas
  if (pathname.startsWith("/api/")) {
    if (isPublicApiPath(pathname)) return NextResponse.next({ request: { headers: requestHeaders } });
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
    }
    // La verificación criptográfica real se hace en cada ruta con requireUser(),
    // aquí solo se comprueba la presencia del cookie para fallar rápido.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Páginas: solo /login es pública, las demás requieren cookie
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
