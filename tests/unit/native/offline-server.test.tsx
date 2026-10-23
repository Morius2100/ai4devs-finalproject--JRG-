// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// «Sin conexión» con cambio de servidor en el build de desarrollo (TKT-073, HU-22 CA-22.5).
const prefs = vi.hoisted(() => new Map<string, string>());
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void prefs.set(key, value),
    remove: async ({ key }: { key: string }) => void prefs.delete(key),
  },
}));
vi.mock("@capacitor/network", () => ({
  Network: {
    getStatus: async () => ({ connected: true }),
    addListener: async () => ({ remove: vi.fn() }),
  },
}));
vi.mock("@capacitor/app", () => ({
  App: { addListener: async () => ({ remove: vi.fn() }), exitApp: vi.fn() },
}));
vi.mock("@capacitor/splash-screen", () => ({ SplashScreen: { hide: async () => {} } }));
vi.mock("@capacitor/status-bar", () => ({
  Style: { Dark: "DARK" },
  StatusBar: { setBackgroundColor: async () => {}, setStyle: async () => {} },
}));

const router = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const auth = vi.hoisted(() => ({
  hasSession: vi.fn(async () => true),
  logout: vi.fn(async () => {}),
}));
vi.mock("@/lib/auth/client", () => auth);

// El servidor del build (`localhost:3000`) responde o no; `192.168.5.101:3000` siempre responde.
const server = { buildUp: false };
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  prefs.clear();
  server.buildUp = false;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith("http://192.168.5.101:3000") || server.buildUp) {
      return Response.json({ status: "ok" });
    }
    throw new TypeError("Failed to fetch");
  });
  router.replace.mockClear();
  auth.hasSession.mockClear();
  auth.logout.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function dev(configurable: boolean) {
  vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000");
  if (configurable) vi.stubEnv("NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE", "true");
}

async function renderOffline(configurable: boolean) {
  dev(configurable);
  vi.resetModules();
  const { NativeShell } = await import("@/components/native/NativeShell");
  const { NETWORK_ERROR_EVENT } = await import("@/lib/platform/events");
  render(
    <QueryClientProvider client={new QueryClient()}>
      <NativeShell>
        <p>contenido</p>
      </NativeShell>
    </QueryClientProvider>,
  );
  await screen.findByText("contenido");
  window.dispatchEvent(new Event(NETWORK_ERROR_EVENT));
  await screen.findByRole("heading", { name: "Sin conexión" });
}

describe("OfflineScreen: servidor en el build de desarrollo (TKT-073)", () => {
  it("Desarrollo: muestra el servidor en uso y «Cambiar servidor»", async () => {
    await renderOffline(true);

    expect(screen.getByText("localhost:3000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar servidor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("Producción: solo «Reintentar», sin servidor ni «Cambiar servidor»", async () => {
    await renderOffline(false);

    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cambiar servidor" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Servidor:/)).not.toBeInTheDocument();
  });

  it("«Cambiar servidor» abre el formulario en lugar de «Reintentar»", async () => {
    await renderOffline(true);

    await userEvent.click(screen.getByRole("button", { name: "Cambiar servidor" }));

    expect(screen.getByLabelText("Dirección del servidor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
  });

  it("Servidor que no responde: error y sigue en «Sin conexión» con el formulario abierto", async () => {
    await renderOffline(true);
    await userEvent.click(screen.getByRole("button", { name: "Cambiar servidor" }));

    await userEvent.type(
      screen.getByLabelText("Dirección del servidor"),
      "http://192.168.5.250:3000",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se puede conectar con ese servidor",
    );
    expect(screen.getByLabelText("Dirección del servidor")).toBeInTheDocument();
    expect(prefs.size).toBe(0);
  });

  it("Servidor que responde: guarda, quita «Sin conexión» y lleva al inicio de sesión", async () => {
    await renderOffline(true);
    await userEvent.click(screen.getByRole("button", { name: "Cambiar servidor" }));

    await userEvent.type(
      screen.getByLabelText("Dirección del servidor"),
      "http://192.168.5.101:3000",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Sin conexión" })).not.toBeInTheDocument(),
    );
    expect(prefs.get("opina.server-url")).toBe("http://192.168.5.101:3000");
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith("/login");
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("Sin reintentos mientras el formulario está abierto; «Volver» los reanuda", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderOffline(true);
    await userEvent.click(screen.getByRole("button", { name: "Cambiar servidor" }));
    fetchMock.mockClear();
    server.buildUp = true;

    await act(() => vi.advanceTimersByTimeAsync(7000));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(screen.getByLabelText("Dirección del servidor")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(fetchMock).toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Sin conexión" })).not.toBeInTheDocument();
  });
});
