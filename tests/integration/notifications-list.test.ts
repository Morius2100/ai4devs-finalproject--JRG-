import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { NotificationService } from "@/server/services/notification-service";

const RUN_ID = Date.now().toString(36);

let recipient: { id: string; username: string };
let other: { id: string };
let actor: { id: string; username: string };
let topic: { id: string; title: string };

beforeAll(async () => {
  recipient = await prisma.user.create({
    data: {
      username: `notifrecip${RUN_ID}`,
      email: `notifrecip+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true, username: true },
  });
  other = await prisma.user.create({
    data: {
      username: `notifother${RUN_ID}`,
      email: `notifother+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  actor = await prisma.user.create({
    data: {
      username: `notifactor${RUN_ID}`,
      email: `notifactor+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true, username: true },
  });
  topic = await prisma.topic.create({
    data: { title: `Tema notif lista ${RUN_ID}`, visibility: "PRIVATE", authorId: actor.id },
    select: { id: true, title: true },
  });
});

afterAll(async () => {
  const userIds = [recipient.id, other.id, actor.id];
  await prisma.notification.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("NotificationService.listForUser", () => {
  it("Orden de más reciente a más antigua; solo las notificaciones propias", async () => {
    const now = Date.now();
    await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        actorId: actor.id,
        topicId: topic.id,
        type: "PRIVATE_TOPIC_CREATED",
        createdAt: new Date(now - 2000),
      },
    });
    const middle = await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        actorId: actor.id,
        topicId: topic.id,
        type: "PRIVATE_TOPIC_CREATED",
        createdAt: new Date(now - 1000),
      },
    });
    const newest = await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        actorId: actor.id,
        topicId: topic.id,
        type: "PRIVATE_TOPIC_CREATED",
        createdAt: new Date(now),
      },
    });
    // Notificación de otro destinatario: no debe aparecer en la lista de `recipient`.
    await prisma.notification.create({
      data: {
        recipientId: other.id,
        actorId: actor.id,
        topicId: topic.id,
        type: "PRIVATE_TOPIC_CREATED",
        createdAt: new Date(now + 5000),
      },
    });

    const page = await NotificationService.listForUser(recipient.id);

    expect(page.items).toHaveLength(3);
    expect(page.items.map((item) => item.id)).toEqual([newest.id, middle.id, expect.any(String)]);
    expect(page.items[0].actor.username).toBe(actor.username);
    expect(page.items[0].topic).toEqual({ id: topic.id, title: topic.title });

    const timestamps = page.items.map((item) => new Date(item.createdAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});
