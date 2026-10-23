import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { decodeCursor, encodeCursor } from "@/server/cursor";

const PAGE_SIZE = 20;
const notificationCursorSchema = z.tuple([z.string().datetime(), z.string().uuid()]);

export type NotificationItem = {
  id: string;
  type: "PRIVATE_TOPIC_CREATED";
  actor: { username: string };
  topic: { id: string; title: string };
  createdAt: string;
};

export type NotificationPage = {
  items: NotificationItem[];
  nextCursor: string | null;
};

type NotificationRow = {
  id: string;
  type: string;
  created_at: Date;
  actor_username: string;
  topic_id: string;
  topic_title: string;
};

function toNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type as "PRIVATE_TOPIC_CREATED",
    actor: { username: row.actor_username },
    topic: { id: row.topic_id, title: row.topic_title },
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Notificaciones a los amigos del creador de un tema privado (TKT-029,
 * TKT-030). No se guarda texto: se compone al leer a partir de
 * `actor.username` y `topic.title` (design.md de fase-6).
 */
export const NotificationService = {
  /**
   * Notifica a cada amigo del creador, dentro de la misma transacción que
   * la creación del tema (`tx`): un único `INSERT … SELECT` desde
   * `friendships`, para que sea atómico y eficiente con muchos amigos.
   */
  async notifyFriendsOfPrivateTopic(
    tx: Prisma.TransactionClient,
    topic: { id: string; authorId: string },
  ): Promise<void> {
    await tx.$executeRaw`
      INSERT INTO notifications (id, recipient_id, actor_id, topic_id, type, created_at)
      SELECT gen_random_uuid(), f.friend_id, ${topic.authorId}::uuid, ${topic.id}::uuid,
             'PRIVATE_TOPIC_CREATED'::"NotificationType", now()
      FROM friendships f
      WHERE f.user_id = ${topic.authorId}::uuid
    `;
  },

  /**
   * Notificaciones del usuario, de más reciente a más antigua, paginadas
   * por cursor (20 por página).
   */
  async listForUser(userId: string, cursor?: string): Promise<NotificationPage> {
    const seek = cursor
      ? (() => {
          const [createdAtIso, id] = decodeCursor(cursor, notificationCursorSchema);
          return Prisma.sql`AND (n.created_at, n.id) < (${new Date(createdAtIso)}, ${id}::uuid)`;
        })()
      : Prisma.empty;

    const rows = await prisma.$queryRaw<NotificationRow[]>`
      SELECT n.id, n.type, n.created_at, u.username AS actor_username, t.id AS topic_id, t.title AS topic_title
      FROM notifications n
      JOIN users u ON u.id = n.actor_id
      JOIN topics t ON t.id = n.topic_id
      WHERE n.recipient_id = ${userId}::uuid
        ${seek}
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT ${PAGE_SIZE + 1}
    `;

    const hasMore = rows.length > PAGE_SIZE;
    const items = rows.slice(0, PAGE_SIZE);
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor([last.created_at.toISOString(), last.id]) : null;

    return { items: items.map(toNotification), nextCursor };
  },
};
