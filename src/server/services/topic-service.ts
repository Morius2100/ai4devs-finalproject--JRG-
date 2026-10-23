import { Prisma, type Visibility, type VoteValue } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { decodeCursor, encodeCursor } from "@/server/cursor";
import { NotFoundError } from "@/server/errors";
import { escapeLikePattern } from "@/server/sql";
import type { CreateTopicInput } from "@/lib/validation/topic";
import { toMediaUrl } from "@/server/media";
import { imageStorage } from "@/server/storage";
import { NotificationService } from "@/server/services/notification-service";
import { VisibilityPolicy } from "@/server/services/visibility-policy";

const PAGE_SIZE = 20;

export type TopicSummary = {
  id: string;
  title: string;
  imageUrl: string | null;
  // Siempre `PUBLIC` en tendencias y búsqueda; en el perfil de una persona
  // puede ser `PRIVATE` para sus amigos (TKT-035).
  visibility: Visibility;
  totalVotes: number;
  createdAt: string;
  // Voto de quien mira. `results` solo si ha votado: no se filtran los
  // totales a favor y en contra a quien no ha votado (supuesto S-03).
  myVote: VoteValue | null;
  results?: { positiveVotes: number; negativeVotes: number };
};

export type TopicPage = {
  items: TopicSummary[];
  nextCursor: string | null;
};

export type TopicDetail = {
  id: string;
  title: string;
  imageUrl: string | null;
  visibility: Visibility;
  myVote: VoteValue | null;
  // Solo presentes si `myVote` no es nulo (docs/02-arquitectura.md §2.5,
  // supuesto S-03: no se filtran totales a quien no ha votado).
  results?: { positiveVotes: number; negativeVotes: number };
};

const topicIdSchema = z.string().uuid();

// Claves de orden del cursor, en el mismo orden que el ORDER BY
// (docs/03-modelo-datos.md §3.5, design.md de fase-2): [totalVotes, createdAt, id].
const topicCursorSchema = z.tuple([z.number().int(), z.string().datetime(), z.string().uuid()]);

// Orden «más recientes» (TKT-035): [createdAt, id].
const recentCursorSchema = z.tuple([z.string().datetime(), z.string().uuid()]);

// `top` = tendencia (votos totales desc, luego fecha); `recent` = fecha desc.
type PageOrder = "top" | "recent";

type TopicRow = {
  id: string;
  title: string;
  image_url: string | null;
  visibility: Visibility;
  total_votes: number;
  created_at: Date;
  positive_votes: number;
  negative_votes: number;
  my_vote: VoteValue | null;
};

function toSummary(row: TopicRow): TopicSummary {
  return {
    id: row.id,
    title: row.title,
    imageUrl: toMediaUrl(row.image_url),
    visibility: row.visibility,
    totalVotes: row.total_votes,
    createdAt: row.created_at.toISOString(),
    myVote: row.my_vote,
    ...(row.my_vote
      ? { results: { positiveVotes: row.positive_votes, negativeVotes: row.negative_votes } }
      : {}),
  };
}

function encodeTopicCursor(row: TopicRow, order: PageOrder): string {
  return order === "top"
    ? encodeCursor([row.total_votes, row.created_at.toISOString(), row.id])
    : encodeCursor([row.created_at.toISOString(), row.id]);
}

function buildSeek(order: PageOrder, cursor?: string): Prisma.Sql {
  if (!cursor) return Prisma.empty;

  if (order === "top") {
    const [totalVotes, createdAtIso, id] = decodeCursor(cursor, topicCursorSchema);
    return Prisma.sql`AND (t.total_votes, t.created_at, t.id) < (${totalVotes}, ${new Date(createdAtIso)}, ${id}::uuid)`;
  }

  const [createdAtIso, id] = decodeCursor(cursor, recentCursorSchema);
  return Prisma.sql`AND (t.created_at, t.id) < (${new Date(createdAtIso)}, ${id}::uuid)`;
}

async function queryPage(
  filter: Prisma.Sql,
  order: PageOrder,
  viewerId: string,
  cursor?: string,
): Promise<TopicPage> {
  const seek = buildSeek(order, cursor);
  const orderBy =
    order === "top"
      ? Prisma.sql`t.total_votes DESC, t.created_at DESC, t.id DESC`
      : Prisma.sql`t.created_at DESC, t.id DESC`;

  // LEFT JOIN por (topic_id, user_id): usa el índice único y trae el voto de
  // quien mira en la misma consulta, sin N+1 (design.md D1).
  const rows = await prisma.$queryRaw<TopicRow[]>`
    SELECT t.id, t.title, t.image_url, t.visibility, t.total_votes, t.created_at,
           t.positive_votes, t.negative_votes, v.value AS my_vote
    FROM topics t
    LEFT JOIN votes v ON v.topic_id = t.id AND v.user_id = ${viewerId}::uuid
    WHERE ${filter}
      ${seek}
    ORDER BY ${orderBy}
    LIMIT ${PAGE_SIZE + 1}
  `;

  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE);
  const nextCursor = hasMore ? encodeTopicCursor(items[items.length - 1], order) : null;

  return { items: items.map(toSummary), nextCursor };
}

const PUBLIC_ONLY = Prisma.sql`t.visibility = 'PUBLIC'`;

/**
 * Tendencias y búsqueda de temas públicos (TKT-011).
 * Orden: `totalVotes DESC, createdAt DESC, id DESC` (supuesto S-04),
 * paginación keyset de 20. Los temas privados nunca se listan (S-06).
 */
export const TopicService = {
  async listTrending({
    viewerId,
    cursor,
  }: {
    viewerId: string;
    cursor?: string;
  }): Promise<TopicPage> {
    return queryPage(PUBLIC_ONLY, "top", viewerId, cursor);
  },

  async search({
    viewerId,
    q,
    cursor,
  }: {
    viewerId: string;
    q: string;
    cursor?: string;
  }): Promise<TopicPage> {
    const pattern = `%${escapeLikePattern(q)}%`;
    // `lower(title) LIKE lower(...)` usa el índice trigram sobre lower(title)
    // (prisma/migrations/…/migration.sql); ILIKE sobre `title` no lo usaría.
    const filter = Prisma.sql`${PUBLIC_ONLY} AND lower(t.title) LIKE lower(${pattern}) ESCAPE '\\'`;
    return queryPage(filter, "top", viewerId, cursor);
  },

  /**
   * Temas creados por una persona (TKT-035), con orden `recent` (fecha desc)
   * o `top` (votos totales desc). Los públicos siempre; los privados solo si
   * `viewerId` es el propio autor o su amigo (`VisibilityPolicy`).
   */
  async listByAuthor({
    authorId,
    viewerId,
    sort,
    cursor,
  }: {
    authorId: string;
    viewerId: string;
    sort: PageOrder;
    cursor?: string;
  }): Promise<TopicPage> {
    const canSeePrivate = await VisibilityPolicy.canSeePrivateTopicsOf(authorId, viewerId);
    const byAuthor = Prisma.sql`t.author_id = ${authorId}::uuid`;
    const filter = canSeePrivate ? byAuthor : Prisma.sql`${byAuthor} AND ${PUBLIC_ONLY}`;
    return queryPage(filter, sort, viewerId, cursor);
  },

  /**
   * Detalle de un tema (TKT-016): `NotFoundError` si no existe o el
   * visitante no tiene acceso según `VisibilityPolicy` (mismo error en
   * ambos casos, para no revelar la existencia de un tema privado ajeno).
   */
  async getById(id: string, viewerId: string): Promise<TopicDetail> {
    if (!topicIdSchema.safeParse(id).success) {
      throw new NotFoundError("Tema no encontrado");
    }

    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new NotFoundError("Tema no encontrado");
    }

    if (!(await VisibilityPolicy.canAccessAsync(topic, viewerId))) {
      throw new NotFoundError("Tema no encontrado");
    }

    // Abrir un tema ajeno lo marca como visto (historias de amigos, HU-19).
    // `skipDuplicates` = ON CONFLICT DO NOTHING: una sola fila por usuario y tema.
    if (topic.authorId !== viewerId) {
      await prisma.topicView.createMany({
        data: [{ userId: viewerId, topicId: id }],
        skipDuplicates: true,
      });
    }

    const vote = await prisma.vote.findUnique({
      where: { topicId_userId: { topicId: id, userId: viewerId } },
      select: { value: true },
    });

    return {
      id: topic.id,
      title: topic.title,
      imageUrl: toMediaUrl(topic.imageUrl),
      visibility: topic.visibility,
      myVote: vote?.value ?? null,
      ...(vote
        ? { results: { positiveVotes: topic.positiveVotes, negativeVotes: topic.negativeVotes } }
        : {}),
    };
  },

  /**
   * Crea un tema (TKT-025, TKT-029). Orden: subir la imagen (si existe) →
   * insertar el tema y, si es privado, notificar a cada amigo del creador
   * en la misma transacción (todo o nada); si algo falla tras subir la
   * imagen, se borra (mejor esfuerzo, no oculta el error original).
   */
  async create(
    input: CreateTopicInput,
    authorId: string,
    imageFile: File | null,
  ): Promise<{ id: string }> {
    const uploaded = imageFile ? await imageStorage.upload(imageFile) : null;

    try {
      return await prisma.$transaction(async (tx) => {
        const topic = await tx.topic.create({
          data: {
            title: input.title,
            visibility: input.visibility,
            authorId,
            imageUrl: uploaded?.key ?? null,
          },
          select: { id: true, authorId: true },
        });

        if (input.visibility === "PRIVATE") {
          await NotificationService.notifyFriendsOfPrivateTopic(tx, topic);
        }

        return { id: topic.id };
      });
    } catch (error) {
      if (uploaded) {
        await imageStorage.remove(uploaded.key).catch((removeError: unknown) => {
          console.error("No se pudo borrar la imagen huérfana", removeError);
        });
      }
      throw error;
    }
  },
};
