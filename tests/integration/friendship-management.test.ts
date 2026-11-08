import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { NotFoundError, ValidationError } from "@/server/errors";
import { FriendshipService } from "@/server/services/friendship-service";
import { StoryService } from "@/server/services/story-service";
import { TopicService } from "@/server/services/topic-service";
import { UserService } from "@/server/services/user-service";
import { VoteService } from "@/server/services/vote-service";
import { requireUser } from "@/server/auth/require-user";
import {
  PUT as putFriendship,
  DELETE as deleteFriendship,
} from "@/app/api/users/[id]/friendship/route";
import { GET as listRequests } from "@/app/api/me/friend-requests/route";
import { DELETE as rejectRequest } from "@/app/api/me/friend-requests/[id]/route";
import { POST as acceptRequest } from "@/app/api/me/friend-requests/[id]/accept/route";

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

const requestsBetween = (a: string, b: string) =>
  prisma.friendRequest.count({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });

const privateTopicOf = (authorId: string, title: string) =>
  TopicService.create({ title: `${title} ${TAG}`, visibility: "PRIVATE" }, authorId, null);

async function clearRelations() {
  const ids = [ana.id, dani.id, bruno.id];
  await prisma.friendRequest.deleteMany({ where: { requesterId: { in: ids } } });
  await prisma.friendship.deleteMany({ where: { userId: { in: ids } } });
}

beforeAll(async () => {
  ana = await createUser("ana");
  dani = await createUser("dani");
  bruno = await createUser("bruno");
});

afterAll(async () => {
  const ids = [ana.id, dani.id, bruno.id];
  await clearRelations();
  await prisma.notification.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.vote.deleteMany({ where: { userId: { in: ids } } });
  await prisma.topicView.deleteMany({ where: { userId: { in: ids } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await clearRelations();
});

describe("FriendshipService: solicitar, aceptar, rechazar y quitar", () => {
  it("Solicitar crea una solicitud y ninguna amistad", async () => {
    const result = await FriendshipService.request(ana.id, dani.id);

    expect(result).toEqual({ status: "PENDING", isFriend: false });
    expect(await requestsBetween(ana.id, dani.id)).toBe(1);
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
    expect(await FriendshipService.areFriends(ana.id, dani.id)).toBe(false);
    expect(await FriendshipService.areFriends(dani.id, ana.id)).toBe(false);
  });

  it("Solicitud repetida: sigue habiendo una sola solicitud", async () => {
    await FriendshipService.request(ana.id, dani.id);
    const again = await FriendshipService.request(ana.id, dani.id);

    expect(again).toEqual({ status: "PENDING", isFriend: false });
    expect(await requestsBetween(ana.id, dani.id)).toBe(1);
  });

  it("Aceptar crea las dos filas de amistad y borra la solicitud", async () => {
    await FriendshipService.request(ana.id, dani.id);

    const result = await FriendshipService.accept(dani.id, ana.id);

    expect(result).toEqual({ status: "FRIENDS", isFriend: true });
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
    expect(await FriendshipService.areFriends(ana.id, dani.id)).toBe(true);
    expect(await FriendshipService.areFriends(dani.id, ana.id)).toBe(true);
  });

  it("Solicitudes cruzadas: la segunda acepta la primera", async () => {
    await FriendshipService.request(ana.id, dani.id);

    const result = await FriendshipService.request(dani.id, ana.id);

    expect(result).toEqual({ status: "FRIENDS", isFriend: true });
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
  });

  it("Solicitar a quien ya es amigo no crea solicitud ni duplica filas", async () => {
    await FriendshipService.add(ana.id, dani.id);

    const result = await FriendshipService.request(ana.id, dani.id);

    expect(result).toEqual({ status: "FRIENDS", isFriend: true });
    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
  });

  it("Rechazar borra la solicitud sin crear amistad y permite volver a solicitar", async () => {
    await FriendshipService.request(ana.id, dani.id);

    expect(await FriendshipService.reject(dani.id, ana.id)).toEqual({
      status: "NONE",
      isFriend: false,
    });
    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);

    expect((await FriendshipService.request(ana.id, dani.id)).status).toBe("PENDING");
  });

  it("Solo la persona destinataria puede aceptar o rechazar", async () => {
    await FriendshipService.request(ana.id, dani.id);

    await expect(FriendshipService.accept(bruno.id, ana.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(FriendshipService.reject(bruno.id, ana.id)).rejects.toBeInstanceOf(NotFoundError);
    // La propia solicitante tampoco puede aceptar su solicitud.
    await expect(FriendshipService.accept(ana.id, dani.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await requestsBetween(ana.id, dani.id)).toBe(1);
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
  });

  it("Aceptar sin solicitud o con un id mal formado: NotFoundError", async () => {
    await expect(FriendshipService.accept(dani.id, ana.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(FriendshipService.accept(dani.id, "no-es-un-uuid")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
  });

  it("Quitar un amigo: desaparecen las dos filas y repetirlo no falla", async () => {
    await FriendshipService.add(ana.id, dani.id);

    expect(await FriendshipService.remove(ana.id, dani.id)).toEqual({
      status: "NONE",
      isFriend: false,
    });
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
    expect((await FriendshipService.remove(ana.id, dani.id)).status).toBe("NONE");
  });

  it("Cancelar: remove borra la solicitud enviada pero no la recibida", async () => {
    await FriendshipService.request(ana.id, dani.id);
    await FriendshipService.request(bruno.id, ana.id);

    await FriendshipService.remove(ana.id, dani.id);
    await FriendshipService.remove(ana.id, bruno.id);

    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
    // La solicitud de bruno a ana sigue ahí: para borrarla está reject.
    expect(await requestsBetween(bruno.id, ana.id)).toBe(1);
  });

  it("Quitar solo afecta a esa pareja", async () => {
    await FriendshipService.add(ana.id, dani.id);
    await FriendshipService.add(ana.id, bruno.id);

    await FriendshipService.remove(ana.id, dani.id);

    expect(await FriendshipService.areFriends(ana.id, bruno.id)).toBe(true);
    expect(await FriendshipService.areFriends(bruno.id, ana.id)).toBe(true);
  });

  it("Auto-amistad: ValidationError y ninguna fila", async () => {
    await expect(FriendshipService.request(ana.id, ana.id)).rejects.toBeInstanceOf(ValidationError);
    await expect(FriendshipService.remove(ana.id, ana.id)).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.friendship.count({ where: { userId: ana.id, friendId: ana.id } })).toBe(0);
    expect(await prisma.friendRequest.count({ where: { requesterId: ana.id } })).toBe(0);
  });

  it("Persona inexistente o id mal formado: NotFoundError y ninguna fila", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    await expect(FriendshipService.request(ana.id, missing)).rejects.toBeInstanceOf(NotFoundError);
    await expect(FriendshipService.remove(ana.id, missing)).rejects.toBeInstanceOf(NotFoundError);
    await expect(FriendshipService.request(ana.id, "no-es-un-uuid")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await prisma.friendship.count({ where: { userId: ana.id } })).toBe(0);
    expect(await prisma.friendRequest.count({ where: { requesterId: ana.id } })).toBe(0);
  });
});

describe("Sin consentimiento no hay acceso (S-01)", () => {
  it("Una solicitud pendiente no da acceso al detalle, al voto ni a las historias", async () => {
    const topic = await privateTopicOf(ana.id, "Privado de ana");

    await FriendshipService.request(dani.id, ana.id);

    await expect(TopicService.getById(topic.id, dani.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(VoteService.castVote(topic.id, dani.id, "UP", null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    const byAuthor = await TopicService.listByAuthor({
      authorId: ana.id,
      viewerId: dani.id,
      sort: "recent",
    });
    expect(byAuthor.items.map((item) => item.id)).not.toContain(topic.id);
    const stories = await StoryService.listForUser(dani.id);
    expect(stories.items.map((story) => story.author.id)).not.toContain(ana.id);
  });

  it("Una solicitud pendiente no genera notificaciones de temas privados", async () => {
    await FriendshipService.request(dani.id, ana.id);

    const topic = await privateTopicOf(ana.id, "Privado sin amigos");

    expect(
      await prisma.notification.count({ where: { topicId: topic.id, recipientId: dani.id } }),
    ).toBe(0);
  });

  it("Aceptar da acceso y quitar lo retira", async () => {
    const topic = await privateTopicOf(ana.id, "Privado aceptado");
    await expect(TopicService.getById(topic.id, dani.id)).rejects.toBeInstanceOf(NotFoundError);

    await FriendshipService.request(dani.id, ana.id);
    await FriendshipService.accept(ana.id, dani.id);

    expect((await TopicService.getById(topic.id, dani.id)).id).toBe(topic.id);
    await VoteService.castVote(topic.id, dani.id, "UP", null);

    await FriendshipService.remove(dani.id, ana.id);
    await expect(TopicService.getById(topic.id, dani.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(VoteService.castVote(topic.id, dani.id, "DOWN", null)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    // Quitar es simétrico: ana sigue viendo su propio tema (autora).
    expect((await TopicService.getById(topic.id, ana.id)).id).toBe(topic.id);
  });

  it("Notificación mientras son amigos y ninguna tras quitar", async () => {
    await FriendshipService.request(bruno.id, ana.id);
    await FriendshipService.accept(ana.id, bruno.id);
    const first = await privateTopicOf(ana.id, "Privado con amigo");
    expect(
      await prisma.notification.count({ where: { topicId: first.id, recipientId: bruno.id } }),
    ).toBe(1);

    await FriendshipService.remove(bruno.id, ana.id);
    const second = await privateTopicOf(ana.id, "Privado sin amigo");
    expect(await prisma.notification.count({ where: { topicId: second.id } })).toBe(0);
  });
});

describe("UserService: perfil y lista de solicitudes", () => {
  it("El perfil indica la solicitud enviada, la recibida o ninguna", async () => {
    expect((await UserService.getProfile(dani.id, ana.id)).friendRequest).toBeNull();

    await FriendshipService.request(ana.id, dani.id);

    expect((await UserService.getProfile(dani.id, ana.id)).friendRequest).toBe("SENT");
    expect((await UserService.getProfile(ana.id, dani.id)).friendRequest).toBe("RECEIVED");
    expect((await UserService.getProfile(dani.id, ana.id)).isFriend).toBe(false);

    await FriendshipService.accept(dani.id, ana.id);

    const profile = await UserService.getProfile(dani.id, ana.id);
    expect(profile.isFriend).toBe(true);
    expect(profile.friendRequest).toBeNull();
  });

  it("listFriendRequests devuelve solo quien ha solicitado a la persona", async () => {
    await FriendshipService.request(ana.id, dani.id);
    await FriendshipService.request(bruno.id, dani.id);
    // dani solicita a ana, pero la solicitud enviada no cuenta como recibida.
    await FriendshipService.request(dani.id, bruno.id).catch(() => undefined);

    const page = await UserService.listFriendRequests({ userId: dani.id });

    expect(page.items.map((person) => person.id)).not.toContain(dani.id);
    expect(page.items.every((person) => person.isFriend === false)).toBe(true);
    const mine = await UserService.listFriendRequests({ userId: ana.id });
    expect(mine.items).toEqual([]);
  });

  it("Las solicitudes pendientes no cuentan como amigos", async () => {
    await FriendshipService.request(ana.id, dani.id);

    expect((await UserService.getOwnProfile(ana.id)).friendsCount).toBe(0);
    expect((await UserService.listFriends({ userId: dani.id })).items).toEqual([]);
  });
});

describe("Rutas de amistad y de solicitudes", () => {
  const call = (
    handler: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>,
    id: string,
  ) =>
    handler(new Request(`http://localhost/api/users/${id}/friendship`), {
      params: Promise.resolve({ id }),
    });

  const as = (user: { id: string }, username: string) =>
    vi.mocked(requireUser).mockResolvedValue({ id: user.id, username });

  beforeEach(() => {
    as(ana, "ana");
  });

  it("PUT envía la solicitud y es idempotente", async () => {
    const first = await call(putFriendship, dani.id);
    const second = await call(putFriendship, dani.id);

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ status: "PENDING", isFriend: false });
    expect(await second.json()).toEqual({ status: "PENDING", isFriend: false });
    expect(await requestsBetween(ana.id, dani.id)).toBe(1);
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
  });

  it("DELETE quita la amistad o cancela la solicitud", async () => {
    await FriendshipService.add(ana.id, dani.id);
    const removed = await call(deleteFriendship, dani.id);
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({ status: "NONE", isFriend: false });
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);

    await call(putFriendship, bruno.id);
    await call(deleteFriendship, bruno.id);
    expect(await requestsBetween(ana.id, bruno.id)).toBe(0);
  });

  it("Flujo completo: dani solicita, ana lo ve, acepta y se crea la amistad", async () => {
    as(dani, "dani");
    await call(putFriendship, ana.id);

    as(ana, "ana");
    const list = await listRequests(new Request("http://localhost/api/me/friend-requests"));
    expect(list.status).toBe(200);
    const body = (await list.json()) as { items: { id: string }[]; nextCursor: string | null };
    expect(body.items.map((person) => person.id)).toEqual([dani.id]);

    const accepted = await call(acceptRequest, dani.id);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({ status: "FRIENDS", isFriend: true });
    expect(await rowsBetween(ana.id, dani.id)).toBe(2);
    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
  });

  it("Rechazar borra la solicitud sin crear amistad", async () => {
    as(dani, "dani");
    await call(putFriendship, ana.id);

    as(ana, "ana");
    const rejected = await call(rejectRequest, dani.id);

    expect(rejected.status).toBe(200);
    expect(await rejected.json()).toEqual({ status: "NONE", isFriend: false });
    expect(await requestsBetween(ana.id, dani.id)).toBe(0);
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
  });

  it("404 al aceptar o rechazar una solicitud que no es para ti", async () => {
    as(dani, "dani");
    await call(putFriendship, ana.id);

    as(bruno, "bruno");
    expect((await call(acceptRequest, dani.id)).status).toBe(404);
    expect((await call(rejectRequest, dani.id)).status).toBe(404);
    as(dani, "dani");
    expect((await call(acceptRequest, ana.id)).status).toBe(404);
    expect(await requestsBetween(ana.id, dani.id)).toBe(1);
    expect(await rowsBetween(ana.id, dani.id)).toBe(0);
  });

  it("400 sobre uno mismo y ninguna fila", async () => {
    expect((await call(putFriendship, ana.id)).status).toBe(400);
    expect((await call(deleteFriendship, ana.id)).status).toBe(400);
    expect(await prisma.friendship.count({ where: { userId: ana.id } })).toBe(0);
    expect(await prisma.friendRequest.count({ where: { requesterId: ana.id } })).toBe(0);
  });

  it("404 si la persona no existe y ninguna fila", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    expect((await call(putFriendship, missing)).status).toBe(404);
    expect((await call(deleteFriendship, missing)).status).toBe(404);
    expect(await prisma.friendship.count({ where: { userId: ana.id } })).toBe(0);
    expect(await prisma.friendRequest.count({ where: { requesterId: ana.id } })).toBe(0);
  });
});
