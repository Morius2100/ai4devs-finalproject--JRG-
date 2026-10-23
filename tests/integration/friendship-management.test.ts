import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { NotFoundError, ValidationError } from "@/server/errors";
import { FriendshipService } from "@/server/services/friendship-service";
import { TopicService } from "@/server/services/topic-service";
import { VoteService } from "@/server/services/vote-service";
import { requireUser } from "@/server/auth/require-user";
import {
  PUT as putFriendship,
  DELETE as deleteFriendship,
} from "@/app/api/users/[id]/friendship/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

const TAG = `frmg${Date.now().toString(36)}`;

let ana: { id: string };
let dani: { id: string };
let bruno: { id: string };

async function createUser(name: string) {
  return prisma.user.create({
    data: {
      username: `${TAG}${name}`,
      email: `${TAG}${name}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
}

const rowsBetween = (a: string, b: string) =>
  prisma.friendship.count({
    where: {
      OR: [
        { userId: a, friendId: b },
        { userId: b, friendId: a },
      ],
    },
  });

beforeAll(async () => {
  ana = await createUser("ana");
  dani = await createUser("dani");
  bruno = await createUser("bruno");
});

afterAll(async () => {
  const ids = [ana.id, dani.id, bruno.id];
  await prisma.notification.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.vote.deleteMany({ where: { userId: { in: ids } } });
  await prisma.friendship.deleteMany({ where: { userId: { in: ids } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.friendship.deleteMany({ where: { userId: { in: [ana.id, dani.id, bruno.id] } } });
});

describe("FriendshipService.add / remove", () => {
  it("Añadir un amigo: dos filas, una en cada sentido", async () => {
    const result = await FriendshipService.add(ana.id, dani.id);

    expect(result).toEqual({ isFriend: true });
    expect(await FriendshipService.areFriends(ana.id, dani.id)).toBe(true);
    expect(await FriendshipService.areFriends(dani.id, ana.id)).toBe(true);
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
  });

  it("Petición repetida: sigue habiendo exactamente una fila en cada sentido", async () => {
    await FriendshipService.add(ana.id, dani.id);
    const again = await FriendshipService.add(ana.id, dani.id);
    const reverse = await FriendshipService.add(dani.id, ana.id);

    expect(again).toEqual({ isFriend: true });
    expect(reverse).toEqual({ isFriend: true });
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
  });

  it("Quitar un amigo: desaparecen las dos filas y repetirlo no falla", async () => {
    await FriendshipService.add(ana.id, dani.id);

    expect(await FriendshipService.remove(ana.id, dani.id)).toEqual({ isFriend: false });
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
    expect(await FriendshipService.remove(ana.id, dani.id)).toEqual({ isFriend: false });
  });

  it("Quitar solo afecta a esa pareja", async () => {
    await FriendshipService.add(ana.id, dani.id);
    await FriendshipService.add(ana.id, bruno.id);

    await FriendshipService.remove(ana.id, dani.id);

    expect(await FriendshipService.areFriends(ana.id, bruno.id)).toBe(true);
    expect(await FriendshipService.areFriends(bruno.id, ana.id)).toBe(true);
  });

  it("Auto-amistad: ValidationError y ninguna fila", async () => {
    await expect(FriendshipService.add(ana.id, ana.id)).rejects.toBeInstanceOf(ValidationError);
    await expect(FriendshipService.remove(ana.id, ana.id)).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.friendship.count({ where: { userId: ana.id, friendId: ana.id } })).toBe(0);
  });

  it("Persona inexistente o id mal formado: NotFoundError y ninguna fila", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    await expect(FriendshipService.add(ana.id, missing)).rejects.toBeInstanceOf(NotFoundError);
    await expect(FriendshipService.remove(ana.id, missing)).rejects.toBeInstanceOf(NotFoundError);
    await expect(FriendshipService.add(ana.id, "no-es-un-uuid")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await prisma.friendship.count({ where: { userId: ana.id } })).toBe(0);
  });
});

describe("Efecto de la amistad en temas privados y notificaciones", () => {
  it("Acceso tras añadir y pérdida de acceso tras quitar", async () => {
    const topic = await TopicService.create(
      { title: `Privado de ana ${TAG}`, visibility: "PRIVATE" },
      ana.id,
      null,
    );

    // Sin amistad: el tema es inexistente para dani.
    await expect(TopicService.getById(topic.id, dani.id)).rejects.toBeInstanceOf(NotFoundError);

    // dani añade a ana: ya puede abrirlo y votarlo.
    await FriendshipService.add(dani.id, ana.id);
    const detail = await TopicService.getById(topic.id, dani.id);
    expect(detail.id).toBe(topic.id);
    await VoteService.castVote(topic.id, dani.id, "UP", null);

    // dani quita a ana: vuelve a ser inexistente, también para votar.
    await FriendshipService.remove(dani.id, ana.id);
    await expect(TopicService.getById(topic.id, dani.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(VoteService.castVote(topic.id, dani.id, "DOWN", null)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    // Quitar es simétrico: ana sigue viendo su propio tema (autora).
    expect((await TopicService.getById(topic.id, ana.id)).id).toBe(topic.id);
  });

  it("Sin notificación tras quitar; con notificación mientras son amigos", async () => {
    await FriendshipService.add(ana.id, bruno.id);
    const first = await TopicService.create(
      { title: `Privado con amigo ${TAG}`, visibility: "PRIVATE" },
      ana.id,
      null,
    );
    expect(
      await prisma.notification.count({ where: { topicId: first.id, recipientId: bruno.id } }),
    ).toBe(1);

    await FriendshipService.remove(bruno.id, ana.id);
    const second = await TopicService.create(
      { title: `Privado sin amigo ${TAG}`, visibility: "PRIVATE" },
      ana.id,
      null,
    );
    expect(await prisma.notification.count({ where: { topicId: second.id } })).toBe(0);
  });
});

describe("PUT/DELETE /api/users/[id]/friendship", () => {
  const call = (
    handler: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>,
    id: string,
  ) =>
    handler(new Request(`http://localhost/api/users/${id}/friendship`), {
      params: Promise.resolve({ id }),
    });

  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue({ id: ana.id, username: "ana" });
  });

  it("PUT añade la amistad y es idempotente", async () => {
    const first = await call(putFriendship, dani.id);
    const second = await call(putFriendship, dani.id);

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ isFriend: true });
    expect(await second.json()).toEqual({ isFriend: true });
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
  });

  it("DELETE quita la amistad", async () => {
    await FriendshipService.add(ana.id, dani.id);

    const response = await call(deleteFriendship, dani.id);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isFriend: false });
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
  });

  it("400 sobre uno mismo y ninguna fila", async () => {
    expect((await call(putFriendship, ana.id)).status).toBe(400);
    expect((await call(deleteFriendship, ana.id)).status).toBe(400);
    expect(await prisma.friendship.count({ where: { userId: ana.id } })).toBe(0);
  });

  it("404 si la persona no existe y ninguna fila", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    expect((await call(putFriendship, missing)).status).toBe(404);
    expect((await call(deleteFriendship, missing)).status).toBe(404);
    expect(await prisma.friendship.count({ where: { userId: ana.id } })).toBe(0);
  });
});
