import { parseJson } from "@/lib/api/http";
import { apiFetch } from "@/lib/platform/api-fetch";
import type { TopicPage } from "@/server/services/topic-service";
import type { PeoplePage, UserProfile } from "@/server/services/user-service";
import type { TopicSort } from "@/lib/validation/users";

export { ApiError } from "@/lib/api/http";

/** Cliente de `GET /api/users/:id` para la pantalla de perfil (TKT-045). */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const response = await apiFetch(`/api/users/${encodeURIComponent(userId)}`);
  return parseJson<UserProfile>(response);
}

/** Cliente de `GET /api/users` para `PeopleList` (TKT-038). */
export async function fetchPeoplePage({
  q,
  cursor,
}: {
  q?: string;
  cursor?: string;
}): Promise<PeoplePage> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();

  const response = await apiFetch(`/api/users${qs ? `?${qs}` : ""}`);
  return parseJson<PeoplePage>(response);
}

/** Cliente de `GET /api/users/:id/topics` para el perfil (TKT-039). */
export async function fetchUserTopicsPage({
  userId,
  sort,
  cursor,
}: {
  userId: string;
  sort: TopicSort;
  cursor?: string;
}): Promise<TopicPage> {
  const params = new URLSearchParams({ sort });
  if (cursor) params.set("cursor", cursor);

  const response = await apiFetch(`/api/users/${userId}/topics?${params.toString()}`);
  return parseJson<TopicPage>(response);
}

/**
 * Cliente de `PUT` / `DELETE /api/users/:id/friendship` (TKT-039): añade
 * (`friend = true`) o quita (`false`) a la persona de amigos.
 */
export async function setFriendship({
  userId,
  friend,
}: {
  userId: string;
  friend: boolean;
}): Promise<{ isFriend: boolean }> {
  const response = await apiFetch(`/api/users/${userId}/friendship`, {
    method: friend ? "PUT" : "DELETE",
  });
  return parseJson<{ isFriend: boolean }>(response);
}
