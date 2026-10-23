import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { NotFoundError } from "@/server/errors";
import { TopicService, type TopicSummary } from "@/server/services/topic-service";
import { UserService } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { GET as userTopicsRoute } from "@/app/api/users/[id]/topics/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

const TAG = `utop${Date.now().toString(36)}`;

let ana: { id: string };
let bruno: { id: string }; // amigo de ana
let dani: { id: string }; // no amigo
let empty: { id: string }; // sin temas
let bulk: { id: string }; // 45 temas para paginar

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

async function createTopic(
  authorId: string,
  key: string,
  data: { votes: number; ageMinutes: number; visibility?: "PUBLIC" | "PRIVATE" },
) {
  await prisma.topic.create({
    data: {
      title: `${TAG} ${key}`,
      visibility: data.visibility ?? "PUBLIC",
      authorId,
      positiveVotes: data.votes,
      negativeVotes: 0,
      totalVotes: data.votes,
      createdAt: new Date(Date.now() - data.ageMinutes * 60_000),
    },
  });
}

beforeAll(async () => {
  ana = await createUser("ana");
  bruno = await createUser("bruno");
  dani = await createUser("dani");
  empty = await createUser("empty");
  bulk = await createUser("bulk");

  await prisma.friendship.createMany({
    data: [
      { userId: ana.id, friendId: bruno.id },
      { userId: bruno.id, friendId: ana.id },
    ],
  });

  // A: el más antiguo y con más votos; B: el más reciente y con menos; C: intermedio.
  await createTopic(ana.id, "A", { votes: 50, ageMinutes: 3 * 24 * 60 });
  await createTopic(ana.id, "B", { votes: 5, ageMinutes: 24 * 60 });
  await createTopic(ana.id, "C", { votes: 20, ageMinutes: 2 * 24 * 60 });
  await createTopic(ana.id, "P", { votes: 1, ageMinutes: 60, visibility: "PRIVATE" });

  await prisma.topic.createMany({
    data: Array.from({ length: 45 }, (_, index) => ({
      title: `${TAG} bulk ${index}`,
      visibility: "PUBLIC" as const,
      authorId: bulk.id,
      positiveVotes: index % 7,
      negativeVotes: 0,
      totalVotes: index % 7,
      createdAt: new Date(Date.now() - index * 1000),
    })),
  });
});

afterAll(async () => {
  const userIds = [ana.id, bruno.id, dani.id, empty.id, bulk.id];
  await prisma.topic.deleteMany({ where: { authorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

const titles = (items: TopicSummary[]) => items.map((t) => t.title.replace(`${TAG} `, ""));

describe("TopicService.listByAuthor: visibilidad", () => {
  it("Visitante que no es amigo: solo los temas públicos", async () => {
    const page = await TopicService.listByAuthor({
      authorId: ana.id,
      viewerId: dani.id,
      sort: "recent",
    });
    expect(titles(page.items)).toEqual(["B", "C", "A"]);
    expect(page.items.every((t) => t.visibility === "PUBLIC")).toBe(true);
  });

  it("Visitante amigo: también el privado, marcado como PRIVATE", async () => {
    const page = await TopicService.listByAuthor({
      authorId: ana.id,
      viewerId: bruno.id,
      sort: "recent",
    });
    expect(titles(page.items)).toEqual(["P", "B", "C", "A"]);
    expect(page.items[0].visibility).toBe("PRIVATE");
  });

  it("El propio autor ve todos sus temas, incluidos los privados", async () => {
    const page = await TopicService.listByAuthor({
      authorId: ana.id,
      viewerId: ana.id,
      sort: "recent",
    });
    expect(titles(page.items)).toEqual(["P", "B", "C", "A"]);
  });

  it("Persona sin temas: lista vacía", async () => {
    const page = await TopicService.listByAuthor({
      authorId: empty.id,
      viewerId: dani.id,
      sort: "recent",
    });
    expect(page).toEqual({ items: [], nextCursor: null });
  });
});

describe("TopicService.listByAuthor: orden y paginación", () => {
  it("Orden por defecto «recent»: fecha de creación descendente", async () => {
    const page = await TopicService.listByAuthor({
      authorId: ana.id,
      viewerId: dani.id,
      sort: "recent",
    });
    expect(titles(page.items)).toEqual(["B", "C", "A"]);
  });

  it("Más puntuados: votos totales descendente", async () => {
    const page = await TopicService.listByAuthor({
      authorId: ana.id,
      viewerId: dani.id,
      sort: "top",
    });
    expect(titles(page.items)).toEqual(["A", "C", "B"]);
  });

  it.each(["recent", "top"] as const)(
    "Paginación de 20 en orden %s: 45 temas sin repetidos ni omitidos",
    async (sort) => {
      const collected: TopicSummary[] = [];
      const sizes: number[] = [];
      let cursor: string | undefined;
      do {
        const page = await TopicService.listByAuthor({
          authorId: bulk.id,
          viewerId: dani.id,
          sort,
          cursor,
        });
        sizes.push(page.items.length);
        collected.push(...page.items);
        cursor = page.nextCursor ?? undefined;
      } while (cursor);

      expect(sizes).toEqual([20, 20, 5]);
      expect(new Set(collected.map((t) => t.id)).size).toBe(45);

      const keys =
        sort === "recent"
          ? collected.map((t) => -Date.parse(t.createdAt))
          : collected.map((t) => -t.totalVotes);
      expect(keys).toEqual([...keys].sort((a, b) => a - b));
    },
  );
});

describe("UserService.getProfile", () => {
  it("Devuelve el perfil con isFriend e isSelf, sin email", async () => {
    const asFriend = await UserService.getProfile(ana.id, bruno.id);
    expect(asFriend).toMatchObject({ id: ana.id, isFriend: true, isSelf: false, bio: null });
    expect(asFriend).not.toHaveProperty("email");

    const asStranger = await UserService.getProfile(ana.id, dani.id);
    expect(asStranger).toMatchObject({ isFriend: false, isSelf: false });

    const asSelf = await UserService.getProfile(ana.id, ana.id);
    expect(asSelf).toMatchObject({ isFriend: false, isSelf: true });
  });

  it("Identificador desconocido o mal formado: NotFoundError", async () => {
    await expect(
      UserService.getProfile("00000000-0000-0000-0000-000000000000", dani.id),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(UserService.getProfile("no-es-un-uuid", dani.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("GET /api/users/[id]/topics", () => {
  const call = (id: string, qs = "") =>
    userTopicsRoute(new Request(`http://localhost/api/users/${id}/topics${qs}`), {
      params: Promise.resolve({ id }),
    });

  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue({ id: dani.id, username: "dani" });
  });

  it("Por defecto ordena por más recientes y oculta los privados a quien no es amigo", async () => {
    const response = await call(ana.id);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { items: TopicSummary[] };
    expect(titles(body.items)).toEqual(["B", "C", "A"]);
  });

  it("sort=top ordena por votos", async () => {
    const response = await call(ana.id, "?sort=top");
    const body = (await response.json()) as { items: TopicSummary[] };
    expect(titles(body.items)).toEqual(["A", "C", "B"]);
  });

  it("Un amigo recibe también el tema privado", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: bruno.id, username: "bruno" });
    const response = await call(ana.id);
    const body = (await response.json()) as { items: TopicSummary[] };
    expect(titles(body.items)).toEqual(["P", "B", "C", "A"]);
  });

  it("404 si la persona no existe o el id no es válido", async () => {
    expect((await call("00000000-0000-0000-0000-000000000000")).status).toBe(404);
    expect((await call("no-es-un-uuid")).status).toBe(404);
  });

  it("400 con un sort o un cursor inválidos", async () => {
    expect((await call(ana.id, "?sort=raro")).status).toBe(400);
    expect((await call(ana.id, "?cursor=no-es-un-cursor")).status).toBe(400);
  });
});
