import { NextResponse } from "next/server";
import { FriendshipService } from "@/server/services/friendship-service";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/me/friend-requests/:id/accept — acepta la solicitud recibida de
 * la persona `:id` y crea la amistad en ambos sentidos (TKT-079). `404` si no
 * existe esa solicitud dirigida al usuario de la sesión.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json(await FriendshipService.accept(user.id, id));
  } catch (error) {
    return toHttpResponse(error);
  }
}
