import { NextResponse } from "next/server";
import { TopicService } from "@/server/services/topic-service";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";

/**
 * GET /api/topics/:id — detalle de un tema (TKT-016).
 * `404` si no existe o el visitante no tiene acceso (VisibilityPolicy).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const detail = await TopicService.getById(id, user.id);
    return NextResponse.json(detail);
  } catch (error) {
    return toHttpResponse(error);
  }
}
