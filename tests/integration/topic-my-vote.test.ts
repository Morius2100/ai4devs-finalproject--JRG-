import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { requireUser } from "@/server/auth/require-user";
import { TopicService, type TopicSummary } from "@/server/services/topic-service";
import { GET as topicsRoute } from "@/app/api/topics/route";
import { GET as userTopicsRoute } from "@/app/api/users/[id]/topics/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

// Voto propio y desglose en los listados (TKT-051, specs `identidad-visual` del cambio
// tarjeta-tema-fecha-y-voto). Votos por encima de lo habitual para encabezar tendencias.
const TAG = `mvote${Date.now().toString(36)}`;
const BIG = 8_000_000;

let ana: { id: string };
let bruno: { id: string };
const topics: Record<string, string> = {};

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

async function createTopic(key: string, positive: number, negative: number) {
  const topic = await prisma.topic.create({
    data: {
      title: `${TAG} ${key}`,
      visibility: "PUBLIC",
      authorId: bruno.id,
      positiveVotes: positive,
      negativeVotes: negative,
      totalVotes: positive + negative,
    },
    select: { id: true },
  });
  topics[key] = topic.id;
}

const find = (items: TopicSummary[], key: string) => items.find((t) => t.id === topics[key]);

beforeAll(async () => {
  ana = await createUser("ana");
  bruno = await createUser("bruno");

  // «up»: ana votó a favor; «down»: en contra; «none»: no votó; «other»: solo votó bruno.
  await createTopic("up", BIG + 8, 4);
  await createTopic("down", BIG + 6, 3);
  await createTopic("none", BIG + 2, 1);
  await createTopic("other", BIG + 1, 0);

  await prisma.vote.createMany({
    data: [
      { topicId: topics.up, userId: ana.id, value: "UP" },
      { topicId: topics.down, userId: ana.id, value: "DOWN" },
      { topicId: topics.other, userId: bruno.id, value: "UP" },
    ],
  });
  vi.mocked(requireUser).mockResolvedValue({ id: ana.id, username: `${TAG}ana` });
});

afterAll(async () => {
  await prisma.topic.deleteMany({ where: { authorId: bruno.id } });
  await prisma.user.deleteMany({ where: { id: { in: [ana.id, bruno.id] } } });
  await prisma.$disconnect();
});

describe("Voto propio en los listados (TKT-051)", () => {
  it("Tendencias: tema votado a favor y en contra llevan myVote y desglose", async () => {
    const page = await TopicService.listTrending({ viewerId: ana.id });

    expect(find(page.items, "up")).toMatchObject({
      myVote: "UP",
      results: { positiveVotes: BIG + 8, negativeVotes: 4 },
    });
    expect(find(page.items, "down")).toMatchObject({
      myVote: "DOWN",
      results: { positiveVotes: BIG + 6, negativeVotes: 3 },
    });
  });

  it("Tema no votado: myVote null y sin results (S-03)", async () => {
    const page = await TopicService.listTrending({ viewerId: ana.id });

    const none = find(page.items, "none")!;
    expect(none.myVote).toBeNull();
    expect(none).not.toHaveProperty("results");
  });

  it("El voto de otro usuario no se filtra a quien no ha votado", async () => {
    const page = await TopicService.listTrending({ viewerId: ana.id });

    const other = find(page.items, "other")!;
    expect(other.myVote).toBeNull();
    expect(other).not.toHaveProperty("results");

    const asBruno = await TopicService.listTrending({ viewerId: bruno.id });
    expect(find(asBruno.items, "other")?.myVote).toBe("UP");
    expect(find(asBruno.items, "up")?.myVote).toBeNull();
  });

  it("Búsqueda: incluye el voto propio", async () => {
    const page = await TopicService.search({ viewerId: ana.id, q: `${TAG} down` });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ id: topics.down, myVote: "DOWN" });
  });

  it("Temas de una persona: incluye el voto propio en ambos órdenes", async () => {
    for (const sort of ["recent", "top"] as const) {
      const page = await TopicService.listByAuthor({
        authorId: bruno.id,
        viewerId: ana.id,
        sort,
      });
      expect(find(page.items, "up")?.myVote).toBe("UP");
      expect(find(page.items, "none")?.myVote).toBeNull();
    }
  });

  it("El orden de tendencias no cambia por el voto propio", async () => {
    const asAna = await TopicService.listTrending({ viewerId: ana.id });
    const asBruno = await TopicService.listTrending({ viewerId: bruno.id });

    const order = (items: TopicSummary[]) =>
      items.filter((t) => t.title.startsWith(TAG)).map((t) => t.id);
    expect(order(asAna.items)).toEqual(order(asBruno.items));
    expect(order(asAna.items)).toEqual([topics.up, topics.down, topics.none, topics.other]);
  });
});

describe("Contrato de la API (TKT-051)", () => {
  it("GET /api/topics devuelve myVote y results solo en los votados", async () => {
    const response = await topicsRoute(
      new Request(`http://localhost/api/topics?q=${encodeURIComponent(TAG)}`),
    );
    expect(response.status).toBe(200);

    const { items } = (await response.json()) as { items: TopicSummary[] };
    expect(find(items, "up")?.results).toEqual({ positiveVotes: BIG + 8, negativeVotes: 4 });
    expect(find(items, "none")).not.toHaveProperty("results");
    expect(find(items, "none")?.myVote).toBeNull();
  });

  it("GET /api/users/:id/topics devuelve el voto propio", async () => {
    const response = await userTopicsRoute(
      new Request(`http://localhost/api/users/${bruno.id}/topics`),
      { params: Promise.resolve({ id: bruno.id }) },
    );
    expect(response.status).toBe(200);

    const { items } = (await response.json()) as { items: TopicSummary[] };
    expect(find(items, "down")?.myVote).toBe("DOWN");
  });
});
