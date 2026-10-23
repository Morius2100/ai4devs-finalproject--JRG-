import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { NotFoundError } from "@/server/errors";

const RUN_ID = Date.now().toString(36);

let owner: { id: string };
let other: { id: string };

beforeAll(async () => {
  owner = await prisma.user.create({
    data: {
      username: `detailowner${RUN_ID}`,
      email: `detailowner+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  other = await prisma.user.create({
    data: {
      username: `detailother${RUN_ID}`,
      email: `detailother+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
});

afterAll(async () => {
  await prisma.vote.deleteMany({ where: { userId: { in: [owner.id, other.id] } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: [owner.id, other.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } });
  await prisma.$disconnect();
});

describe("TopicService.getById", () => {
  it("Tema público: devuelve el detalle sin voto ni resultados", async () => {
    const topic = await prisma.topic.create({
      data: { title: `Tema público ${RUN_ID}`, visibility: "PUBLIC", authorId: owner.id },
    });

    const detail = await TopicService.getById(topic.id, other.id);

    expect(detail.id).toBe(topic.id);
    expect(detail.title).toBe(topic.title);
    expect(detail.myVote).toBeNull();
    expect(detail.results).toBeUndefined();
  });

  it("Tema inexistente: NotFoundError", async () => {
    await expect(
      TopicService.getById("00000000-0000-0000-0000-000000000000", other.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("Identificador con formato inválido: NotFoundError (no 500)", async () => {
    await expect(TopicService.getById("no-es-un-uuid", other.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("Tema privado ajeno: NotFoundError (no revela su existencia)", async () => {
    const topic = await prisma.topic.create({
      data: { title: `Tema privado ${RUN_ID}`, visibility: "PRIVATE", authorId: owner.id },
    });

    await expect(TopicService.getById(topic.id, other.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("Tema privado propio: accesible para su creador", async () => {
    const topic = await prisma.topic.create({
      data: { title: `Tema privado propio ${RUN_ID}`, visibility: "PRIVATE", authorId: owner.id },
    });

    const detail = await TopicService.getById(topic.id, owner.id);
    expect(detail.id).toBe(topic.id);
  });

  it("Sin votar: myVote null y sin resultados", async () => {
    const topic = await prisma.topic.create({
      data: {
        title: `Sin votar ${RUN_ID}`,
        visibility: "PUBLIC",
        authorId: owner.id,
        positiveVotes: 3,
        negativeVotes: 1,
        totalVotes: 4,
      },
    });

    const detail = await TopicService.getById(topic.id, other.id);
    expect(detail.myVote).toBeNull();
    expect(detail.results).toBeUndefined();
  });

  it("Ya votado: myVote y resultados presentes", async () => {
    const topic = await prisma.topic.create({
      data: {
        title: `Ya votado ${RUN_ID}`,
        visibility: "PUBLIC",
        authorId: owner.id,
        positiveVotes: 5,
        negativeVotes: 2,
        totalVotes: 7,
      },
    });
    await prisma.vote.create({
      data: { topicId: topic.id, userId: other.id, value: "UP" },
    });

    const detail = await TopicService.getById(topic.id, other.id);
    expect(detail.myVote).toBe("UP");
    expect(detail.results).toEqual({ positiveVotes: 5, negativeVotes: 2 });
  });
});
