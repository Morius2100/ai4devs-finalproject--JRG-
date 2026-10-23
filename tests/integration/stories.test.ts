import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { UnauthorizedError } from "@/server/errors";
import { requireUser } from "@/server/auth/require-user";
import { FriendshipService } from "@/server/services/friendship-service";
import { StoryService } from "@/server/services/story-service";
import { TopicService } from "@/server/services/topic-service";
import { GET as storiesRoute } from "@/app/api/stories/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

// Historias de amigos y registro de visitas (TKT-056, spec `historias`).
const TAG = `story${Date.now().toString(36)}`;
const HOUR = 60 * 60 * 1000;

let ana: { id: string };
let bruno: { id: string }; // amigo
let carla: { id: string }; // amiga
let dani: { id: string }; // no amigo
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

async function createTopic(
  key: string,
  authorId: string,
  hoursAgo: number,
  visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
) {
  const topic = await prisma.topic.create({
    data: {
      title: `${TAG} ${key}`,
      visibility,
      authorId,
      createdAt: new Date(Date.now() - hoursAgo * HOUR),
    },
    select: { id: true },
  });
  topics[key] = topic.id;
}

const storyOf = async (viewerId: string, userId: string) =>
  (await StoryService.listForUser(viewerId)).items.find((s) => s.author.id === userId);

beforeAll(async () => {
  ana = await createUser("ana");
  bruno = await createUser("bruno");
  carla = await createUser("carla");
  dani = await createUser("dani");

  await FriendshipService.add(ana.id, bruno.id);
  await FriendshipService.add(ana.id, carla.id);

  await createTopic("b-public", bruno.id, 1);
  await createTopic("b-private", bruno.id, 3, "PRIVATE");
  await createTopic("b-old", bruno.id, 25);
  await createTopic("c-new", carla.id, 0.5);
  await createTopic("c-older", carla.id, 6);
  await createTopic("d-public", dani.id, 1);
  await createTopic("a-own", ana.id, 1);
});

afterAll(async () => {
  const ids = [ana.id, bruno.id, carla.id, dani.id];
  await prisma.topic.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

describe("StoryService.listForUser: temas pendientes (TKT-056)", () => {
  it("Incluye temas públicos y privados de amigos de las últimas 24 h, del más antiguo al más nuevo", async () => {
    const story = await storyOf(ana.id, bruno.id);

    expect(story?.topicIds).toEqual([topics["b-private"], topics["b-public"]]);
    expect(story?.author).toMatchObject({ id: bruno.id, username: `${TAG}bruno` });
  });

  it("Excluye temas de más de 24 horas", async () => {
    const story = await storyOf(ana.id, bruno.id);
    expect(story?.topicIds).not.toContain(topics["b-old"]);
  });

  it("Excluye a quien no es amigo y los temas propios", async () => {
    const { items } = await StoryService.listForUser(ana.id);
    const ids = items.flatMap((s) => s.topicIds);

    expect(ids).not.toContain(topics["d-public"]);
    expect(ids).not.toContain(topics["a-own"]);
    expect(items.some((s) => s.author.id === ana.id)).toBe(false);
  });

  it("Ordena las burbujas por el tema pendiente más reciente", async () => {
    const mine = (await StoryService.listForUser(ana.id)).items.filter((s) =>
      [bruno.id, carla.id].includes(s.author.id),
    );

    // carla: el más reciente es de hace 30 min; bruno: de hace 1 h.
    expect(mine.map((s) => s.author.id)).toEqual([carla.id, bruno.id]);
    expect(mine[0].topicIds).toEqual([topics["c-older"], topics["c-new"]]);
  });

  it("Un amigo sin temas pendientes no tiene burbuja y quien no tiene amigos no tiene historias", async () => {
    expect((await StoryService.listForUser(dani.id)).items).toEqual([]);
  });
});

describe("Registro de visitas (TKT-056)", () => {
  it("Abrir un tema ajeno lo registra una sola vez y desaparece de las historias", async () => {
    await TopicService.getById(topics["b-public"], ana.id);
    await TopicService.getById(topics["b-public"], ana.id);

    expect(
      await prisma.topicView.count({ where: { userId: ana.id, topicId: topics["b-public"] } }),
    ).toBe(1);
    const story = await storyOf(ana.id, bruno.id);
    expect(story?.topicIds).toEqual([topics["b-private"]]);
  });

  it("Abrir el último tema pendiente quita la burbuja", async () => {
    await TopicService.getById(topics["b-private"], ana.id);

    expect(await storyOf(ana.id, bruno.id)).toBeUndefined();
    expect(await storyOf(ana.id, carla.id)).toBeDefined();
  });

  it("Un tema que se abre sin pasar por la burbuja también cuenta", async () => {
    // Misma vía que la lista, una notificación o el perfil: `getById`.
    await TopicService.getById(topics["c-new"], ana.id);

    const story = await storyOf(ana.id, carla.id);
    expect(story?.topicIds).toEqual([topics["c-older"]]);
  });

  it("Abrir un tema propio no registra visita", async () => {
    await TopicService.getById(topics["a-own"], ana.id);

    expect(
      await prisma.topicView.count({ where: { userId: ana.id, topicId: topics["a-own"] } }),
    ).toBe(0);
  });

  it("Un tema sin acceso lanza «no encontrado» y no registra visita", async () => {
    await expect(TopicService.getById(topics["b-private"], dani.id)).rejects.toMatchObject({
      status: 404,
    });

    expect(
      await prisma.topicView.count({ where: { userId: dani.id, topicId: topics["b-private"] } }),
    ).toBe(0);
  });

  it("Las visitas de un usuario no afectan a las historias de otro", async () => {
    await FriendshipService.add(dani.id, carla.id);

    const story = await storyOf(dani.id, carla.id);
    expect(story?.topicIds).toEqual([topics["c-older"], topics["c-new"]]);

    await FriendshipService.remove(dani.id, carla.id);
  });
});

describe("Cambios de amistad (TKT-056)", () => {
  it("Dejar de ser amigos quita la burbuja", async () => {
    expect(await storyOf(ana.id, carla.id)).toBeDefined();

    await FriendshipService.remove(ana.id, carla.id);

    expect(await storyOf(ana.id, carla.id)).toBeUndefined();
  });
});

describe("GET /api/stories (TKT-056)", () => {
  it("Devuelve las historias del usuario de la sesión", async () => {
    await createTopic("b-fresh", bruno.id, 0.1);
    vi.mocked(requireUser).mockResolvedValue({ id: ana.id, username: `${TAG}ana` });

    const response = await storiesRoute();
    expect(response.status).toBe(200);

    const body = (await response.json()) as Awaited<ReturnType<typeof StoryService.listForUser>>;
    expect(body.items.find((s) => s.author.id === bruno.id)?.topicIds).toEqual([topics["b-fresh"]]);
  });

  it("Sin sesión responde 401", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthorizedError());

    const response = await storiesRoute();

    expect(response.status).toBe(401);
  });
});
