import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { VoteService } from "@/server/services/vote-service";
import { NotFoundError } from "@/server/errors";

const RUN_ID = Date.now().toString(36);

let author: { id: string };
let friend: { id: string };
let stranger: { id: string };

beforeAll(async () => {
  author = await prisma.user.create({
    data: {
      username: `vfauthor${RUN_ID}`,
      email: `vfauthor+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  friend = await prisma.user.create({
    data: {
      username: `vffriend${RUN_ID}`,
      email: `vffriend+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  stranger = await prisma.user.create({
    data: {
      username: `vfstranger${RUN_ID}`,
      email: `vfstranger+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });

  // Amistad simétrica (docs/03-modelo-datos.md §3.3): dos filas.
  await prisma.friendship.create({ data: { userId: author.id, friendId: friend.id } });
  await prisma.friendship.create({ data: { userId: friend.id, friendId: author.id } });
});

afterAll(async () => {
  const userIds = [author.id, friend.id, stranger.id];
  await prisma.vote.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.friendship.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

async function createPrivateTopic(title: string) {
  return prisma.topic.create({
    data: { title, visibility: "PRIVATE", authorId: author.id },
  });
}

describe("VisibilityPolicy ampliada: detalle de un tema privado", () => {
  it("Creador: accede a su propio tema", async () => {
    const topic = await createPrivateTopic(`Privado detalle creador ${RUN_ID}`);
    const detail = await TopicService.getById(topic.id, author.id);
    expect(detail.id).toBe(topic.id);
  });

  it("Amigo del creador: accede al tema", async () => {
    const topic = await createPrivateTopic(`Privado detalle amigo ${RUN_ID}`);
    const detail = await TopicService.getById(topic.id, friend.id);
    expect(detail.id).toBe(topic.id);
  });

  it("No amigo: NotFoundError (404), aunque conozca el identificador", async () => {
    const topic = await createPrivateTopic(`Privado detalle extraño ${RUN_ID}`);
    await expect(TopicService.getById(topic.id, stranger.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("VisibilityPolicy ampliada: voto en un tema privado", () => {
  it("Creador: puede votar", async () => {
    const topic = await createPrivateTopic(`Privado voto creador ${RUN_ID}`);
    const result = await VoteService.castVote(topic.id, author.id, "UP", null);
    expect(result.myVote).toBe("UP");
  });

  it("Amigo del creador: puede votar", async () => {
    const topic = await createPrivateTopic(`Privado voto amigo ${RUN_ID}`);
    const result = await VoteService.castVote(topic.id, friend.id, "DOWN", null);
    expect(result.myVote).toBe("DOWN");
  });

  it("No amigo: NotFoundError (404) y no registra el voto", async () => {
    const topic = await createPrivateTopic(`Privado voto extraño ${RUN_ID}`);
    await expect(VoteService.castVote(topic.id, stranger.id, "UP", null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const updated = await prisma.topic.findUniqueOrThrow({ where: { id: topic.id } });
    expect(updated.totalVotes).toBe(0);
  });
});

describe("VisibilityPolicy ampliada: opiniones de un tema privado", () => {
  it("Amigo que ha votado: obtiene las opiniones", async () => {
    const topic = await createPrivateTopic(`Privado opiniones amigo ${RUN_ID}`);
    await VoteService.castVote(topic.id, friend.id, "UP", "Me apunto");

    const page = await VoteService.listOpinions(topic.id, friend.id);
    expect(page.items.some((item) => item.justification === "Me apunto")).toBe(true);
  });

  it("No amigo: NotFoundError (404), no ForbiddenError", async () => {
    const topic = await createPrivateTopic(`Privado opiniones extraño ${RUN_ID}`);
    await expect(VoteService.listOpinions(topic.id, stranger.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
