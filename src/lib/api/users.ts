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

export type FriendshipResult = { status: "NONE" | "PENDING" | "FRIENDS"; isFriend: boolean };

/**
 * Cliente de `PUT` / `DELETE /api/users/:id/friendship` (TKT-080): solicita
 * la amistad (`friend = true`; si la otra persona ya la había solicitado, la
 * acepta) o quita la amistad / cancela la solicitud (`false`).
 */
export async function setFriendship({
  userId,
  friend,
}: {
  userId: string;
  friend: boolean;
}): Promise<FriendshipResult> {
  const response = await apiFetch(`/api/users/${userId}/friendship`, {
    method: friend ? "PUT" : "DELETE",
  });
  return parseJson<FriendshipResult>(response);
}

/** Cliente de `GET /api/me/friend-requests`: solicitudes de amistad recibidas (TKT-080). */
export async function fetchFriendRequests({ cursor }: { cursor?: string }): Promise<PeoplePage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();

  const response = await apiFetch(`/api/me/friend-requests${qs ? `?${qs}` : ""}`);
  return parseJson<PeoplePage>(response);
}

/** Cliente de `POST /api/me/friend-requests/:id/accept` (TKT-080). */
export async function acceptFriendRequest(requesterId: string): Promise<FriendshipResult> {
  const response = await apiFetch(`/api/me/friend-requests/${requesterId}/accept`, {
    method: "POST",
  });
  return parseJson<FriendshipResult>(response);
}

/** Cliente de `DELETE /api/me/friend-requests/:id` (TKT-080): rechaza la solicitud. */
export async function rejectFriendRequest(requesterId: string): Promise<FriendshipResult> {
  const response = await apiFetch(`/api/me/friend-requests/${requesterId}`, {
    method: "DELETE",
  });
  return parseJson<FriendshipResult>(response);
}
