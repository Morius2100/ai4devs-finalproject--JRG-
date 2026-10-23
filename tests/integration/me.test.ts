import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { UnauthorizedError } from "@/server/errors";
import { requireUser } from "@/server/auth/require-user";
import { FriendshipService } from "@/server/services/friendship-service";
import type { PeoplePage } from "@/server/services/user-service";
import { GET as meRoute } from "@/app/api/me/route";
import { GET as friendsRoute } from "@/app/api/me/friends/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

// Perfil propio y lista de amigos (TKT-060, spec `mi-perfil`).
const TAG = `me${Date.now().toString(36)}`;

let ana: { id: string };
let stranger: { id: string };
const friendNames: string[] = [];

async function createUser(name: string, extra: { bio?: string; avatarUrl?: string } = {}) {
  return prisma.user.create({
    data: {
      username: `${TAG}${name}`,
      email: `${TAG}${name}@example.com`,
      passwordHash: "not-a-real-hash",
      ...extra,
    },
    select: { id: true },
  });
}

const callFriends = (query = "") =>
  friendsRoute(new Request(`http://localhost/api/me/friends${query}`));

beforeAll(async () => {
  ana = await createUser("ana", { bio: "Opino de cine", avatarUrl: "https://picsum.photos/a" });
  stranger = await createUser("zzextra");

  // 23 amigos (más de una página de 20), creados fuera de orden alfabético.
  for (const n of [
    5, 1, 22, 9, 14, 3, 18, 7, 20, 11, 2, 16, 23, 6, 13, 8, 21, 4, 17, 10, 15, 12, 19,
  ]) {
    const name = `f${String(n).padStart(2, "0")}`;
    const friend = await createUser(name);
    await FriendshipService.add(ana.id, friend.id);
    friendNames.push(`${TAG}${name}`);
  }
  friendNames.sort();

  // 3 temas públicos y 1 privado de ana: el contador los incluye todos.
  await prisma.topic.createMany({
    data: [
      { title: `${TAG} t1`, visibility: "PUBLIC", authorId: ana.id },
      { title: `${TAG} t2`, visibility: "PUBLIC", authorId: ana.id },
      { title: `${TAG} t3`, visibility: "PUBLIC", authorId: ana.id },
      { title: `${TAG} t4`, visibility: "PRIVATE", authorId: ana.id },
    ],
  });
  vi.mocked(requireUser).mockResolvedValue({ id: ana.id, username: `${TAG}ana` });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { startsWith: TAG } } });
  await prisma.$disconnect();
});

describe("GET /api/me (TKT-060)", () => {
  it("Devuelve el perfil propio con contadores de temas (con el privado) y amigos", async () => {
    const response = await meRoute();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      id: ana.id,
      username: `${TAG}ana`,
      avatarUrl: "https://picsum.photos/a",
      bio: "Opino de cine",
      topicsCount: 4,
      friendsCount: 23,
    });
  });

  it("Nunca incluye el email ni la contraseña", async () => {
    const body = await (await meRoute()).json();

    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("passwordHash");
  });

  it("Un usuario sin temas ni amigos tiene los contadores a 0 y perfil vacío", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({ id: stranger.id, username: `${TAG}zzextra` });

    const body = await (await meRoute()).json();

    expect(body).toMatchObject({ avatarUrl: null, bio: null, topicsCount: 0, friendsCount: 0 });
  });

  it("Sin sesión responde 401", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthorizedError());

    expect((await meRoute()).status).toBe(401);
  });
});

describe("GET /api/me/friends (TKT-060)", () => {
  it("Lista solo los amigos, en orden alfabético y con isFriend", async () => {
    const page = (await (await callFriends()).json()) as PeoplePage;

    expect(page.items).toHaveLength(20);
    expect(page.items.map((p) => p.username)).toEqual(friendNames.slice(0, 20));
    expect(page.items.every((p) => p.isFriend)).toBe(true);
    expect(page.items.some((p) => p.id === stranger.id)).toBe(false);
    expect(page.nextCursor).not.toBeNull();
  });

  it("Pagina de 20 en 20 sin repetir ni omitir amigos", async () => {
    const first = (await (await callFriends()).json()) as PeoplePage;
    const second = (await (
      await callFriends(`?cursor=${encodeURIComponent(first.nextCursor!)}`)
    ).json()) as PeoplePage;

    expect(second.items.map((p) => p.username)).toEqual(friendNames.slice(20));
    expect(second.nextCursor).toBeNull();
  });

  it("Sin amigos devuelve una lista vacía", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({ id: stranger.id, username: `${TAG}zzextra` });

    expect(await (await callFriends()).json()).toEqual({ items: [], nextCursor: null });
  });

  it("Quitar un amigo lo saca de la lista y baja el contador", async () => {
    const first = (await (await callFriends()).json()) as PeoplePage;
    const removed = first.items[0];

    await FriendshipService.remove(ana.id, removed.id);

    const after = (await (await callFriends()).json()) as PeoplePage;
    expect(after.items.some((p) => p.id === removed.id)).toBe(false);
    expect((await (await meRoute()).json()).friendsCount).toBe(22);
  });

  it("Cursor inválido responde 400", async () => {
    expect((await callFriends("?cursor=no-es-un-cursor")).status).toBe(400);
  });

  it("Sin sesión responde 401", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthorizedError());

    expect((await callFriends()).status).toBe(401);
  });
});
