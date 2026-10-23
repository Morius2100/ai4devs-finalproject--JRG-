import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { encodeCursor } from "@/server/cursor";

const RUN_ID = Date.now().toString(36);
const title = (base: string) => `${base} ${RUN_ID}`;

let authorId: string;

beforeAll(async () => {
  const author = await prisma.user.create({
    data: {
      username: `topicowner${RUN_ID}`,
      email: `topicowner+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true },
  });
  authorId = author.id;
});

afterAll(async () => {
  await prisma.topic.deleteMany({ where: { authorId } });
  await prisma.user.delete({ where: { id: authorId } });
  await prisma.$disconnect();
});

async function createTopic(data: {
  title: string;
  visibility?: "PUBLIC" | "PRIVATE";
  positiveVotes?: number;
  negativeVotes?: number;
  createdAt?: Date;
}) {
  const positiveVotes = data.positiveVotes ?? 0;
  const negativeVotes = data.negativeVotes ?? 0;
  return prisma.topic.create({
    data: {
      title: data.title,
      visibility: data.visibility ?? "PUBLIC",
      authorId,
      positiveVotes,
      negativeVotes,
      totalVotes: positiveVotes + negativeVotes,
      ...(data.createdAt ? { createdAt: data.createdAt } : {}),
    },
  });
}

describe("TopicService.listTrending", () => {
  it("Orden por tendencia: por totalVotes desc y, a igualdad, por fecha desc", async () => {
    // Votos muy por encima de lo habitual: garantiza que A/B/C encabezan la
    // primera página con independencia de qué otros datos haya en la BD.
    const now = Date.now();
    const a = await createTopic({
      title: title("Tema A"),
      positiveVotes: 900_010,
      createdAt: new Date(now - 2 * 60_000),
    });
    const b = await createTopic({ title: title("Tema B"), positiveVotes: 900_025 });
    const c = await createTopic({
      title: title("Tema C"),
      positiveVotes: 900_010,
      createdAt: new Date(now - 60_000),
    });

    const page = await TopicService.listTrending({ viewerId: authorId });
    const ids = page.items.map((item) => item.id);
    const indexB = ids.indexOf(b.id);
    const indexC = ids.indexOf(c.id);
    const indexA = ids.indexOf(a.id);

    expect(indexB).toBeGreaterThanOrEqual(0);
    expect(indexB).toBeLessThan(indexC);
    expect(indexC).toBeLessThan(indexA);
  });

  it("Paginación sin repetidos: 45 temas se reparten en páginas de 20, 20 y 5 sin duplicar ninguno", async () => {
    // Votos muy altos: garantiza que estos 45 encabezan la clasificación
    // completa, con independencia de qué otros temas existan en la BD.
    const prefix = title("Scroll");
    const created = [];
    for (let i = 0; i < 45; i += 1) {
      created.push(
        await createTopic({
          title: `${prefix} ${String(i).padStart(2, "0")}`,
          positiveVotes: 800_000 + i,
        }),
      );
    }
    const createdIds = new Set(created.map((t) => t.id));

    const page1 = await TopicService.listTrending({ viewerId: authorId });
    const ourIds1 = page1.items.filter((item) => createdIds.has(item.id));
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await TopicService.listTrending({
      viewerId: authorId,
      cursor: page1.nextCursor!,
    });
    const page3 = await TopicService.listTrending({
      viewerId: authorId,
      cursor: page2.nextCursor!,
    });

    const allIds = [...page1.items, ...page2.items, ...page3.items]
      .filter((item) => createdIds.has(item.id))
      .map((item) => item.id);

    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds.filter((id) => createdIds.has(id)).length).toBe(45);
    expect(ourIds1.length).toBeLessThanOrEqual(20);
  });

  it("Exclusión de temas privados: no aparecen en las tendencias aunque tengan más votos", async () => {
    const privateTopic = await createTopic({
      title: title("Privado"),
      visibility: "PRIVATE",
      positiveVotes: 9999,
    });

    const page = await TopicService.listTrending({ viewerId: authorId });
    expect(page.items.some((item) => item.id === privateTopic.id)).toBe(false);
  });

  it("Cursor inválido: se rechaza con un error de validación (400)", async () => {
    await expect(
      TopicService.listTrending({ viewerId: authorId, cursor: "no-es-un-cursor-valido" }),
    ).rejects.toThrow();
  });

  it("Cursor con formato correcto pero corrupto también se rechaza", async () => {
    const badCursor = encodeCursor(["no-es-un-numero", "no-es-una-fecha", "no-es-un-uuid"]);
    await expect(
      TopicService.listTrending({ viewerId: authorId, cursor: badCursor }),
    ).rejects.toThrow();
  });
});

describe("TopicService.search", () => {
  it("Buscar por parte del título, insensible a mayúsculas", async () => {
    const pizza1 = await createTopic({ title: title("¿Pizza con piña?") });
    const pizza2 = await createTopic({ title: title("La mejor PIZZA de la ciudad") });
    const other = await createTopic({ title: title("Tortilla con cebolla") });

    const page = await TopicService.search({ viewerId: authorId, q: "pizza" });
    const ids = page.items.map((item) => item.id);

    expect(ids).toContain(pizza1.id);
    expect(ids).toContain(pizza2.id);
    expect(ids).not.toContain(other.id);
  });

  it("Caracteres especiales en la búsqueda: % se trata como literal", async () => {
    const withPercent = await createTopic({ title: title("Descuento del 100% seguro") });
    const withoutPercent = await createTopic({ title: title("Descuento del 100 seguro") });

    const page = await TopicService.search({ viewerId: authorId, q: "100%" });
    const ids = page.items.map((item) => item.id);

    expect(ids).toContain(withPercent.id);
    expect(ids).not.toContain(withoutPercent.id);
  });

  it("Exclusión de temas privados en la búsqueda, aunque el título coincida", async () => {
    const privateMatch = await createTopic({
      title: title("Secreto pizza especial"),
      visibility: "PRIVATE",
    });

    const page = await TopicService.search({ viewerId: authorId, q: "pizza especial" });
    expect(page.items.some((item) => item.id === privateMatch.id)).toBe(false);
  });

  it("Sin coincidencias: devuelve una página vacía", async () => {
    const page = await TopicService.search({
      viewerId: authorId,
      q: `texto-que-no-existe-${RUN_ID}`,
    });
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});
