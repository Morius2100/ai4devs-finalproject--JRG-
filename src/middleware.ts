import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { readBearerUser } from "@/server/auth/bearer";
import { authConfig } from "@/server/auth/config";

// Instancia "edge-safe" (sin proveedores) solo para leer la sesión (TKT-008).
const { auth } = NextAuth(authConfig);

const PUBLIC_PAGES = new Set(["/login", "/registro"]);
const PUBLIC_API_PREFIXES = ["/api/register", "/api/auth", "/api/health", "/api/media"];

// Orígenes del WebView de Capacitor (TKT-043, design.md D6).
const APP_ORIGINS = new Set(["https://localhost", "http://localhost", "capacitor://localhost"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) {
    return true;
  }
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function withCors(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return response;
  }
  response.headers.append("Vary", "Origin");
  const origin = request.headers.get("origin");
  if (origin && APP_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.headers.set("Access-Control-Max-Age", "600");
  }
  return response;
}

/**
 * Protección de rutas (TKT-008, HU-00 CA-00.5): exige sesión iniciada en
 * toda pantalla o endpoint salvo /login, /registro, /api/register,
 * /api/health, /api/media/* y /api/auth/*. La sesión es la cookie de la web o el token Bearer de la app
 * (TKT-042). Páginas sin sesión → redirección a /login; API → 401 JSON.
 * Las respuestas de `/api/*` llevan CORS solo para los orígenes de la app.
 */
export default auth(async (request) => {
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return withCors(request, new NextResponse(null, { status: 204 }));
  }

  if (isPublicPath(pathname) || request.auth || (await readBearerUser(request.headers))) {
    return withCors(request, NextResponse.next());
  }

  if (pathname.startsWith("/api/")) {
    return withCors(
      request,
      NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Es necesario iniciar sesión" } },
        { status: 401 },
      ),
    );
  }

  const loginUrl = new URL("/login", request.nextUrl.origin);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  // Excluye assets estáticos y archivos de Next.js internos.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|manifest.webmanifest|sw.js|pwa-icon|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
