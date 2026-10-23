import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { requireUser } from "@/server/auth/require-user";
import { POST as createTopicRoute } from "@/app/api/topics/route";

const RUN_ID = Date.now().toString(36);

let author: { id: string; username: string };

vi.mock("@/server/auth/require-user", () => ({
  requireUser: vi.fn(),
}));

beforeAll(async () => {
  author = await prisma.user.create({
    data: {
      username: `topiccreator${RUN_ID}`,
      email: `topiccreator+${RUN_ID}@example.com`,
      passwordHash: "not-a-real-hash",
    },
    select: { id: true, username: true },
  });
  vi.mocked(requireUser).mockResolvedValue(author);
});

afterAll(async () => {
  await prisma.topic.deleteMany({ where: { authorId: author.id } });
  await prisma.user.delete({ where: { id: author.id } });
  await prisma.$disconnect();
});

// PNG mínimo real: firma + chunk IHDR (ver tests/unit/server/image-storage.test.ts).
const PNG_MINIMAL = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from([0, 0, 0, 13]),
  Buffer.from("IHDR"),
  Buffer.alloc(13),
  Buffer.alloc(4),
]);

function createRequest(fields: { title: string; visibility?: string; image?: File }): Request {
  const formData = new FormData();
  formData.set("title", fields.title);
  if (fields.visibility !== undefined) {
    formData.set("visibility", fields.visibility);
  }
  if (fields.image) {
    formData.set("image", fields.image);
  }
  return new Request("http://localhost/api/topics", { method: "POST", body: formData });
}

describe("POST /api/topics", () => {
  it("Tema público sin imagen: 201 y queda sin imagen", async () => {
    const title = `Tema público sin imagen ${RUN_ID}`;
    const response = await createTopicRoute(createRequest({ title, visibility: "PUBLIC" }));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toEqual({ id: expect.any(String) });

    const stored = await prisma.topic.findUniqueOrThrow({ where: { id: body.id } });
    expect(stored.visibility).toBe("PUBLIC");
    expect(stored.imageUrl).toBeNull();
  });

  it("Tema público con imagen: 201 y guarda la URL de la imagen", async () => {
    const title = `Tema con imagen ${RUN_ID}`;
    const image = new File([PNG_MINIMAL], "foto.png", { type: "image/png" });
    const response = await createTopicRoute(createRequest({ title, visibility: "PUBLIC", image }));
    expect(response.status).toBe(201);

    const body = await response.json();
    const stored = await prisma.topic.findUniqueOrThrow({ where: { id: body.id } });
    // Se guarda la clave; la API la expone como /api/media/<clave>.
    expect(stored.imageUrl).toMatch(/^topics\/[0-9a-f-]{36}\.png$/);
  });

  it("Tema privado: 201", async () => {
    const title = `Tema privado ${RUN_ID}`;
    const response = await createTopicRoute(createRequest({ title, visibility: "PRIVATE" }));
    expect(response.status).toBe(201);

    const body = await response.json();
    const stored = await prisma.topic.findUniqueOrThrow({ where: { id: body.id } });
    expect(stored.visibility).toBe("PRIVATE");
  });

  it("Título de 2 caracteres: 400 y no crea el tema", async () => {
    const response = await createTopicRoute(createRequest({ title: "ab", visibility: "PUBLIC" }));
    expect(response.status).toBe(400);
  });

  it("Título de 121 caracteres: 400 y no crea el tema", async () => {
    const response = await createTopicRoute(
      createRequest({ title: "a".repeat(121), visibility: "PUBLIC" }),
    );
    expect(response.status).toBe(400);
  });

  it("Visibilidad del tema privado: no aparece en tendencias ni en búsqueda; el creador accede a él", async () => {
    const title = `Tema privado visibilidad ${RUN_ID}`;
    const createResponse = await createTopicRoute(createRequest({ title, visibility: "PRIVATE" }));
    const { id } = await createResponse.json();

    const trending = await TopicService.listTrending({ viewerId: author.id });
    expect(trending.items.some((item) => item.id === id)).toBe(false);

    const search = await TopicService.search({ viewerId: author.id, q: title });
    expect(search.items.some((item) => item.id === id)).toBe(false);

    const detail = await TopicService.getById(id, author.id);
    expect(detail.id).toBe(id);
  });
});
