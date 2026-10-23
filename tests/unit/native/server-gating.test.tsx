// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// NativeShell no pinta nada hasta leer el servidor guardado (TKT-068): las primeras
// consultas de las pantallas irían al servidor equivocado.
const gate = vi.hoisted(() => ({ release: null as null | (() => void) }));
const hide = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: () =>
      new Promise<{ value: string | null }>((resolve) => {
        gate.release = () => resolve({ value: "http://192.168.5.101:3000" });
      }),
    set: async () => {},
    remove: async () => {},
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
vi.mock("@capacitor/splash-screen", () => ({ SplashScreen: { hide } }));
vi.mock("@capacitor/status-bar", () => ({
  Style: { Dark: "DARK" },
  StatusBar: { setBackgroundColor: async () => {}, setStyle: async () => {} },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function renderShell() {
  vi.resetModules();
  const { NativeShell } = await import("@/components/native/NativeShell");
  render(
    <QueryClientProvider client={new QueryClient()}>
      <NativeShell>
        <p>contenido</p>
      </NativeShell>
    </QueryClientProvider>,
  );
}

describe("NativeShell y servidor configurable (TKT-068)", () => {
  it("Build de desarrollo: no pinta hasta leer el servidor y entonces oculta la pantalla de arranque", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    vi.stubEnv("NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE", "true");
    await renderShell();

    expect(screen.queryByText("contenido")).toBeNull();
    expect(hide).not.toHaveBeenCalled();

    gate.release?.();

    expect(await screen.findByText("contenido")).toBeInTheDocument();
    await waitFor(() => expect(hide).toHaveBeenCalled());
    const { currentServerUrl } = await import("@/lib/platform/server-store");
    expect(currentServerUrl()).toBe("http://192.168.5.101:3000");
  });

  it("Producción: pinta de inmediato, sin esperar a ningún servidor", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    await renderShell();

    expect(screen.getByText("contenido")).toBeInTheDocument();
    await waitFor(() => expect(hide).toHaveBeenCalled());
  });
});
