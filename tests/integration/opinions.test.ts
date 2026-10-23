import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { VoteService } from "@/server/services/vote-service";
import { ForbiddenError, NotFoundError } from "@/server/errors";

const RUN_ID = Date.now().toString(36);
const OPINION_COUNT = 30;

let author: { id: string };
let viewer: { id: string };
let silentVoter: { id: string };
let outsider: { id: string };
let opinionAuthors: { id: string }[];
const extraUserIds: string[] = [];

beforeAll(async () => {
  author = await prisma.user.create({
    data: {
      username: `opauthor${RUN_ID}`,
      email: `opauthor+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  viewer = await prisma.user.create({
    data: {
      username: `opviewer${RUN_ID}`,
      email: `opviewer+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  silentVoter = await prisma.user.create({
    data: {
      username: `opsilent${RUN_ID}`,
      email: `opsilent+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  outsider = await prisma.user.create({
    data: {
      username: `opoutsider${RUN_ID}`,
      email: `opoutsider+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  opinionAuthors = await prisma.user.createManyAndReturn({
    data: Array.from({ length: OPINION_COUNT }, (_, i) => ({
      username: `opinion${i}${RUN_ID}`,
      email: `opinion${i}+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    })),
    select: { id: true },
  });
});

afterAll(async () => {
  const userIds = [
    author.id,
    viewer.id,
    silentVoter.id,
    outsider.id,
    ...opinionAuthors.map((u) => u.id),
    ...extraUserIds,
  ];
  await prisma.vote.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("VoteService.listOpinions", () => {
  it("Orden: opiniones de más reciente a más antigua", async () => {
    const topic = await prisma.topic.create({
      data: { title: `Tema orden opiniones ${RUN_ID}`, visibility: "PUBLIC", authorId: author.id },
    });
    const [uA, uB, uC] = await prisma.user.createManyAndReturn({
      data: [
        { username: `orderA${RUN_ID}`, email: `orderA+${RUN_ID}@example.com`, passwordHash: "x" },
        { username: `orderB${RUN_ID}`, email: `orderB+${RUN_ID}@example.com`, passwordHash: "x" },
        { username: `orderC${RUN_ID}`, email: `orderC+${RUN_ID}@example.com`, passwordHash: "x" },
      ],
      select: { id: true },
    });
    extraUserIds.push(uA.id, uB.id, uC.id);

    const now = Date.now();
    await prisma.vote.create({
      data: {
        topicId: topic.id,
        userId: uA.id,
        value: "UP",
        justification: "A",
        createdAt: new Date(now - 2000),
      },
    });
    await prisma.vote.create({
      data: {
        topicId: topic.id,
        userId: uB.id,
        value: "UP",
        justification: "B",
        createdAt: new Date(now),
      },
    });
    await prisma.vote.create({
      data: {
        topicId: topic.id,
        userId: uC.id,
        value: "UP",
        justification: "C",
        createdAt: new Date(now - 1000),
      },
    });
    // El propio `viewer` necesita haber votado para poder listar opiniones.
    await prisma.vote.create({
      data: { topicId: topic.id, userId: viewer.id, value: "UP", justification: null },
    });

    const page = await VoteService.listOpinions(topic.id, viewer.id);
    expect(page.items.map((item) => item.justification)).toEqual(["B", "C", "A"]);
  });

  it("Sin haber votado: ForbiddenError (403)", async () => {
    const topic = await prisma.topic.create({
      data: { title: `Tema sin voto ${RUN_ID}`, visibility: "PUBLIC", authorId: author.id },
    });
    await expect(VoteService.listOpinions(topic.id, outsider.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("Tema inexistente: NotFoundError (404)", async () => {
    await expect(
      VoteService.listOpinions("00000000-0000-0000-0000-000000000000", viewer.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  describe("con 30 opiniones y 2 votos sin justificación", () => {
    let topicId: string;

    beforeAll(async () => {
      const topic = await prisma.topic.create({
        data: { title: `Tema 30 opiniones ${RUN_ID}`, visibility: "PUBLIC", authorId: author.id },
      });
      topicId = topic.id;

      // Vota sin justificación: da acceso pero no es una opinión.
      await prisma.vote.create({
        data: { topicId, userId: viewer.id, value: "UP", justification: null },
      });
      // Otro voto sin justificación: cuenta en los totales, no en las opiniones.
      await prisma.vote.create({
        data: { topicId, userId: silentVoter.id, value: "DOWN", justification: null },
      });

      await prisma.vote.createManyAndReturn({
        data: opinionAuthors.map((u, i) => ({
          topicId,
          userId: u.id,
          value: i % 2 === 0 ? ("UP" as const) : ("DOWN" as const),
          justification: `Opinión número ${i}`,
        })),
      });
    });

    it("Paginación: 20 + 10 sin repetir ninguna (solo las que tienen justificación)", async () => {
      const page1 = await VoteService.listOpinions(topicId, viewer.id);
      expect(page1.items).toHaveLength(20);
      expect(page1.nextCursor).not.toBeNull();

      const page2 = await VoteService.listOpinions(topicId, viewer.id, page1.nextCursor!);
      expect(page2.items).toHaveLength(10);
      expect(page2.nextCursor).toBeNull();

      const allIds = [...page1.items, ...page2.items].map((item) => item.id);
      expect(new Set(allIds).size).toBe(OPINION_COUNT);
      expect(page1.items.every((item) => item.justification.length > 0)).toBe(true);
      expect(page2.items.every((item) => item.justification.length > 0)).toBe(true);
    });
  });
});
