import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { VoteService } from "@/server/services/vote-service";
import { NotFoundError, UnauthorizedError } from "@/server/errors";
import { requireUser } from "@/server/auth/require-user";
import { imageStorage } from "@/server/storage";
import { hasStoredImage } from "@/server/storage/in-memory-image-storage";
import { DELETE as deleteTopicRoute } from "@/app/api/topics/[id]/route";

// Borrado de un tema propio (HU-23, TKT-087/TKT-089): permisos, cascada e imagen.

const RUN_ID = Date.now().toString(36);

vi.mock("@/server/auth/require-user", () => ({
  requireUser: vi.fn(),
}));

type TestUser = { id: string; username: string };

let owner: TestUser;
let other: TestUser;
let friend: TestUser;

async function createUser(prefix: string): Promise<TestUser> {
  return prisma.user.create({
    data: {
      username: `${prefix}${RUN_ID}`,
      email: `${prefix}+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true, username: true },
  });
}

function actAs(user: TestUser) {
  vi.mocked(requireUser).mockResolvedValue(user);
}

async function createTopic(
  visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
  imageUrl: string | null = null,
) {
  return prisma.topic.create({
    data: { title: `Tema a borrar ${RUN_ID}`, visibility, authorId: owner.id, imageUrl },
  });
}

function callDelete(id: string) {
  return deleteTopicRoute(new Request(`http://localhost/api/topics/${id}`, { method: "DELETE" }), {
    params: Promise.resolve({ id }),
  });
}

async function topicExists(id: string) {
  return (await prisma.topic.count({ where: { id } })) === 1;
}

const PNG_MINIMAL = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from([0, 0, 0, 13]),
  Buffer.from("IHDR"),
  Buffer.alloc(13),
  Buffer.alloc(4),
]);

beforeAll(async () => {
  owner = await createUser("delowner");
  other = await createUser("delother");
  friend = await createUser("delfriend");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(requireUser).mockReset();
});

afterAll(async () => {
  const ids = [owner.id, other.id, friend.id];
  await prisma.topic.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

describe("DELETE /api/topics/:id · solo el autor puede borrar su tema", () => {
  it("El autor borra su tema: 204 y el tema deja de existir", async () => {
    const topic = await createTopic();
    actAs(owner);

    const response = await callDelete(topic.id);

    expect(response.status).toBe(204);
    expect(await topicExists(topic.id)).toBe(false);
  });

  it("Otra persona intenta borrarlo: 404 y el tema sigue con sus votos", async () => {
    const topic = await createTopic();
    await prisma.vote.create({ data: { topicId: topic.id, userId: other.id, value: "UP" } });
    actAs(other);

    const response = await callDelete(topic.id);

    expect(response.status).toBe(404);
    expect(await topicExists(topic.id)).toBe(true);
    expect(await prisma.vote.count({ where: { topicId: topic.id } })).toBe(1);
  });

  it("Tema privado ajeno sin acceso: 404, igual que uno inexistente", async () => {
    const topic = await createTopic("PRIVATE");
    actAs(other);

    const privateResponse = await callDelete(topic.id);
    const missingResponse = await callDelete("00000000-0000-0000-0000-000000000000");

    expect(privateResponse.status).toBe(404);
    expect(missingResponse.status).toBe(404);
    expect(await privateResponse.json()).toEqual(await missingResponse.json());
    expect(await topicExists(topic.id)).toBe(true);
  });

  it("Un amigo con acceso al tema privado tampoco puede borrarlo: 404", async () => {
    const topic = await createTopic("PRIVATE");
    await prisma.friendship.createMany({
      data: [
        { userId: owner.id, friendId: friend.id },
        { userId: friend.id, friendId: owner.id },
      ],
    });
    actAs(friend);

    const response = await callDelete(topic.id);

    expect(response.status).toBe(404);
    expect(await topicExists(topic.id)).toBe(true);
    await prisma.friendship.deleteMany({ where: { userId: { in: [owner.id, friend.id] } } });
  });

  it("Sin sesión: 401 y no se modifica nada", async () => {
    const topic = await createTopic();
    vi.mocked(requireUser).mockRejectedValue(new UnauthorizedError());

    const response = await callDelete(topic.id);

    expect(response.status).toBe(401);
    expect(await topicExists(topic.id)).toBe(true);
  });

  it("Identificador que no es un UUID: 404", async () => {
    actAs(owner);

    const response = await callDelete("no-es-un-uuid");

    expect(response.status).toBe(404);
  });

  it("Borrar dos veces: la segunda respuesta es 404", async () => {
    const topic = await createTopic();
    actAs(owner);

    const first = await callDelete(topic.id);
    const second = await callDelete(topic.id);

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
  });
});

describe("Borrado de un tema · se borra todo lo asociado", () => {
  it("Votos, notificaciones y visitas desaparecen con el tema", async () => {
    const topic = await createTopic("PRIVATE");
    await prisma.vote.create({
      data: { topicId: topic.id, userId: other.id, value: "DOWN", justification: "No" },
    });
    await prisma.notification.create({
      data: {
        recipientId: friend.id,
        actorId: owner.id,
        topicId: topic.id,
        type: "PRIVATE_TOPIC_CREATED",
      },
    });
    await prisma.topicView.create({ data: { userId: friend.id, topicId: topic.id } });
    actAs(owner);

    const response = await callDelete(topic.id);

    expect(response.status).toBe(204);
    expect(await prisma.vote.count({ where: { topicId: topic.id } })).toBe(0);
    expect(await prisma.notification.count({ where: { topicId: topic.id } })).toBe(0);
    expect(await prisma.topicView.count({ where: { topicId: topic.id } })).toBe(0);
  });

  it("La imagen se elimina del almacenamiento", async () => {
    const image = new File([PNG_MINIMAL], "foto.png", { type: "image/png" });
    const { key } = await imageStorage.upload(image);
    const topic = await createTopic("PUBLIC", key);
    expect(hasStoredImage(key)).toBe(true);
    actAs(owner);

    const response = await callDelete(topic.id);

    expect(response.status).toBe(204);
    expect(hasStoredImage(key)).toBe(false);
  });

  it("Un fallo al borrar la imagen no impide el borrado: 204 y el fallo se registra", async () => {
    const image = new File([PNG_MINIMAL], "foto.png", { type: "image/png" });
    const { key } = await imageStorage.upload(image);
    const topic = await createTopic("PUBLIC", key);
    vi.spyOn(imageStorage, "remove").mockRejectedValueOnce(new Error("almacenamiento caído"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    actAs(owner);

    const response = await callDelete(topic.id);

    expect(response.status).toBe(204);
    expect(await topicExists(topic.id)).toBe(false);
    expect(logged).toHaveBeenCalled();
  });

  it("Los demás temas, y los votos de otras personas en ellos, no cambian", async () => {
    const kept = await createTopic();
    const doomed = await createTopic();
    await prisma.vote.create({ data: { topicId: kept.id, userId: other.id, value: "UP" } });
    actAs(owner);

    const response = await callDelete(doomed.id);

    expect(response.status).toBe(204);
    expect(await topicExists(kept.id)).toBe(true);
    expect(await prisma.vote.count({ where: { topicId: kept.id } })).toBe(1);
  });

  it("Votar un tema ya borrado: NotFoundError (no un error de base de datos)", async () => {
    const topic = await createTopic();
    await TopicService.delete(topic.id, owner.id);

    await expect(VoteService.castVote(topic.id, other.id, "UP", null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("TopicService.getById · isAuthor", () => {
  it("Detalle visto por el autor: isAuthor verdadero", async () => {
    const topic = await createTopic();

    const detail = await TopicService.getById(topic.id, owner.id);

    expect(detail.isAuthor).toBe(true);
  });

  it("Detalle visto por otra persona: isAuthor falso y sin el id del autor", async () => {
    const topic = await createTopic();

    const detail = await TopicService.getById(topic.id, other.id);

    expect(detail.isAuthor).toBe(false);
    expect(JSON.stringify(detail)).not.toContain(owner.id);
    expect(detail).not.toHaveProperty("authorId");
  });
});
