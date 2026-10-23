import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { requireUser } from "@/server/auth/require-user";
import { imageStorage } from "@/server/storage";
import { toMediaUrl } from "@/server/media";
import { GET as mediaRoute } from "@/app/api/media/[...key]/route";
import { GET as topicsRoute } from "@/app/api/topics/route";
import { GET as meRoute } from "@/app/api/me/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn(async () => null) }));

const { default: middleware } = await import("@/middleware");

// Imágenes servidas por la API (TKT-067, spec `app-movil` y `identificacion-usuarios`).
// Requiere IMAGE_STORAGE=memory (.env.test).
const TAG = `media${Date.now().toString(36)}`;
const PNG = readFileSync(path.join(__dirname, "..", "e2e", "fixtures", "topic-image.png"));
const EXTERNAL = "https://picsum.photos/seed/ana/200";

let user: { id: string };
let key: string;
let topicId: string;

const call = (k: string) =>
  mediaRoute(new Request(`http://localhost/api/media/${k}`), {
    params: Promise.resolve({ key: k.split("/") }),
  });

beforeAll(async () => {
  user = await prisma.user.create({
    data: {
      username: `${TAG}u`,
      email: `${TAG}u@example.com`,
      passwordHash: "not-a-real-hash",
      avatarUrl: EXTERNAL,
    },
    select: { id: true },
  });
  key = (
    await imageStorage.upload(new File([PNG], "a.png", { type: "image/png" }), {
      prefix: "avatars",
    })
  ).key;
  topicId = (
    await prisma.topic.create({
      data: {
        title: `${TAG} tema`,
        visibility: "PUBLIC",
        authorId: user.id,
        imageUrl: "topics/00000000-0000-4000-8000-000000000001.png",
        positiveVotes: 9_000_000,
        totalVotes: 9_000_000,
      },
      select: { id: true },
    })
  ).id;
  vi.mocked(requireUser).mockResolvedValue({ id: user.id, username: `${TAG}u` });
});

afterAll(async () => {
  await imageStorage.remove(key);
  await prisma.user.deleteMany({ where: { id: user.id } });
  await prisma.$disconnect();
});

describe("GET /api/media (TKT-067)", () => {
  it("Sirve la imagen subida con su tipo y caché de larga duración", async () => {
    const response = await call(key);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(Buffer.from(await response.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it.each([
    "avatars/00000000-0000-4000-8000-0000000000ff.png",
    "topics/no-es-un-uuid.png",
    "otra-carpeta/00000000-0000-4000-8000-000000000001.png",
    "avatars/../.env",
    "avatars/00000000-0000-4000-8000-000000000001.gif",
    "..%2F..%2F.env",
  ])("Clave inexistente o no permitida «%s»: 404", async (k) => {
    expect((await call(k)).status).toBe(404);
  });
});

describe("toMediaUrl (TKT-067)", () => {
  it("Convierte claves en rutas relativas y deja las URLs externas sin cambios", () => {
    expect(toMediaUrl("avatars/x.png")).toBe("/api/media/avatars/x.png");
    expect(toMediaUrl(EXTERNAL)).toBe(EXTERNAL);
    expect(toMediaUrl("http://otro-host/imagen.png")).toBe("http://otro-host/imagen.png");
    expect(toMediaUrl(null)).toBeNull();
  });
});

describe("La API devuelve rutas relativas (TKT-067)", () => {
  it("Una imagen de tema subida se devuelve como /api/media/topics/...", async () => {
    const response = await topicsRoute(
      new Request(`http://localhost/api/topics?q=${encodeURIComponent(TAG)}`),
    );
    const { items } = (await response.json()) as { items: Array<{ id: string; imageUrl: string }> };

    expect(items.find((t) => t.id === topicId)?.imageUrl).toBe(
      "/api/media/topics/00000000-0000-4000-8000-000000000001.png",
    );
  });

  it("Una foto externa (seed) se devuelve con su URL completa", async () => {
    const body = await (await meRoute()).json();

    expect(body.avatarUrl).toBe(EXTERNAL);
  });
});

describe("Acceso sin sesión (TKT-067)", () => {
  const run = (pathname: string) =>
    (middleware as unknown as (req: NextRequest, ctx: unknown) => Promise<Response>)(
      new NextRequest(`http://localhost:3000${pathname}`),
      {},
    );

  it("/api/media y /api/health no exigen sesión", async () => {
    for (const p of [`/api/media/${key}`, "/api/health"]) {
      const response = await run(p);
      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  });

  it("El resto de la API sigue exigiendo sesión", async () => {
    expect((await run("/api/topics")).status).toBe(401);
    expect((await run("/api/me")).status).toBe(401);
  });
});

describe("Migración media_keys (TKT-067)", () => {
  const SQL = readFileSync(
    path.join(
      __dirname,
      "..",
      "..",
      "prisma",
      "migrations",
      "20261002120000_media_keys",
      "migration.sql",
    ),
    "utf8",
  );

  it("Convierte URLs del bucket en claves y no toca las externas", async () => {
    const [bucketTopic, memoryUser, externalUser] = await Promise.all([
      prisma.topic.create({
        data: {
          title: `${TAG} bucket`,
          visibility: "PUBLIC",
          authorId: user.id,
          imageUrl:
            "http://localhost:9000/opina-images/topics/11111111-1111-4111-8111-111111111111.png",
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          username: `${TAG}m`,
          email: `${TAG}m@example.com`,
          passwordHash: "x",
          avatarUrl: "memory://avatars/22222222-2222-4222-8222-222222222222.webp",
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          username: `${TAG}e`,
          email: `${TAG}e@example.com`,
          passwordHash: "x",
          avatarUrl: "https://picsum.photos/seed/otra/200",
        },
        select: { id: true },
      }),
    ]);

    // Ejecuta las dos sentencias de la migración (idempotente).
    for (const statement of SQL.split(";")
      .map((s) => s.replace(/--.*$/gm, "").trim())
      .filter(Boolean)) {
      await prisma.$executeRawUnsafe(statement);
    }

    expect((await prisma.topic.findUniqueOrThrow({ where: { id: bucketTopic.id } })).imageUrl).toBe(
      "topics/11111111-1111-4111-8111-111111111111.png",
    );
    expect((await prisma.user.findUniqueOrThrow({ where: { id: memoryUser.id } })).avatarUrl).toBe(
      "avatars/22222222-2222-4222-8222-222222222222.webp",
    );
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: externalUser.id } })).avatarUrl,
    ).toBe("https://picsum.photos/seed/otra/200");
    // Las claves ya convertidas no se vuelven a tocar.
    expect((await prisma.topic.findUniqueOrThrow({ where: { id: topicId } })).imageUrl).toBe(
      "topics/00000000-0000-4000-8000-000000000001.png",
    );

    await prisma.user.deleteMany({ where: { id: { in: [memoryUser.id, externalUser.id] } } });
  });
});
