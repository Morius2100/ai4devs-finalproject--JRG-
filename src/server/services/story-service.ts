import type { Visibility } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { toMediaUrl } from "@/server/media";
import { VisibilityPolicy } from "@/server/services/visibility-policy";

const MAX_STORIES = 50;
const MAX_TOPICS = 500;

export type Story = {
  author: { id: string; username: string; avatarUrl: string | null };
  // Temas pendientes de ver, del más antiguo al más nuevo.
  topicIds: string[];
  latestCreatedAt: string;
};

export type StoryPage = { items: Story[] };

type StoryRow = {
  id: string;
  visibility: Visibility;
  author_id: string;
  created_at: Date;
  username: string;
  avatar_url: string | null;
};

/**
 * Historias de amigos (TKT-056, HU-19): una por amigo con temas creados en
 * las últimas 24 horas que `viewerId` aún no ha abierto. La ventana la decide
 * la base de datos (`now()`); la amistad la garantiza el `JOIN` con
 * `friendships`, que nunca incluye al propio usuario (CHECK `user_id <> friend_id`).
 */
export const StoryService = {
  async listForUser(viewerId: string): Promise<StoryPage> {
    const rows = await prisma.$queryRaw<StoryRow[]>`
      SELECT t.id, t.visibility, t.author_id, t.created_at, u.username, u.avatar_url
      FROM friendships f
      JOIN topics t ON t.author_id = f.friend_id
                   AND t.created_at > now() - interval '24 hours'
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ${viewerId}::uuid
        AND NOT EXISTS (
          SELECT 1 FROM topic_views tv
          WHERE tv.user_id = ${viewerId}::uuid AND tv.topic_id = t.id
        )
      ORDER BY t.created_at ASC, t.id ASC
      LIMIT ${MAX_TOPICS}
    `;

    const byAuthor = new Map<string, Story>();
    for (const row of rows) {
      // Ya son amigos (por el JOIN): la política decide con la amistad conocida.
      const canAccess = VisibilityPolicy.canAccess(
        { visibility: row.visibility, authorId: row.author_id },
        viewerId,
        { areFriends: true },
      );
      if (!canAccess) continue;

      const story = byAuthor.get(row.author_id) ?? {
        author: {
          id: row.author_id,
          username: row.username,
          avatarUrl: toMediaUrl(row.avatar_url),
        },
        topicIds: [],
        latestCreatedAt: row.created_at.toISOString(),
      };
      story.topicIds.push(row.id);
      story.latestCreatedAt = row.created_at.toISOString();
      byAuthor.set(row.author_id, story);
    }

    const items = [...byAuthor.values()]
      .sort(
        (a, b) =>
          b.latestCreatedAt.localeCompare(a.latestCreatedAt) ||
          a.author.id.localeCompare(b.author.id),
      )
      .slice(0, MAX_STORIES);

    return { items };
  },
};
