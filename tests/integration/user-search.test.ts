import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { UnauthorizedError } from "@/server/errors";
import { UserService, type PersonSummary } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { GET as listUsersRoute } from "@/app/api/users/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

// Etiqueta única por ejecución: todos los usuarios de esta prueba la llevan,
// así que buscar por ella aísla los datos de otros tests y del seed.
const TAG = `usrch${Date.now().toString(36)}`;
const PAGING_TAG = `${TAG}pg`;

let viewer: { id: string; username: string };
const ids: Record<string, string> = {};

async function createUser(username: string, extra: { avatarUrl?: string } = {}) {
  return prisma.user.create({
    data: {
      username,
      email: `${username}@example.com`,
      passwordHash: "not-a-real-hash",
      ...extra,
    },
    select: { id: true, username: true },
  });
}

beforeAll(async () => {
  viewer = await createUser(`${TAG}viewer`);
  const names = ["bruno", "carla", "arturo", "arlo", "a_b", "axb", "p%z", "pqz"];
  for (const name of names) {
    const user = await createUser(
      `${TAG}${name}`,
      name === "bruno" ? { avatarUrl: "https://x/y.png" } : {},
    );
    ids[name] = user.id;
  }
  // bruno es amigo del viewer (simétrico); el resto no.
  await prisma.friendship.createMany({
    data: [
      { userId: viewer.id, friendId: ids.bruno },
      { userId: ids.bruno, friendId: viewer.id },
    ],
  });

  await prisma.user.createMany({
    data: Array.from({ length: 45 }, (_, index) => {
      const username = `${PAGING_TAG}${String(index).padStart(2, "0")}`;
      return { username, email: `${username}@example.com`, passwordHash: "not-a-real-hash" };
    }),
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { startsWith: TAG } } });
  await prisma.$disconnect();
});

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: viewer.id, username: viewer.username });
});

const names = (items: PersonSummary[]) => items.map((p) => p.username.replace(TAG, ""));

describe("UserService.search", () => {
  it("Lista con indicador de amistad: amigo y no amigo, sin el propio usuario", async () => {
    const page = await UserService.search({ viewerId: viewer.id, q: `${TAG}` });

    const byName = new Map(page.items.map((p) => [p.username.replace(TAG, ""), p]));
    expect(byName.has("viewer")).toBe(false);
    expect(byName.get("bruno")).toMatchObject({ isFriend: true, avatarUrl: "https://x/y.png" });
    expect(byName.get("carla")).toMatchObject({ isFriend: false, avatarUrl: null });
  });

  it("La amistad es respecto a quien mira: desde bruno, el viewer es amigo", async () => {
    const page = await UserService.search({ viewerId: ids.bruno, q: `${TAG}viewer` });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].isFriend).toBe(true);
  });

  it("Orden alfabético por nombre de usuario", async () => {
    const page = await UserService.search({ viewerId: viewer.id, q: TAG });
    const sorted = [...page.items].sort((a, b) =>
      a.username.toLowerCase() < b.username.toLowerCase() ? -1 : 1,
    );
    expect(page.items).toEqual(sorted);
  });

  it("Buscar por parte del nombre, sin distinguir mayúsculas", async () => {
    const page = await UserService.search({ viewerId: viewer.id, q: `${TAG.toUpperCase()}AR` });
    expect(names(page.items)).toEqual(["arlo", "arturo"]);
  });

  it("Trata % y _ como texto literal", async () => {
    const underscore = await UserService.search({ viewerId: viewer.id, q: `${TAG}a_b` });
    expect(names(underscore.items)).toEqual(["a_b"]);

    const percent = await UserService.search({ viewerId: viewer.id, q: `${TAG}p%z` });
    expect(names(percent.items)).toEqual(["p%z"]);
  });

  it("Sin resultados: lista vacía y sin cursor", async () => {
    const page = await UserService.search({ viewerId: viewer.id, q: `${TAG}zzzz-no-existe` });
    expect(page).toEqual({ items: [], nextCursor: null });
  });

  it("Más de una página: 45 personas en páginas de 20, 20 y 5, sin repetidos", async () => {
    const collected: PersonSummary[] = [];
    const sizes: number[] = [];
    let cursor: string | undefined;
    do {
      const page = await UserService.search({ viewerId: viewer.id, q: PAGING_TAG, cursor });
      sizes.push(page.items.length);
      collected.push(...page.items);
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(sizes).toEqual([20, 20, 5]);
    expect(new Set(collected.map((p) => p.id)).size).toBe(45);
    expect(collected.map((p) => p.username)).toEqual(
      Array.from({ length: 45 }, (_, i) => `${PAGING_TAG}${String(i).padStart(2, "0")}`),
    );
  });

  it("Un cursor inválido lanza ValidationError", async () => {
    await expect(
      UserService.search({ viewerId: viewer.id, cursor: "no-es-un-cursor" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("Sin otras personas: si solo existe quien mira (con esta búsqueda) la lista es vacía", async () => {
    const page = await UserService.search({ viewerId: viewer.id, q: `${TAG}viewer` });
    expect(page.items).toEqual([]);
  });
});

describe("GET /api/users", () => {
  const request = (qs = "") => new Request(`http://localhost/api/users${qs}`);

  it("Respuesta sin datos privados: solo id, username, avatarUrl e isFriend", async () => {
    const response = await listUsersRoute(request(`?q=${TAG}bruno`));
    expect(response.status).toBe(200);

    const body = (await response.json()) as { items: Record<string, unknown>[] };
    expect(body.items).toHaveLength(1);
    expect(Object.keys(body.items[0]).sort()).toEqual(["avatarUrl", "id", "isFriend", "username"]);
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("email");
    expect(raw).not.toContain("passwordHash");
  });

  it("Filtra por q y pagina con cursor", async () => {
    const first = await listUsersRoute(request(`?q=${PAGING_TAG}`));
    const firstBody = (await first.json()) as { items: unknown[]; nextCursor: string };
    expect(firstBody.items).toHaveLength(20);

    const second = await listUsersRoute(
      request(`?q=${PAGING_TAG}&cursor=${encodeURIComponent(firstBody.nextCursor)}`),
    );
    const secondBody = (await second.json()) as { items: unknown[] };
    expect(secondBody.items).toHaveLength(20);
  });

  it("400 con una búsqueda demasiado larga", async () => {
    const response = await listUsersRoute(request(`?q=${"a".repeat(101)}`));
    expect(response.status).toBe(400);
  });

  it("401 sin sesión", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthorizedError());
    const response = await listUsersRoute(request());
    expect(response.status).toBe(401);
  });
});
