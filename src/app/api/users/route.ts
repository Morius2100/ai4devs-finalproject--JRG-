import { NextResponse } from "next/server";
import { listUsersQuerySchema } from "@/lib/validation/users";
import { UserService } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";

/**
 * GET /api/users — lista y búsqueda de personas (TKT-034). Requiere sesión;
 * sin `q` → todas las personas salvo el propio usuario, en orden alfabético.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const parsed = listUsersQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    if (!parsed.success) {
      throw new ValidationError(
        "Parámetros de búsqueda inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const page = await UserService.search({ viewerId: user.id, ...parsed.data });
    return NextResponse.json(page);
  } catch (error) {
    return toHttpResponse(error);
  }
}
