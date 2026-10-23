import { NextResponse } from "next/server";
import { userIdSchema, userTopicsQuerySchema } from "@/lib/validation/users";
import { TopicService } from "@/server/services/topic-service";
import { UserService } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { NotFoundError, ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";

/**
 * GET /api/users/:id/topics — temas creados por una persona (TKT-035).
 * `sort=recent` (por defecto) o `sort=top`. Los privados solo los ven el
 * propio autor y sus amigos. `404` si la persona no existe; `400` si `sort`
 * o `cursor` son inválidos.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireUser();
    const { id } = await params;

    if (!userIdSchema.safeParse(id).success) {
      throw new NotFoundError("Persona no encontrada");
    }

    const url = new URL(request.url);
    const parsed = userTopicsQuerySchema.safeParse({
      sort: url.searchParams.get("sort") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    if (!parsed.success) {
      throw new ValidationError(
        "Parámetros inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    // `getProfile` lanza NotFoundError si la persona no existe.
    await UserService.getProfile(id, viewer.id);

    const page = await TopicService.listByAuthor({
      authorId: id,
      viewerId: viewer.id,
      ...parsed.data,
    });
    return NextResponse.json(page);
  } catch (error) {
    return toHttpResponse(error);
  }
}
