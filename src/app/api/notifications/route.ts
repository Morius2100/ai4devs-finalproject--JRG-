import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/require-user";
import { toHttpResponse } from "@/server/http";
import { NotificationService } from "@/server/services/notification-service";

/**
 * GET /api/notifications — notificaciones del usuario, de más reciente a
 * más antigua (TKT-030).
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const page = await NotificationService.listForUser(user.id, cursor);
    return NextResponse.json(page);
  } catch (error) {
    return toHttpResponse(error);
  }
}
