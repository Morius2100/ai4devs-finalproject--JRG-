import { decode, encode } from "next-auth/jwt";
import { THIRTY_DAYS_IN_SECONDS } from "@/server/auth/config";
import type { SessionUser } from "@/server/auth/require-user";

// Sal distinta de la cookie web: un token de la app no sirve como cookie ni al revés.
const APP_TOKEN_SALT = "opina.app-token";

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET es obligatoria");
  }
  return value;
}

/** Token de sesión de la app Android (design.md D4): JWE de Auth.js válido 30 días. */
export function createAppToken(user: SessionUser): Promise<string> {
  return encode({
    salt: APP_TOKEN_SALT,
    secret: secret(),
    maxAge: THIRTY_DAYS_IN_SECONDS,
    token: { id: user.id, username: user.username, sub: user.id },
  });
}

/** Usuario del `Authorization: Bearer` o `null` si falta, está manipulado o ha caducado. Compatible con Edge. */
export async function readBearerUser(headers: Headers): Promise<SessionUser | null> {
  const match = /^Bearer\s+(.+)$/i.exec(headers.get("authorization") ?? "");
  if (!match) {
    return null;
  }
  try {
    const payload = await decode({ salt: APP_TOKEN_SALT, secret: secret(), token: match[1] });
    if (typeof payload?.id !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { id: payload.id, username: payload.username };
  } catch {
    return null;
  }
}
