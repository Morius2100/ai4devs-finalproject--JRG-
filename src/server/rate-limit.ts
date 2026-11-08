import { createHash } from "node:crypto";
import { prisma } from "@/server/db/client";
import { RateLimitedError } from "@/server/errors";

/**
 * Límite de intentos (S-03, spec `confidencialidad-usuarios`). Ventana fija
 * por clave guardada en PostgreSQL: en Vercel las funciones no comparten
 * memoria, así que un contador en proceso no serviría. Cada llamada es un
 * único `INSERT … ON CONFLICT` atómico.
 */

export type RateLimitRule = { limit: number; windowSeconds: number };

/** Límites por defecto. Los de inicio de sesión cuentan intentos, no solo fallos. */
export const RATE_LIMITS = {
  // Mismo email desde la misma IP: frena la fuerza bruta sobre una cuenta.
  loginAccount: { limit: 10, windowSeconds: 60 },
  // Misma IP con cualquier email: frena el relleno de credenciales.
  loginIp: { limit: 60, windowSeconds: 60 },
  register: { limit: 20, windowSeconds: 60 * 60 },
  friendRequest: { limit: 30, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

function isDisabled(): boolean {
  // Solo para entornos de prueba que registran muchos usuarios desde una IP.
  return process.env.RATE_LIMIT_DISABLED === "1";
}

/** IP del cliente. En Vercel `x-forwarded-for` lo fija la plataforma; en otros hosts puede falsearse. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Clave estable sin datos personales: el email se guarda como hash. */
export function hashKeyPart(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/**
 * Cuenta una petición para `key` y lanza `RateLimitedError` si supera `limit`
 * dentro de la ventana. La petición que excede el límite también se cuenta.
 */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<void> {
  if (isDisabled()) {
    return;
  }

  const rows = await prisma.$queryRaw<{ count: number; retry_after: number }[]>`
    INSERT INTO rate_limits AS r (key, window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN r.window_start <= now() - make_interval(secs => ${rule.windowSeconds}::double precision)
        THEN 1 ELSE r.count + 1 END,
      window_start = CASE
        WHEN r.window_start <= now() - make_interval(secs => ${rule.windowSeconds}::double precision)
        THEN now() ELSE r.window_start END
    RETURNING r.count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
        r.window_start + make_interval(secs => ${rule.windowSeconds}::double precision) - now()
      ))))::int AS retry_after
  `;

  // Limpieza ocasional de contadores antiguos, sin bloquear la petición.
  if (Math.random() < 0.01) {
    void prisma.$executeRaw`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`.catch(
      () => undefined,
    );
  }

  const { count, retry_after: retryAfter } = rows[0];
  if (count > rule.limit) {
    throw new RateLimitedError(retryAfter);
  }
}

/** Límite de inicio de sesión (web y app): por cuenta+IP y por IP. */
export async function consumeLoginRateLimit(headers: Headers, email: string): Promise<void> {
  const ip = clientIp(headers);
  await consumeRateLimit(`login:${ip}:${hashKeyPart(email)}`, RATE_LIMITS.loginAccount);
  await consumeRateLimit(`login-ip:${ip}`, RATE_LIMITS.loginIp);
}

/** Límite de registro por IP. */
export async function consumeRegisterRateLimit(headers: Headers): Promise<void> {
  await consumeRateLimit(`register:${clientIp(headers)}`, RATE_LIMITS.register);
}

/** Límite de solicitudes de amistad por usuario. */
export async function consumeFriendRequestRateLimit(userId: string): Promise<void> {
  await consumeRateLimit(`friend-request:${userId}`, RATE_LIMITS.friendRequest);
}
