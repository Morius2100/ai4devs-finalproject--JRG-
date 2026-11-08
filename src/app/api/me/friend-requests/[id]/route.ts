import { NextResponse } from "next/server";
import { FriendshipService } from "@/server/services/friendship-service";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/me/friend-requests/:id — rechaza la solicitud recibida de la
 * persona `:id` (TKT-079). No avisa a quien la envió. `404` si no existe esa
 * solicitud dirigida al usuario de la sesión.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json(await FriendshipService.reject(user.id, id));
  } catch (error) {
    return toHttpResponse(error);
  }
}
