import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { requireUser } from "@/server/auth/require-user";
import { hasStoredImage } from "@/server/storage/in-memory-image-storage";
import { PATCH as patchMe } from "@/app/api/me/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

// Edición de foto y descripción (TKT-061, spec `mi-perfil`). Requiere IMAGE_STORAGE=memory (.env.test).
const TAG = `meup${Date.now().toString(36)}`;
const PNG = readFileSync(path.join(__dirname, "..", "e2e", "fixtures", "topic-image.png"));
const SEED_AVATAR = "https://picsum.photos/seed/ana/200";

let ana: { id: string };

const pngFile = () => new File([PNG], "foto.png", { type: "image/png" });
const gifFile = () =>
  new File(
    [Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff,", "binary")],
    "a.gif",
    {
      type: "image/gif",
    },
  );

function patch(fields: Record<string, string | File>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return patchMe(new Request("http://localhost/api/me", { method: "PATCH", body: form }));
}

const stored = () => prisma.user.findUniqueOrThrow({ where: { id: ana.id } });
const keyOf = (url: string) => url.replace("/api/media/", "");

beforeAll(async () => {
  ana = await prisma.user.create({
    data: {
      username: `${TAG}ana`,
      email: `${TAG}ana@example.com`,
      passwordHash: "not-a-real-hash",
      avatarUrl: SEED_AVATAR,
      bio: "Descripción inicial",
    },
    select: { id: true },
  });
  vi.mocked(requireUser).mockResolvedValue({ id: ana.id, username: `${TAG}ana` });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: ana.id } });
  await prisma.$disconnect();
});

describe("PATCH /api/me: descripción (TKT-061)", () => {
  it("Solo la descripción: se actualiza y la foto no cambia", async () => {
    const response = await patch({ bio: "  Hola  " });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ bio: "Hola", avatarUrl: SEED_AVATAR });
    expect((await stored()).bio).toBe("Hola");
  });

  it("Descripción vacía: se elimina", async () => {
    const response = await patch({ bio: "   " });

    expect(response.status).toBe(200);
    expect((await response.json()).bio).toBeNull();
    expect((await stored()).bio).toBeNull();
  });

  it("160 caracteres exactos: admitida", async () => {
    expect((await patch({ bio: "b".repeat(160) })).status).toBe(200);
  });

  it("Más de 160 caracteres: 400 y no cambia nada", async () => {
    await patch({ bio: "Antes" });

    const response = await patch({ bio: "b".repeat(161) });

    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.bio).toBeDefined();
    expect((await stored()).bio).toBe("Antes");
  });

  it("Sin campos: devuelve el perfil sin cambios", async () => {
    const before = await stored();

    const response = await patch({});

    expect(response.status).toBe(200);
    expect(await stored()).toEqual(before);
  });
});

describe("PATCH /api/me: foto (TKT-061)", () => {
  it("Foto PNG válida: se guarda con prefijo avatars/ y no se intenta borrar la URL ajena del seed", async () => {
    const response = await patch({ avatar: pngFile() });

    expect(response.status).toBe(200);
    const { avatarUrl } = await response.json();
    expect(avatarUrl).toMatch(/^\/api\/media\/avatars\/[0-9a-f-]{36}\.png$/);
    expect(hasStoredImage(keyOf(avatarUrl))).toBe(true);
    // En base de datos se guarda la clave; la API la devuelve como /api/media/<clave>.
    expect((await stored()).avatarUrl).toBe(keyOf(avatarUrl));
  });

  it("Cambiar la foto borra la anterior del almacenamiento", async () => {
    const first = (await (await patch({ avatar: pngFile() })).json()).avatarUrl as string;
    const second = (await (await patch({ avatar: pngFile() })).json()).avatarUrl as string;

    expect(second).not.toBe(first);
    expect(hasStoredImage(keyOf(first))).toBe(false);
    expect(hasStoredImage(keyOf(second))).toBe(true);
  });

  it("Foto y descripción juntas, en un solo guardado", async () => {
    const response = await patch({ avatar: pngFile(), bio: "Con foto" });

    const body = await response.json();
    expect(body.bio).toBe("Con foto");
    expect(body.avatarUrl).toMatch(/^\/api\/media\/avatars\//);
  });

  it("Formato no admitido (GIF): 415 y no cambia ni la foto ni la descripción", async () => {
    const before = await stored();

    const response = await patch({ avatar: gifFile(), bio: "Nueva" });

    expect(response.status).toBe(415);
    expect(await stored()).toEqual(before);
  });

  it("Imagen de más de 4 MB: 413 y no cambia nada", async () => {
    const before = await stored();
    const big = new File([Buffer.alloc(4 * 1024 * 1024 + 1)], "grande.png", { type: "image/png" });

    const response = await patch({ avatar: big, bio: "Nueva" });

    expect(response.status).toBe(413);
    expect(await stored()).toEqual(before);
  });

  it("Un archivo que dice ser imagen pero no lo es (PDF): 415", async () => {
    const pdf = new File([Buffer.from("%PDF-1.4 contenido")], "falsa.png", { type: "image/png" });

    expect((await patch({ avatar: pdf })).status).toBe(415);
  });

  it("Quitar la foto: avatarUrl a null y se borra del almacenamiento", async () => {
    const current = (await (await patch({ avatar: pngFile() })).json()).avatarUrl as string;

    const response = await patch({ removeAvatar: "true" });

    expect(response.status).toBe(200);
    expect((await response.json()).avatarUrl).toBeNull();
    expect((await stored()).avatarUrl).toBeNull();
    expect(hasStoredImage(keyOf(current))).toBe(false);
  });

  it("Subir y quitar la foto a la vez: 400 y no cambia nada", async () => {
    const before = await stored();

    const response = await patch({ avatar: pngFile(), removeAvatar: "true" });

    expect(response.status).toBe(400);
    expect(await stored()).toEqual(before);
  });
});

describe("PATCH /api/me: acceso (TKT-061)", () => {
  it("Sin sesión responde 401", async () => {
    const { UnauthorizedError } = await import("@/server/errors");
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthorizedError());

    expect((await patch({ bio: "x" })).status).toBe(401);
  });

  it("Petición demasiado grande por Content-Length: 413", async () => {
    const response = await patchMe(
      new Request("http://localhost/api/me", {
        method: "PATCH",
        headers: { "content-length": String(7 * 1024 * 1024) },
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(413);
  });
});
