import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { createAppToken } from "@/server/auth/bearer";
import { UnauthorizedError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";
import { AuthService } from "@/server/services/auth-service";

/**
 * POST /api/auth/token — inicio de sesión de la app Android (TKT-042):
 * devuelve un token para `Authorization: Bearer`. Mismo mensaje genérico que
 * el login web ante cualquier fallo de credenciales.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    const user = parsed.success
      ? await AuthService.verifyCredentials(parsed.data.email, parsed.data.password)
      : null;
    if (!user) {
      throw new UnauthorizedError("Credenciales incorrectas");
    }

    const token = await createAppToken(user);
    return NextResponse.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    return toHttpResponse(error);
  }
}
