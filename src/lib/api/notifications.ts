import { parseJson } from "@/lib/api/http";
import { apiFetch } from "@/lib/platform/api-fetch";
import type { NotificationPage } from "@/server/services/notification-service";

/** Cliente de `GET /api/notifications` para `NotificationList` (TKT-031). */
export async function fetchNotificationsPage({
  cursor,
}: {
  cursor?: string;
}): Promise<NotificationPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();

  const response = await apiFetch(`/api/notifications${qs ? `?${qs}` : ""}`);
  return parseJson<NotificationPage>(response);
}
