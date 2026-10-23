import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";

// Tabla `topic_views` (TKT-055): una fila por (usuario, tema) y borrado en cascada.
const TAG = `tview${Date.now().toString(36)}`;

let ana: { id: string };
let bruno: { id: string };
let topicId: string;

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

beforeAll(async () => {
  ana = await createUser("ana");
  bruno = await createUser("bruno");
  topicId = (
    await prisma.topic.create({
      data: { title: `${TAG} tema`, visibility: "PUBLIC", authorId: bruno.id },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [ana.id, bruno.id] } } });
  await prisma.$disconnect();
});

describe("topic_views (TKT-055)", () => {
  it("La clave primaria impide dos visitas del mismo usuario al mismo tema", async () => {
    await prisma.topicView.create({ data: { userId: ana.id, topicId } });

    await expect(prisma.topicView.create({ data: { userId: ana.id, topicId } })).rejects.toThrow();
    expect(await prisma.topicView.count({ where: { userId: ana.id, topicId } })).toBe(1);
  });

  it("Dos usuarios pueden ver el mismo tema", async () => {
    await prisma.topicView.create({ data: { userId: bruno.id, topicId } });

    expect(await prisma.topicView.count({ where: { topicId } })).toBe(2);
  });

  it("Borrar el tema borra sus visitas; borrar un usuario borra las suyas", async () => {
    const extra = await prisma.topic.create({
      data: { title: `${TAG} extra`, visibility: "PUBLIC", authorId: bruno.id },
      select: { id: true },
    });
    await prisma.topicView.create({ data: { userId: ana.id, topicId: extra.id } });

    await prisma.topic.delete({ where: { id: extra.id } });
    expect(await prisma.topicView.count({ where: { topicId: extra.id } })).toBe(0);

    const temp = await createUser("temp");
    await prisma.topicView.create({ data: { userId: temp.id, topicId } });
    await prisma.user.delete({ where: { id: temp.id } });
    expect(await prisma.topicView.count({ where: { userId: temp.id } })).toBe(0);
  });
});
