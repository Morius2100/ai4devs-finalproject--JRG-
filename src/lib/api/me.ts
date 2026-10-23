import { parseJson } from "@/lib/api/http";
import { apiFetch } from "@/lib/platform/api-fetch";
import type { OwnProfile, PeoplePage } from "@/server/services/user-service";

export { ApiError } from "@/lib/api/http";

/** Cliente de `GET /api/me` para Mi perfil (TKT-062). */
export async function fetchMe(): Promise<OwnProfile> {
  const response = await apiFetch("/api/me");
  return parseJson<OwnProfile>(response);
}

/** Cliente de `GET /api/me/friends` para mi lista de amigos (TKT-063). */
export async function fetchMyFriends({ cursor }: { cursor?: string }): Promise<PeoplePage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();

  const response = await apiFetch(`/api/me/friends${qs ? `?${qs}` : ""}`);
  return parseJson<PeoplePage>(response);
}

/** Cliente de `PATCH /api/me` (TKT-064): `multipart/form-data` con `bio`, `avatar` y `removeAvatar`. */
export async function updateMe(formData: FormData): Promise<OwnProfile> {
  const response = await apiFetch("/api/me", { method: "PATCH", body: formData });
  return parseJson<OwnProfile>(response);
}
