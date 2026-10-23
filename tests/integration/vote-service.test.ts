import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { VoteService } from "@/server/services/vote-service";
import { castVoteSchema } from "@/lib/validation/vote";
import { ConflictError, NotFoundError } from "@/server/errors";

const RUN_ID = Date.now().toString(36);

let author: { id: string };
let voter: { id: string };

beforeAll(async () => {
  author = await prisma.user.create({
    data: {
      username: `voteauthor${RUN_ID}`,
      email: `voteauthor+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  voter = await prisma.user.create({
    data: {
      username: `voter${RUN_ID}`,
      email: `voter+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
});

afterAll(async () => {
  await prisma.vote.deleteMany({ where: { userId: { in: [author.id, voter.id] } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: [author.id, voter.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [author.id, voter.id] } } });
  await prisma.$disconnect();
});

async function createTopic(visibility: "PUBLIC" | "PRIVATE" = "PUBLIC") {
  return prisma.topic.create({
    data: { title: `Tema voto ${RUN_ID} ${crypto.randomUUID()}`, visibility, authorId: author.id },
  });
}

describe("castVoteSchema", () => {
  it("Justificación vacía: se normaliza a null", () => {
    expect(castVoteSchema.parse({ value: "UP", justification: "" }).justification).toBeNull();
  });

  it("Justificación solo con espacios: se normaliza a null", () => {
    expect(castVoteSchema.parse({ value: "UP", justification: "   " }).justification).toBeNull();
  });

  it("Justificación con texto: se conserva recortada", () => {
    const result = castVoteSchema.parse({ value: "UP", justification: "  Me parece justo  " });
    expect(result.justification).toBe("Me parece justo");
  });

  it("Justificación de exactamente 500 caracteres: válida", () => {
    expect(castVoteSchema.safeParse({ value: "UP", justification: "a".repeat(500) }).success).toBe(
      true,
    );
  });

  it("Justificación de 501 caracteres: error de validación", () => {
    expect(castVoteSchema.safeParse({ value: "UP", justification: "a".repeat(501) }).success).toBe(
      false,
    );
  });
});

describe("VoteService.castVote", () => {
  it("Voto positivo: incrementa positiveVotes", async () => {
    const topic = await createTopic();
    const result = await VoteService.castVote(topic.id, voter.id, "UP", null);
    expect(result).toEqual({ positiveVotes: 1, negativeVotes: 0, myVote: "UP" });
  });

  it("Voto negativo: incrementa negativeVotes", async () => {
    const topic = await createTopic();
    const result = await VoteService.castVote(topic.id, voter.id, "DOWN", null);
    expect(result).toEqual({ positiveVotes: 0, negativeVotes: 1, myVote: "DOWN" });
  });

  it("Voto con justificación: se almacena en la fila del voto", async () => {
    const topic = await createTopic();
    await VoteService.castVote(topic.id, voter.id, "UP", "Me parece justo");
    const vote = await prisma.vote.findUnique({
      where: { topicId_userId: { topicId: topic.id, userId: voter.id } },
    });
    expect(vote?.justification).toBe("Me parece justo");
  });

  it("Segundo voto del mismo usuario: ConflictError y los totales no cambian", async () => {
    const topic = await createTopic();
    await VoteService.castVote(topic.id, voter.id, "UP", null);

    await expect(VoteService.castVote(topic.id, voter.id, "DOWN", null)).rejects.toBeInstanceOf(
      ConflictError,
    );

    const updated = await prisma.topic.findUniqueOrThrow({ where: { id: topic.id } });
    expect(updated.positiveVotes).toBe(1);
    expect(updated.negativeVotes).toBe(0);
  });

  it("Votos concurrentes del mismo usuario: solo uno se registra", async () => {
    const topic = await createTopic();
    const results = await Promise.allSettled([
      VoteService.castVote(topic.id, voter.id, "UP", null),
      VoteService.castVote(topic.id, voter.id, "UP", null),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);

    const updated = await prisma.topic.findUniqueOrThrow({ where: { id: topic.id } });
    expect(updated.totalVotes).toBe(1);
  });

  it("Tema privado ajeno: NotFoundError y no registra el voto", async () => {
    const topic = await createTopic("PRIVATE");
    await expect(VoteService.castVote(topic.id, voter.id, "UP", null)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const updated = await prisma.topic.findUniqueOrThrow({ where: { id: topic.id } });
    expect(updated.totalVotes).toBe(0);
  });

  it("Tema inexistente: NotFoundError", async () => {
    await expect(
      VoteService.castVote("00000000-0000-0000-0000-000000000000", voter.id, "UP", null),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
