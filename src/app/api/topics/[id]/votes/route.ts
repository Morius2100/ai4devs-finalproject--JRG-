import { NextResponse } from "next/server";
import { castVoteSchema } from "@/lib/validation/vote";
import { requireUser } from "@/server/auth/require-user";
import { ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";
import { VoteService } from "@/server/services/vote-service";

/**
 * POST /api/topics/:id/votes — emite un voto (TKT-019).
 * `201` con los totales actualizados; `409` si el usuario ya había votado.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = castVoteSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new ValidationError(
        "Datos de voto inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const result = await VoteService.castVote(
      id,
      user.id,
      parsed.data.value,
      parsed.data.justification,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toHttpResponse(error);
  }
}
