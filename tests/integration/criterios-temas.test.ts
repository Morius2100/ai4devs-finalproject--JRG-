import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { TopicService } from "@/server/services/topic-service";
import { requireUser } from "@/server/auth/require-user";
import { POST as createTopicRoute } from "@/app/api/topics/route";

// Casos de test derivados de los criterios de aceptación de HU-02, HU-08 y HU-09
// (docs/04-historias-usuario.md). Requiere IMAGE_STORAGE=memory (.env.test).

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

const TAG = `crit${Date.now().toString(36)}`;

let author: { id: string; username: string };
let reader: { id: string };

// Cabeceras mínimas reales: file-type decide el formato por sus primeros bytes.
const PNG_MINIMAL = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from([0, 0, 0, 13]),
  Buffer.from("IHDR"),
  Buffer.alloc(13),
  Buffer.alloc(4),
]);
const JPEG_MINIMAL = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  Buffer.from("JFIF\0"),
  Buffer.from([0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9]),
]);
const GIF_MINIMAL = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(16)]);
const PDF_MINIMAL = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n");

beforeAll(async () => {
  [author, reader] = await Promise.all([
    prisma.user.create({
      data: {
        username: `${TAG}a`,
        email: `${TAG}a@example.com`,
        passwordHash: "not-a-real-hash",
      },
      select: { id: true, username: true },
    }),
    prisma.user.create({
      data: {
        username: `${TAG}r`,
        email: `${TAG}r@example.com`,
        passwordHash: "not-a-real-hash",
      },
      select: { id: true },
    }),
  ]);
  vi.mocked(requireUser).mockResolvedValue(author);
});

afterAll(async () => {
  await prisma.topic.deleteMany({ where: { authorId: author.id } });
  await prisma.user.deleteMany({ where: { id: { in: [author.id, reader.id] } } });
  await prisma.$disconnect();
});

function create(fields: { title: string; visibility?: string; image?: File }) {
  const formData = new FormData();
  formData.set("title", fields.title);
  formData.set("visibility", fields.visibility ?? "PUBLIC");
  if (fields.image) formData.set("image", fields.image);
  return createTopicRoute(
    new Request("http://localhost/api/topics", { method: "POST", body: formData }),
  );
}

const file = (buffer: Buffer, name: string, type: string) =>
  new File([new Uint8Array(buffer)], name, { type });

const topicsWithTitle = (title: string) => prisma.topic.count({ where: { title } });

describe("HU-09 · Adjuntar una imagen al tema", () => {
  it("CA-09.1 · acepta JPEG y PNG, y guarda la extensión real", async () => {
    const png = await create({
      title: `${TAG} png`,
      image: file(PNG_MINIMAL, "a.png", "image/png"),
    });
    const jpeg = await create({
      title: `${TAG} jpeg`,
      image: file(JPEG_MINIMAL, "a.jpg", "image/jpeg"),
    });

    expect(png.status).toBe(201);
    expect(jpeg.status).toBe(201);
    const stored = await prisma.topic.findMany({
      where: { authorId: author.id, title: { in: [`${TAG} png`, `${TAG} jpeg`] } },
      select: { title: true, imageUrl: true },
    });
    expect(stored.find((t) => t.title === `${TAG} png`)?.imageUrl).toMatch(/\.png$/);
    expect(stored.find((t) => t.title === `${TAG} jpeg`)?.imageUrl).toMatch(/\.jpg$/);
  });

  it("CA-09.3 · un GIF se rechaza con 415 y no se crea el tema", async () => {
    const title = `${TAG} gif`;

    const response = await create({ title, image: file(GIF_MINIMAL, "a.gif", "image/gif") });

    expect(response.status).toBe(415);
    expect(await topicsWithTitle(title)).toBe(0);
  });

  it("CA-09.3 · un PDF disfrazado de imagen se rechaza con 415 y no se crea el tema", async () => {
    const title = `${TAG} pdf`;

    const response = await create({ title, image: file(PDF_MINIMAL, "falsa.png", "image/png") });

    expect(response.status).toBe(415);
    expect(await topicsWithTitle(title)).toBe(0);
  });

  it("CA-09.3 · una imagen de más de 4 MB se rechaza con 413 y no se crea el tema", async () => {
    const title = `${TAG} grande`;
    const big = Buffer.concat([PNG_MINIMAL, Buffer.alloc(4 * 1024 * 1024)]);

    const response = await create({ title, image: file(big, "grande.png", "image/png") });

    expect(response.status).toBe(413);
    expect(await topicsWithTitle(title)).toBe(0);
  });

  it("CA-09.3 · el rechazo se explica con el formato estándar de errores de la API", async () => {
    const response = await create({
      title: `${TAG} gif2`,
      image: file(GIF_MINIMAL, "a.gif", "image/gif"),
    });

    expect(await response.json()).toMatchObject({
      error: { code: "UNSUPPORTED_MEDIA_TYPE", message: expect.any(String) },
    });
  });
});

describe("HU-08 · Crear un tema público", () => {
  it("CA-08.2 · acepta títulos de 3 y de 120 caracteres", async () => {
    const short = await create({ title: "a".repeat(3) });
    const long = await create({ title: "b".repeat(120) });

    expect(short.status).toBe(201);
    expect(long.status).toBe(201);
  });

  it("CA-08.2 · rechaza un título vacío o solo con espacios", async () => {
    expect((await create({ title: "" })).status).toBe(400);
    expect((await create({ title: "     " })).status).toBe(400);
  });

  it("CA-08.2 · rechaza una visibilidad que no sea pública ni privada", async () => {
    const title = `${TAG} visibilidad`;

    const response = await create({ title, visibility: "SECRETO" });

    expect(response.status).toBe(400);
    expect(await topicsWithTitle(title)).toBe(0);
  });

  it("CA-08.3 · el tema público queda disponible para otros usuarios en la búsqueda", async () => {
    const title = `${TAG} disponible para todos`;
    const response = await create({ title });
    expect(response.status).toBe(201);

    const page = await TopicService.search({ viewerId: reader.id, q: title });

    expect(page.items.map((item) => item.title)).toContain(title);
  });
});

describe("HU-02 · Buscar temas", () => {
  it("CA-02.5 · los resultados se paginan de 20 en 20 sin repetir ni omitir temas", async () => {
    const prefix = `${TAG} paginado`;
    for (let i = 0; i < 45; i += 1) {
      await prisma.topic.create({
        data: {
          title: `${prefix} ${String(i).padStart(2, "0")}`,
          visibility: "PUBLIC",
          authorId: author.id,
        },
      });
    }
    // Un tema privado con el mismo texto no debe colarse en los resultados.
    await prisma.topic.create({
      data: { title: `${prefix} privado`, visibility: "PRIVATE", authorId: author.id },
    });

    const seen: string[] = [];
    const sizes: number[] = [];
    let cursor: string | undefined;
    do {
      const page = await TopicService.search({ viewerId: reader.id, q: prefix, cursor });
      sizes.push(page.items.length);
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(sizes).toEqual([20, 20, 5]);
    expect(new Set(seen).size).toBe(45);
  });

  it("CA-02.2 · la búsqueda no distingue mayúsculas y encuentra la coincidencia parcial", async () => {
    await prisma.topic.create({
      data: { title: `${TAG} Piña Colada`, visibility: "PUBLIC", authorId: author.id },
    });

    const page = await TopicService.search({
      viewerId: reader.id,
      q: `${TAG.toUpperCase()} PIÑA`,
    });

    expect(page.items.map((item) => item.title)).toContain(`${TAG} Piña Colada`);
  });

  it("CA-02.4 · una búsqueda sin coincidencias devuelve una lista vacía", async () => {
    const page = await TopicService.search({ viewerId: reader.id, q: `${TAG}-no-existe-zzz` });

    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});
