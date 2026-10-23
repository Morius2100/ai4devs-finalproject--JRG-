import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { readBearerUser } from "@/server/auth/bearer";
import { UnauthorizedError } from "@/server/errors";

export type SessionUser = {
  id: string;
  username: string;
};

/**
 * Obtiene el usuario de la sesión actual o lanza `UnauthorizedError` (401).
 * Acepta la cookie de la web o el token Bearer de la app (TKT-042). Lo usan
 * los Route Handlers que requieren sesión (el middleware ya filtra la
 * mayoría de las peticiones anónimas, pero los handlers no deben confiar
 * únicamente en él).
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (session?.user) {
    return { id: session.user.id, username: session.user.username };
  }

  const bearerUser = await readBearerUser(await headers());
  if (bearerUser) {
    return bearerUser;
  }
  throw new UnauthorizedError();
}
