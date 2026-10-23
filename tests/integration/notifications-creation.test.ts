import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { NotificationService } from "@/server/services/notification-service";

const RUN_ID = Date.now().toString(36);

let author: { id: string };
let friend1: { id: string };
let friend2: { id: string };
let loneAuthor: { id: string };

beforeAll(async () => {
  author = await prisma.user.create({
    data: {
      username: `notifauthor${RUN_ID}`,
      email: `notifauthor+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  friend1 = await prisma.user.create({
    data: {
      username: `notiffriend1${RUN_ID}`,
      email: `notiffriend1+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  friend2 = await prisma.user.create({
    data: {
      username: `notiffriend2${RUN_ID}`,
      email: `notiffriend2+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  loneAuthor = await prisma.user.create({
    data: {
      username: `notiflonely${RUN_ID}`,
      email: `notiflonely+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });

  for (const friend of [friend1, friend2]) {
    await prisma.friendship.create({ data: { userId: author.id, friendId: friend.id } });
    await prisma.friendship.create({ data: { userId: friend.id, friendId: author.id } });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  const userIds = [author.id, friend1.id, friend2.id, loneAuthor.id];
  await prisma.notification.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.friendship.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("Notificaciones al crear un tema", () => {
  it("Privado con 2 amigos: una notificación por amigo", async () => {
    const title = `Privado 2 amigos ${RUN_ID}`;
    const topic = await TopicService.create({ title, visibility: "PRIVATE" }, author.id, null);

    const notifications = await prisma.notification.findMany({ where: { topicId: topic.id } });
    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.recipientId).sort()).toEqual([friend1.id, friend2.id].sort());
    expect(notifications.every((n) => n.type === "PRIVATE_TOPIC_CREATED")).toBe(true);
  });

  it("Público: no genera ninguna notificación", async () => {
    const title = `Público sin notificaciones ${RUN_ID}`;
    const topic = await TopicService.create({ title, visibility: "PUBLIC" }, author.id, null);

    const notifications = await prisma.notification.findMany({ where: { topicId: topic.id } });
    expect(notifications).toHaveLength(0);
  });

  it("Creador sin amigos: el tema se crea y no genera ninguna notificación", async () => {
    const title = `Privado sin amigos ${RUN_ID}`;
    const topic = await TopicService.create({ title, visibility: "PRIVATE" }, loneAuthor.id, null);

    const stored = await prisma.topic.findUniqueOrThrow({ where: { id: topic.id } });
    expect(stored.id).toBe(topic.id);
    const notifications = await prisma.notification.findMany({ where: { topicId: topic.id } });
    expect(notifications).toHaveLength(0);
  });

  it("Atomicidad: si falla la notificación, no se crea el tema", async () => {
    vi.spyOn(NotificationService, "notifyFriendsOfPrivateTopic").mockRejectedValueOnce(
      new Error("fallo simulado al notificar"),
    );

    const title = `Privado fallo atómico ${RUN_ID}`;
    await expect(
      TopicService.create({ title, visibility: "PRIVATE" }, author.id, null),
    ).rejects.toThrow("fallo simulado al notificar");

    const stored = await prisma.topic.findFirst({ where: { title } });
    expect(stored).toBeNull();
  });
});
