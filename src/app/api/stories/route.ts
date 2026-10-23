import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";
import { StoryService } from "@/server/services/story-service";

/**
 * GET /api/stories — historias de amigos del usuario de la sesión (TKT-056):
 * amigos con temas creados en las últimas 24 h que aún no ha abierto.
 */
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await StoryService.listForUser(user.id));
  } catch (error) {
    return toHttpResponse(error);
  }
}
