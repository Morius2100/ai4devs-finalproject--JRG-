import { Prisma, type VoteValue } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { decodeCursor, encodeCursor } from "@/server/cursor";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/errors";
import { VisibilityPolicy } from "@/server/services/visibility-policy";

const OPINIONS_PAGE_SIZE = 20;

export type CastVoteResult = {
  positiveVotes: number;
  negativeVotes: number;
  myVote: VoteValue;
};

export type Opinion = {
  id: string;
  username: string;
  value: VoteValue;
  justification: string;
  createdAt: string;
};

export type OpinionPage = {
  items: Opinion[];
  nextCursor: string | null;
};

const topicIdSchema = z.string().uuid();
// Claves de orden del cursor de opiniones: [createdAt, id] (design.md:
// "orden createdAt DESC, id DESC").
const opinionCursorSchema = z.tuple([z.string().datetime(), z.string().uuid()]);

type OpinionRow = {
  id: string;
  value: VoteValue;
  justification: string;
  created_at: Date;
  username: string;
};

function toOpinion(row: OpinionRow): Opinion {
  return {
    id: row.id,
    username: row.username,
    value: row.value,
    justification: row.justification,
    createdAt: row.created_at.toISOString(),
  };
}

async function assertAccessibleTopic(topicId: string, viewerId: string) {
  if (!topicIdSchema.safeParse(topicId).success) {
    throw new NotFoundError("Tema no encontrado");
  }
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) {
    throw new NotFoundError("Tema no encontrado");
  }
  if (!(await VisibilityPolicy.canAccessAsync(topic, viewerId))) {
    throw new NotFoundError("Tema no encontrado");
  }
  return topic;
}

/**
 * Voto y opiniones de un tema (TKT-019, TKT-020).
 */
export const VoteService = {
  /**
   * Emite un voto en una única transacción: comprueba acceso, inserta el
   * voto (el `UNIQUE (topic_id, user_id)` de la BD hace fallar un segundo
   * voto, incluso concurrente, con `P2002` → `ConflictError`) y actualiza
   * los contadores desnormalizados del tema.
   */
  async castVote(
    topicId: string,
    userId: string,
    value: VoteValue,
    justification: string | null,
  ): Promise<CastVoteResult> {
    // Comprobación de acceso antes de la transacción: la visibilidad de un
    // tema no cambia (no hay edición de temas), así que no hace falta
    // repetirla dentro de la transacción ni mezclar `tx`/`prisma`.
    await assertAccessibleTopic(topicId, userId);

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.vote.create({ data: { topicId, userId, value, justification } });

        const updated = await tx.topic.update({
          where: { id: topicId },
          data: {
            positiveVotes: { increment: value === "UP" ? 1 : 0 },
            negativeVotes: { increment: value === "DOWN" ? 1 : 0 },
            totalVotes: { increment: 1 },
          },
          select: { positiveVotes: true, negativeVotes: true },
        });

        return {
          positiveVotes: updated.positiveVotes,
          negativeVotes: updated.negativeVotes,
          myVote: value,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Ya has votado este tema");
      }
      throw error;
    }
  },

  /**
   * Opiniones (votos con justificación) de un tema, de más reciente a más
   * antigua. Solo accesible para quien ya ha votado (`ForbiddenError`).
   */
  async listOpinions(topicId: string, viewerId: string, cursor?: string): Promise<OpinionPage> {
    await assertAccessibleTopic(topicId, viewerId);

    const myVote = await prisma.vote.findUnique({
      where: { topicId_userId: { topicId, userId: viewerId } },
      select: { id: true },
    });
    if (!myVote) {
      throw new ForbiddenError("Debes votar este tema para ver sus opiniones");
    }

    const seek = cursor
      ? (() => {
          const [createdAtIso, id] = decodeCursor(cursor, opinionCursorSchema);
          return Prisma.sql`AND (v.created_at, v.id) < (${new Date(createdAtIso)}, ${id}::uuid)`;
        })()
      : Prisma.empty;

    const rows = await prisma.$queryRaw<OpinionRow[]>`
      SELECT v.id, v.value, v.justification, v.created_at, u.username
      FROM votes v
      JOIN users u ON u.id = v.user_id
      WHERE v.topic_id = ${topicId}::uuid
        AND v.justification IS NOT NULL
        ${seek}
      ORDER BY v.created_at DESC, v.id DESC
      LIMIT ${OPINIONS_PAGE_SIZE + 1}
    `;

    const hasMore = rows.length > OPINIONS_PAGE_SIZE;
    const items = rows.slice(0, OPINIONS_PAGE_SIZE);
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor([last.created_at.toISOString(), last.id]) : null;

    return { items: items.map(toOpinion), nextCursor };
  },
};
