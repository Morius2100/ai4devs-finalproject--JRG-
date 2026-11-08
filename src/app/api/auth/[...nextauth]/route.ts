import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/server/auth";
import { RateLimitedError } from "@/server/errors";
import { consumeLoginRateLimit } from "@/server/rate-limit";

export const { GET } = handlers;

/**
 * Inicio de sesión web con límite de intentos (S-03): antes de que Auth.js
 * compruebe la contraseña de `/api/auth/callback/credentials` se cuenta el
 * intento por IP+email y por IP. Al superarlo responde `429` con
 * `Retry-After`. El cuerpo lleva `url` con `code=rate_limited` porque
 * `signIn` de `next-auth/react` lo lee para devolver `{ error, code }`.
 */
export async function POST(request: NextRequest) {
  if (new URL(request.url).pathname.endsWith("/callback/credentials")) {
    try {
      const form = await request.clone().formData().catch(() => null);
      const email = form?.get("email");
      await consumeLoginRateLimit(request.headers, typeof email === "string" ? email : "");
    } catch (error) {
      if (error instanceof RateLimitedError) {
        const url = new URL("/login", request.nextUrl.origin);
        url.searchParams.set("error", "CredentialsSignin");
        url.searchParams.set("code", "rate_limited");
        return NextResponse.json(
          { url: url.toString(), error: { code: error.code, message: error.message } },
          { status: error.status, headers: { "Retry-After": String(error.retryAfterSeconds) } },
        );
      }
      throw error;
    }
  }
  return handlers.POST(request);
}
