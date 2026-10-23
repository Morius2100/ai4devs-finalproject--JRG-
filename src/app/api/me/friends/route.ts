import { NextResponse } from "next/server";
import { listUsersQuerySchema } from "@/lib/validation/users";
import { UserService } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";

/**
 * GET /api/me/friends — amigos del usuario de la sesión, en orden
 * alfabético y paginados de 20 (TKT-060). `400` si el cursor es inválido.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const parsed = listUsersQuerySchema
      .pick({ cursor: true })
      .safeParse({ cursor: new URL(request.url).searchParams.get("cursor") ?? undefined });
    if (!parsed.success) {
      throw new ValidationError(
        "Parámetros inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    return NextResponse.json(await UserService.listFriends({ userId: user.id, ...parsed.data }));
  } catch (error) {
    return toHttpResponse(error);
  }
}
