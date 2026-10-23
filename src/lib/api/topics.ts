import { parseJson } from "@/lib/api/http";
import { apiFetch } from "@/lib/platform/api-fetch";
import type { CastVoteResult, Opinion, OpinionPage } from "@/server/services/vote-service";
import type { TopicDetail, TopicPage } from "@/server/services/topic-service";

export { ApiError } from "@/lib/api/http";

/**
 * Cliente de `GET /api/topics` para `TopicList` (TKT-013/TKT-014).
 */
export async function fetchTopicsPage({
  q,
  cursor,
}: {
  q?: string;
  cursor?: string;
}): Promise<TopicPage> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();

  const response = await apiFetch(`/api/topics${qs ? `?${qs}` : ""}`);
  return parseJson<TopicPage>(response);
}

/** Cliente de `GET /api/topics/:id` (TKT-021: recarga tras un `409`). */
export async function fetchTopicDetail(topicId: string): Promise<TopicDetail> {
  const response = await apiFetch(`/api/topics/${encodeURIComponent(topicId)}`);
  return parseJson<TopicDetail>(response);
}

/** Cliente de `POST /api/topics/:id/votes` (TKT-021). */
export async function castVote({
  topicId,
  value,
  justification,
}: {
  topicId: string;
  value: "UP" | "DOWN";
  justification: string;
}): Promise<CastVoteResult> {
  const response = await apiFetch(`/api/topics/${topicId}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value, justification }),
  });
  return parseJson<CastVoteResult>(response);
}

/** Cliente de `GET /api/topics/:id/opinions` para `OpinionList` (TKT-022). */
export async function fetchOpinionsPage({
  topicId,
  cursor,
}: {
  topicId: string;
  cursor?: string;
}): Promise<OpinionPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();

  const response = await apiFetch(`/api/topics/${topicId}/opinions${qs ? `?${qs}` : ""}`);
  return parseJson<OpinionPage>(response);
}

/** Cliente de `POST /api/topics` (TKT-026): `multipart/form-data`. */
export async function createTopic(formData: FormData): Promise<{ id: string }> {
  const response = await apiFetch("/api/topics", { method: "POST", body: formData });
  return parseJson<{ id: string }>(response);
}

export type { Opinion };
