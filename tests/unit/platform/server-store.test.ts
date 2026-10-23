import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prefs = vi.hoisted(() => new Map<string, string>());
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void prefs.set(key, value),
    remove: async ({ key }: { key: string }) => void prefs.delete(key),
  },
}));

const fetchMock = vi.fn<typeof fetch>();

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("@/lib/platform/server-store");
}

const DEV = {
  NEXT_PUBLIC_OPINA_TARGET: "mobile",
  NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE: "true",
  NEXT_PUBLIC_API_URL: "http://localhost:3000",
};

beforeEach(() => {
  prefs.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("normalizeServerUrl (TKT-068)", () => {
  it.each([
    ["http://192.168.5.101:3000", "http://192.168.5.101:3000"],
    ["  http://192.168.5.101:3000  ", "http://192.168.5.101:3000"],
    ["https://opina.example.com", "https://opina.example.com"],
    ["http://192.168.5.101:3000/api/topics?x=1#y", "http://192.168.5.101:3000"],
    ["HTTP://MiPC:3000/", "http://mipc:3000"],
  ])("«%s» → %s", async (input, expected) => {
    const { normalizeServerUrl } = await load();
    expect(normalizeServerUrl(input)).toBe(expected);
  });

  it.each([
    "192.168.5.101 3000",
    "192.168.5.101:3000",
    "ftp://192.168.5.101",
    "javascript:alert(1)",
    "http://",
    "",
    "   ",
    "http://a b",
  ])("«%s» no es válida", async (input) => {
    const { normalizeServerUrl } = await load();
    expect(normalizeServerUrl(input)).toBeNull();
  });
});

describe("checkServer (TKT-068)", () => {
  it("Responde 200 con { status: ok }: true y pide /api/health", async () => {
    const { checkServer } = await load();
    fetchMock.mockResolvedValue(Response.json({ status: "ok" }));

    await expect(checkServer("http://192.168.5.101:3000")).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe("http://192.168.5.101:3000/api/health");
  });

  it.each([
    ["error de red", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["tiempo agotado", () => Promise.reject(new DOMException("timeout", "TimeoutError"))],
    ["500", () => Promise.resolve(new Response("{}", { status: 500 }))],
    ["200 sin JSON", () => Promise.resolve(new Response("<html>", { status: 200 }))],
    ["200 con otro cuerpo", () => Promise.resolve(Response.json({ hola: "mundo" }))],
  ])("%s: false", async (_name, impl) => {
    const { checkServer } = await load();
    fetchMock.mockImplementation(impl);

    await expect(checkServer("http://192.168.5.250:3000")).resolves.toBe(false);
  });
});

describe("server-store (TKT-068)", () => {
  it("Sin servidor guardado usa el fijado al compilar", async () => {
    const store = await load(DEV);
    await store.initServer();

    expect(store.currentServerUrl()).toBe("http://localhost:3000");
  });

  it("Guarda el servidor, lo conserva al reabrir y permite restablecerlo", async () => {
    let store = await load(DEV);
    await store.initServer();
    await store.setServer("http://192.168.5.101:3000");
    expect(store.currentServerUrl()).toBe("http://192.168.5.101:3000");

    // «Reabrir la app»: módulos nuevos, mismo almacenamiento.
    store = await load(DEV);
    expect(store.currentServerUrl()).toBe("http://localhost:3000");
    await store.initServer();
    expect(store.currentServerUrl()).toBe("http://192.168.5.101:3000");

    await store.resetServer();
    expect(store.currentServerUrl()).toBe("http://localhost:3000");
    expect(prefs.size).toBe(0);
  });

  it("En producción ignora cualquier servidor guardado y no es configurable", async () => {
    prefs.set("opina.server-url", "http://192.168.5.101:3000");
    const store = await load({
      NEXT_PUBLIC_OPINA_TARGET: "mobile",
      NEXT_PUBLIC_API_URL: "https://opina.example.com",
    });
    await store.initServer();

    expect(store.isServerConfigurable()).toBe(false);
    expect(store.currentServerUrl()).toBe("https://opina.example.com");
  });

  it("En la web no es configurable y la base es vacía (mismo origen)", async () => {
    const store = await load();

    expect(store.isServerConfigurable()).toBe(false);
    expect(store.currentServerUrl()).toBe("");
  });

  it("apiFetch usa el servidor en uso", async () => {
    prefs.set("opina.server-url", "http://192.168.5.101:3000");
    vi.resetModules();
    for (const [k, v] of Object.entries(DEV)) vi.stubEnv(k, v);
    const { initServer } = await import("@/lib/platform/server-store");
    const { apiFetch } = await import("@/lib/platform/api-fetch");
    await initServer();
    fetchMock.mockResolvedValue(new Response("{}"));

    await apiFetch("/api/topics");

    expect(fetchMock.mock.calls[0][0]).toBe("http://192.168.5.101:3000/api/topics");
  });
});
