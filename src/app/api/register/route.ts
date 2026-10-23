import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { AuthService } from "@/server/services/auth-service";
import { ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";

/**
 * POST /api/register — ruta pública (TKT-006).
 * Contrato: docs/02-arquitectura.md §2.5.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError(
        "Datos de registro inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const user = await AuthService.register(parsed.data);
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (error) {
    return toHttpResponse(error);
  }
}
