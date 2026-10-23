// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { handleBackButton } from "@/components/native/back-button";
import { OfflineScreen } from "@/components/native/OfflineScreen";

const network = vi.hoisted(() => ({
  connected: false,
  listener: null as null | ((status: { connected: boolean }) => void),
}));
vi.mock("@capacitor/network", () => ({
  Network: {
    getStatus: async () => ({ connected: network.connected }),
    addListener: async (_: string, cb: (status: { connected: boolean }) => void) => {
      network.listener = cb;
      return { remove: vi.fn() };
    },
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

// `GET /api/health`: la API responde o no (servidor caído, `adb reverse` perdido…).
const fetchMock = vi.fn<typeof fetch>();
function apiUp() {
  fetchMock.mockImplementation(async () => Response.json({ status: "ok" }));
}
function apiDown() {
  fetchMock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
}

beforeEach(() => {
  network.listener = null;
  fetchMock.mockReset();
  apiUp();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Botón atrás de Android (TKT-047)", () => {
  it("Con pantalla anterior: vuelve atrás", () => {
    const actions = { goBack: vi.fn(), exitApp: vi.fn() };
    handleBackButton({ canGoBack: true }, actions);
    expect(actions.goBack).toHaveBeenCalledOnce();
    expect(actions.exitApp).not.toHaveBeenCalled();
  });

  it("Sin pantalla anterior: cierra la app", () => {
    const actions = { goBack: vi.fn(), exitApp: vi.fn() };
    handleBackButton({ canGoBack: false }, actions);
    expect(actions.exitApp).toHaveBeenCalledOnce();
    expect(actions.goBack).not.toHaveBeenCalled();
  });
});

describe("OfflineScreen (TKT-047)", () => {
  it("Muestra «Sin conexión» y «Reintentar»", async () => {
    const onRetry = vi.fn();
    render(<OfflineScreen reason="network" onRetry={onRetry} retrying={false} />);

    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(screen.getByText(/Comprueba tu conexión a Internet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("Con red pero sin respuesta de la API: avisa del servidor", () => {
    render(<OfflineScreen reason="server" onRetry={vi.fn()} retrying={false} />);

    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(screen.getByText(/No se puede conectar con el servidor de Opina/)).toBeInTheDocument();
  });
});

describe("NativeShell (TKT-047)", () => {
  async function renderShell(children: ReactNode) {
    const { NativeShell } = await import("@/components/native/NativeShell");
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <NativeShell>{children}</NativeShell>
      </QueryClientProvider>,
    );
  }

  it("En la web no muestra nunca la pantalla sin conexión", async () => {
    network.connected = false;
    await renderShell(<p>contenido</p>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.queryByText("Sin conexión")).not.toBeInTheDocument();
  });

  it("Abrir la app en modo avión: muestra «Sin conexión»", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    network.connected = false;
    await renderShell(<p>contenido</p>);
    expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  });

  it("Recuperar la conexión: vuelve a la pantalla en la que estaba", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    network.connected = false;
    await renderShell(<p>contenido</p>);
    await screen.findByText("Sin conexión");

    network.connected = true;
    network.listener?.({ connected: true });

    await waitFor(() => expect(screen.queryByText("Sin conexión")).not.toBeInTheDocument());
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("Un fallo de red de la API también muestra «Sin conexión»", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    network.connected = true;
    await renderShell(<p>contenido</p>);
    const { NETWORK_ERROR_EVENT } = await import("@/lib/platform/events");

    window.dispatchEvent(new Event(NETWORK_ERROR_EVENT));

    expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
    expect(screen.getByText(/No se puede conectar con el servidor de Opina/)).toBeInTheDocument();
  });

  it("El servidor vuelve a responder: se quita «Sin conexión» sin pulsar «Reintentar»", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    network.connected = true;
    apiDown();
    await renderShell(<p>contenido</p>);
    const { NETWORK_ERROR_EVENT } = await import("@/lib/platform/events");
    window.dispatchEvent(new Event(NETWORK_ERROR_EVENT));
    await screen.findByText("Sin conexión");

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();

    apiUp();
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(screen.queryByText("Sin conexión")).not.toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("«Reintentar» con la API aún caída: sigue «Sin conexión»", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    network.connected = true;
    apiDown();
    await renderShell(<p>contenido</p>);
    const { NETWORK_ERROR_EVENT } = await import("@/lib/platform/events");
    window.dispatchEvent(new Event(NETWORK_ERROR_EVENT));
    await screen.findByText("Sin conexión");

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeEnabled();
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
  });

  it("Con la app en línea, los avisos de red del sistema no recargan nada", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
    network.connected = true;
    await renderShell(<p>contenido</p>);
    await waitFor(() => expect(network.listener).not.toBeNull());

    network.listener?.({ connected: true });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Sin conexión")).not.toBeInTheDocument();
  });
});
