import { NextResponse } from "next/server";
import { FriendshipService } from "@/server/services/friendship-service";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/users/:id/friendship — añade a la persona como amiga, en ambos
 * sentidos y sin solicitud (TKT-036). Idempotente. `400` si es uno mismo,
 * `404` si la persona no existe.
 */
export async function PUT(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json(await FriendshipService.add(user.id, id));
  } catch (error) {
    return toHttpResponse(error);
  }
}

/**
 * DELETE /api/users/:id/friendship — quita a la persona de amigos, en ambos
 * sentidos (TKT-036). Idempotente. Mismos errores que `PUT`.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json(await FriendshipService.remove(user.id, id));
  } catch (error) {
    return toHttpResponse(error);
  }
}
