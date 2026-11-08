import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { SIGNED_URL_TTL_SECONDS, signMediaKey } from "@/server/media";
import { TopicService } from "@/server/services/topic-service";
import { GET as mediaRoute } from "@/app/api/media/[...key]/route";

// Imágenes de temas privados con URL firmada (TKT-084, spec `confidencialidad-usuarios`).
// Requiere IMAGE_STORAGE=memory (.env.test).
const TAG = `mpriv${Date.now().toString(36)}`;
const PNG = readFileSync(path.join(__dirname, "..", "e2e", "fixtures", "topic-image.png"));
const image = () => new File([PNG], "t.png", { type: "image/png" });

let author: { id: string };
let friend: { id: string };
let stranger: { id: string };
let privateTopic: { id: string };
let publicTopic: { id: string };
let privateUrl: string;
let publicUrl: string;

const get = (url: string) => {
  const pathname = new URL(`http://localhost${url}`).pathname;
  const key = pathname.replace("/api/media/", "").split("/");
  return mediaRoute(new Request(`http://localhost${url}`), { params: Promise.resolve({ key }) });
};

const keyOf = (url: string) =>
  new URL(`http://localhost${url}`).pathname.replace("/api/media/", "");

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

beforeAll(async () => {
  author = await createUser("a");
  friend = await createUser("f");
  stranger = await createUser("s");
  await prisma.friendship.createMany({
    data: [
      { userId: author.id, friendId: friend.id },
      { userId: friend.id, friendId: author.id },
    ],
  });

  privateTopic = await TopicService.create(
    { title: `${TAG} privado`, visibility: "PRIVATE" },
    author.id,
    image(),
  );
  publicTopic = await TopicService.create(
    { title: `${TAG} público`, visibility: "PUBLIC" },
    author.id,
    image(),
  );

  privateUrl = (await TopicService.getById(privateTopic.id, friend.id)).imageUrl!;
  publicUrl = (await TopicService.getById(publicTopic.id, friend.id)).imageUrl!;
});

afterAll(async () => {
  const ids = [author.id, friend.id, stranger.id];
  await prisma.notification.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.topicView.deleteMany({ where: { userId: { in: ids } } });
  await prisma.friendship.deleteMany({ where: { userId: { in: ids } } });
  await prisma.topic.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

describe("Imagen de un tema privado", () => {
  it("La API la entrega firmada a quien puede ver el tema", async () => {
    expect(privateUrl).toMatch(
      /^\/api\/media\/topics\/[0-9a-f-]{36}\.\w+\?exp=\d+&sig=[0-9a-f]{64}$/,
    );
    expect(publicUrl).toMatch(/^\/api\/media\/topics\/[0-9a-f-]{36}\.\w+$/);
  });

  it("Quien no puede ver el tema no recibe ni la URL: 404 en el detalle", async () => {
    await expect(TopicService.getById(privateTopic.id, stranger.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("Los listados del perfil también la firman para los amigos", async () => {
    const page = await TopicService.listByAuthor({
      authorId: author.id,
      viewerId: friend.id,
      sort: "recent",
    });

    const item = page.items.find((topic) => topic.id === privateTopic.id);
    expect(item?.imageUrl).toContain("sig=");
  });

  it("Con la firma carga la imagen y no se guarda en cachés compartidas", async () => {
    const response = await get(privateUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("cache-control")).not.toContain("immutable");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it("Sin firma: 404", async () => {
    const withoutSignature = privateUrl.split("?")[0];

    expect((await get(withoutSignature)).status).toBe(404);
  });

  it("Firma manipulada: 404", async () => {
    const tampered = privateUrl.replace(/sig=[0-9a-f]/, (m) =>
      m.endsWith("0") ? "sig=1" : "sig=0",
    );

    expect((await get(tampered)).status).toBe(404);
  });

  it("Firma caducada: 404", async () => {
    const key = keyOf(privateUrl);
    const exp = Math.floor(Date.now() / 1000) - 10;

    expect((await get(`/api/media/${key}?exp=${exp}&sig=${signMediaKey(key, exp)}`)).status).toBe(
      404,
    );
  });

  it("Firma de otra imagen: 404", async () => {
    const otherKey = keyOf(publicUrl);
    const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
    const key = keyOf(privateUrl);

    expect(
      (await get(`/api/media/${key}?exp=${exp}&sig=${signMediaKey(otherKey, exp)}`)).status,
    ).toBe(404);
  });

  it("Ampliar la caducidad no sirve: la firma cubre exp", async () => {
    const key = keyOf(privateUrl);
    const exp = Math.floor(Date.now() / 1000) + 60;
    const sig = signMediaKey(key, exp);

    expect((await get(`/api/media/${key}?exp=${exp + 100000}&sig=${sig}`)).status).toBe(404);
  });
});

describe("Imágenes públicas", () => {
  it("La imagen de un tema público sigue sirviéndose sin firma y con caché larga", async () => {
    const response = await get(publicUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("immutable");
  });

  it("Una clave de tema sin tema asociado responde 404", async () => {
    expect((await get("/api/media/topics/00000000-0000-4000-8000-0000000000aa.png")).status).toBe(
      404,
    );
  });
});
