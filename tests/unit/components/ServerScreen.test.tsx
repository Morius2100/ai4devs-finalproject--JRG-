// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, back }) }));

const fetchMock = vi.fn<typeof fetch>();

const DEV = {
  NEXT_PUBLIC_OPINA_TARGET: "mobile",
  NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE: "true",
  NEXT_PUBLIC_API_URL: "http://localhost:3000",
};

async function renderScreen(env: Record<string, string> = DEV) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const store = await import("@/lib/platform/server-store");
  await store.initServer();
  const { ServerScreen } = await import("@/components/native/ServerScreen");
  const client = new QueryClient();
  const clearSpy = vi.spyOn(client, "clear");
  render(
    <QueryClientProvider client={client}>
      <ServerScreen />
    </QueryClientProvider>,
  );
  return { clearSpy };
}

const healthOk = () => fetchMock.mockResolvedValue(Response.json({ status: "ok" }));

beforeEach(() => {
  prefs.clear();
  replace.mockReset();
  back.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("ServerScreen (TKT-068)", () => {
  it("Muestra el servidor en uso", async () => {
    await renderScreen();
    expect(screen.getByText("http://localhost:3000")).toBeInTheDocument();
  });

  it("Servidor que responde: lo guarda, vacía la caché y va a /login", async () => {
    healthOk();
    const { clearSpy } = await renderScreen();

    await userEvent.type(
      screen.getByLabelText("Dirección del servidor"),
      "http://192.168.5.101:3000",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(fetchMock.mock.calls[0][0]).toBe("http://192.168.5.101:3000/api/health");
    expect(prefs.get("opina.server-url")).toBe("http://192.168.5.101:3000");
    expect(clearSpy).toHaveBeenCalled();
  });

  it("Con sesión iniciada, cambiar de servidor borra el token", async () => {
    prefs.set("opina.session-token", "tok");
    healthOk();
    await renderScreen();

    await userEvent.type(
      screen.getByLabelText("Dirección del servidor"),
      "http://192.168.5.101:3000",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(prefs.has("opina.session-token")).toBe(false);
  });

  it("Servidor que no responde: error, no guarda y no cierra la sesión", async () => {
    prefs.set("opina.session-token", "tok");
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await renderScreen();

    await userEvent.type(
      screen.getByLabelText("Dirección del servidor"),
      "http://192.168.5.250:3000",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se puede conectar con ese servidor",
    );
    expect(prefs.has("opina.server-url")).toBe(false);
    expect(prefs.get("opina.session-token")).toBe("tok");
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("http://localhost:3000")).toBeInTheDocument();
  });

  it("Dirección mal escrita: error sin hacer ninguna petición", async () => {
    await renderScreen();

    await userEvent.type(screen.getByLabelText("Dirección del servidor"), "192.168.5.101 3000");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La dirección no es válida");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Guardar el mismo servidor no cierra la sesión", async () => {
    prefs.set("opina.session-token", "tok");
    await renderScreen();

    await userEvent.type(screen.getByLabelText("Dirección del servidor"), "http://localhost:3000/");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Ya estás usando este servidor");
    expect(prefs.get("opina.session-token")).toBe("tok");
    expect(replace).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Restablecer vuelve al servidor del build y cierra la sesión", async () => {
    prefs.set("opina.server-url", "http://192.168.5.101:3000");
    prefs.set("opina.session-token", "tok");
    await renderScreen();
    expect(screen.getByText("http://192.168.5.101:3000")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Restablecer" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(prefs.has("opina.server-url")).toBe(false);
    expect(prefs.has("opina.session-token")).toBe(false);
  });

  it("En producción no ofrece la opción", async () => {
    await renderScreen({
      NEXT_PUBLIC_OPINA_TARGET: "mobile",
      NEXT_PUBLIC_API_URL: "https://x.test",
    });

    expect(screen.getByText(/solo está disponible en la app de desarrollo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Dirección del servidor")).toBeNull();
  });
});
