// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const prefs = vi.hoisted(() => new Map<string, string>());
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void prefs.set(key, value),
    remove: async ({ key }: { key: string }) => void prefs.delete(key),
  },
}));
vi.mock("next-auth/react", () => ({ signIn: vi.fn(), signOut: vi.fn() }));

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const fetchMock = vi.fn<typeof fetch>();

async function loadModules() {
  vi.resetModules();
  const apiFetch = await import("@/lib/platform/api-fetch");
  const tokenStore = (await import("@/lib/platform/token-store")).tokenStore;
  const auth = await import("@/lib/auth/client");
  const events = await import("@/lib/platform/events");
  const { AuthGate } = await import("@/components/AuthGate");
  return { ...apiFetch, tokenStore, ...auth, ...events, AuthGate };
}

beforeEach(() => {
  prefs.clear();
  replace.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("apiFetch (TKT-044)", () => {
  it("En la web: ruta relativa y sin Bearer", async () => {
    const { apiFetch } = await loadModules();
    fetchMock.mockResolvedValue(new Response("{}"));

    await apiFetch("/api/topics");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/topics");
    expect(new Headers(init?.headers).get("authorization")).toBeNull();
  });

  it("En la app: URL base y token Bearer", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.opina.test");
    prefs.set("opina.session-token", "tok123");
    const { apiFetch } = await loadModules();
    fetchMock.mockResolvedValue(new Response("{}"));

    await apiFetch("/api/topics");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.opina.test/api/topics");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer tok123");
  });

  it("En la app, un 401 borra el token y avisa para ir a /login", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    prefs.set("opina.session-token", "caducado");
    const { apiFetch, UNAUTHORIZED_EVENT } = await loadModules();
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await apiFetch("/api/topics");

    expect(prefs.has("opina.session-token")).toBe(false);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it("En la app, un fallo de red avisa a la pantalla sin conexión", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    const { apiFetch, NETWORK_ERROR_EVENT } = await loadModules();
    const listener = vi.fn();
    window.addEventListener(NETWORK_ERROR_EVENT, listener);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiFetch("/api/topics")).rejects.toThrow();

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(NETWORK_ERROR_EVENT, listener);
  });
});

describe("isApiReachable (TKT-047)", () => {
  it("Consulta /api/health de la API sin token", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.opina.test");
    prefs.set("opina.session-token", "tok123");
    const { isApiReachable } = await loadModules();
    fetchMock.mockResolvedValue(Response.json({ status: "ok" }));

    await expect(isApiReachable()).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.opina.test/api/health");
    expect(new Headers(init?.headers).get("authorization")).toBeNull();
  });

  it("Servidor caído: false y sin avisar a la pantalla sin conexión", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    const { isApiReachable, NETWORK_ERROR_EVENT } = await loadModules();
    const listener = vi.fn();
    window.addEventListener(NETWORK_ERROR_EVENT, listener);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(isApiReachable()).resolves.toBe(false);

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(NETWORK_ERROR_EVENT, listener);
  });

  it("Respuesta de error: false", async () => {
    const { isApiReachable } = await loadModules();
    fetchMock.mockResolvedValue(new Response("", { status: 502 }));

    await expect(isApiReachable()).resolves.toBe(false);
  });
});

describe("login en la app (TKT-044)", () => {
  it("Credenciales correctas: guarda el token", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    const { login } = await loadModules();
    fetchMock.mockResolvedValue(
      Response.json({ token: "nuevo", user: { id: "1", username: "a" } }),
    );

    await expect(login("ana@opina.test", "password123")).resolves.toBe(true);
    expect(prefs.get("opina.session-token")).toBe("nuevo");
  });

  it("Credenciales incorrectas: false y sin token", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    const { login } = await loadModules();
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(login("ana@opina.test", "mala")).resolves.toBe(false);
    expect(prefs.has("opina.session-token")).toBe(false);
  });

  it("Cerrar sesión borra el token", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    prefs.set("opina.session-token", "tok");
    const { logout } = await loadModules();

    await logout();

    expect(prefs.has("opina.session-token")).toBe(false);
  });
});

describe("AuthGate (TKT-044)", () => {
  it("En la web muestra el contenido sin comprobar nada", async () => {
    const { AuthGate } = await loadModules();
    render(<AuthGate>contenido</AuthGate>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("En la app sin token lleva a /login y no pinta el contenido", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    const { AuthGate } = await loadModules();
    render(<AuthGate>contenido</AuthGate>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });

  it("En la app con token muestra el contenido", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    prefs.set("opina.session-token", "tok");
    const { AuthGate } = await loadModules();
    render(<AuthGate>contenido</AuthGate>);

    expect(await screen.findByText("contenido")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
