import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { requireUser } from "@/server/auth/require-user";
import { GET as userRoute } from "@/app/api/users/[id]/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

const TAG = `uapi${Date.now().toString(36)}`;
let ana: { id: string };
let bruno: { id: string };

async function createUser(name: string, bio?: string) {
  return prisma.user.create({
    data: {
      username: `${TAG}${name}`,
      email: `${TAG}${name}@example.com`,
      passwordHash: "not-a-real-hash",
      bio,
    },
    select: { id: true },
  });
}

function get(id: string) {
  return userRoute(new Request(`http://localhost/api/users/${id}`), {
    params: Promise.resolve({ id }),
  });
}

beforeAll(async () => {
  ana = await createUser("ana");
  bruno = await createUser("bruno", "Hola, soy Bruno");
  vi.mocked(requireUser).mockResolvedValue({ id: ana.id, username: `${TAG}ana` });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { startsWith: TAG } } });
  await prisma.$disconnect();
});

describe("GET /api/users/:id (TKT-043)", () => {
  it("Perfil de otra persona: datos públicos sin email", async () => {
    const response = await get(bruno.id);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({ id: bruno.id, username: `${TAG}bruno`, bio: "Hola, soy Bruno" });
    expect(body).not.toHaveProperty("email");
  });

  it("Propio perfil: se devuelve igual", async () => {
    const response = await get(ana.id);
    expect(response.status).toBe(200);
    expect((await response.json()).id).toBe(ana.id);
  });

  it("Identificador desconocido: 404", async () => {
    const response = await get("00000000-0000-0000-0000-000000000000");
    expect(response.status).toBe(404);
  });

  it("Identificador con formato inválido: 404", async () => {
    const response = await get("no-es-un-uuid");
    expect(response.status).toBe(404);
  });
});
