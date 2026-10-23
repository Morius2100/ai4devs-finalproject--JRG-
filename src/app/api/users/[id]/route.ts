import { NextResponse } from "next/server";
import { UserService } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";

/**
 * GET /api/users/:id — perfil de una persona para la pantalla de perfil de
 * cliente (TKT-043). `404` si el id no es un UUID o la persona no existe.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireUser();
    const { id } = await params;
    return NextResponse.json(await UserService.getProfile(id, viewer.id));
  } catch (error) {
    return toHttpResponse(error);
  }
}
