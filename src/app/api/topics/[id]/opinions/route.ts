import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";
import { VoteService } from "@/server/services/vote-service";

/**
 * GET /api/topics/:id/opinions — opiniones (votos con justificación) de
 * un tema (TKT-020). `403` si el visitante no ha votado; `404` sin acceso.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const page = await VoteService.listOpinions(id, user.id, cursor);
    return NextResponse.json(page);
  } catch (error) {
    return toHttpResponse(error);
  }
}
