import { parseJson } from "@/lib/api/http";
import { apiFetch } from "@/lib/platform/api-fetch";
import type { StoryPage } from "@/server/services/story-service";

/** Cliente de `GET /api/stories` para `StoriesBar` (TKT-057). */
export async function fetchStories(): Promise<StoryPage> {
  const response = await apiFetch("/api/stories");
  return parseJson<StoryPage>(response);
}
