import { NextResponse } from "next/server";
import { FriendshipService } from "@/server/services/friendship-service";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";
import { consumeFriendRequestRateLimit } from "@/server/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/users/:id/friendship — solicita la amistad de la persona (TKT-079,
 * Q-04). No concede acceso: la amistad, mutua, solo existe cuando la otra
 * persona acepta. Si ella ya había solicitado la nuestra, la acepta.
 * Idempotente. `200 { status: "PENDING" | "FRIENDS", isFriend }`; `400` si es
 * uno mismo, `404` si la persona no existe.
 */
export async function PUT(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await consumeFriendRequestRateLimit(user.id);
    return NextResponse.json(await FriendshipService.request(user.id, id));
  } catch (error) {
    return toHttpResponse(error);
  }
}

/**
 * DELETE /api/users/:id/friendship — quita a la persona de amigos en ambos
 * sentidos o cancela la solicitud que le enviamos (TKT-079). Idempotente.
 * `200 { status: "NONE", isFriend: false }`; mismos errores que `PUT`.
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
