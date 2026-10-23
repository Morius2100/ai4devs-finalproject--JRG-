import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async () => ({ value: "http://192.168.5.101:3000" }),
    set: async () => {},
    remove: async () => {},
  },
}));

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const { initServer } = await import("@/lib/platform/server-store");
  await initServer();
  return (await import("@/lib/platform/media")).resolveMediaUrl;
}

afterEach(() => vi.unstubAllEnvs());

describe("resolveMediaUrl (TKT-069)", () => {
  it("App con servidor configurado: antepone el servidor a la ruta relativa", async () => {
    const resolve = await load({
      NEXT_PUBLIC_OPINA_TARGET: "mobile",
      NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE: "true",
      NEXT_PUBLIC_API_URL: "http://localhost:3000",
    });

    expect(resolve("/api/media/avatars/x.png")).toBe(
      "http://192.168.5.101:3000/api/media/avatars/x.png",
    );
  });

  it("App de producción: usa el servidor fijado al compilar", async () => {
    const resolve = await load({
      NEXT_PUBLIC_OPINA_TARGET: "mobile",
      NEXT_PUBLIC_API_URL: "https://opina.example.com",
    });

    expect(resolve("/api/media/topics/x.png")).toBe(
      "https://opina.example.com/api/media/topics/x.png",
    );
  });

  it("Web: la ruta relativa queda igual (mismo origen)", async () => {
    const resolve = await load({});

    expect(resolve("/api/media/topics/x.png")).toBe("/api/media/topics/x.png");
  });

  it("URL externa: sin cambios en cualquier entorno", async () => {
    const resolve = await load({
      NEXT_PUBLIC_OPINA_TARGET: "mobile",
      NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE: "true",
    });

    expect(resolve("https://picsum.photos/seed/ana/200")).toBe(
      "https://picsum.photos/seed/ana/200",
    );
  });
});
