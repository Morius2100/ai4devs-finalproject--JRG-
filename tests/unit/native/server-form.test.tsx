// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ServerForm es el formulario de servidor de `/servidor` y de «Sin conexión»
// (TKT-073, spec `app-movil`).
const prefs = vi.hoisted(() => new Map<string, string>());
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void prefs.set(key, value),
    remove: async ({ key }: { key: string }) => void prefs.delete(key),
  },
}));

const router = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const auth = vi.hoisted(() => ({
  hasSession: vi.fn(async () => true),
  logout: vi.fn(async () => {}),
}));
vi.mock("@/lib/auth/client", () => auth);

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  prefs.clear();
  fetchMock.mockReset();
  auth.hasSession.mockClear();
  auth.logout.mockClear();
  router.replace.mockClear();
  router.back.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_OPINA_TARGET", "mobile");
  vi.stubEnv("NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE", "true");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function renderForm() {
  vi.resetModules();
  const { initServer } = await import("@/lib/platform/server-store");
  await initServer();
  const { ServerForm } = await import("@/components/native/ServerForm");
  const onCancel = vi.fn();
  const onSwitched = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ServerForm onCancel={onCancel} onSwitched={onSwitched} />
    </QueryClientProvider>,
  );
  return { onCancel, onSwitched };
}

async function save(address: string) {
  await userEvent.type(screen.getByLabelText("Dirección del servidor"), address);
  await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
}

describe("ServerForm (TKT-073)", () => {
  it("Muestra el servidor en uso", async () => {
    await renderForm();
    expect(screen.getByText("http://localhost:3000")).toBeInTheDocument();
  });

  it("Dirección mal escrita: avisa sin hacer ninguna petición", async () => {
    const { onSwitched } = await renderForm();

    await save("192.168.5.101 3000");

    expect(await screen.findByRole("alert")).toHaveTextContent("La dirección no es válida");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSwitched).not.toHaveBeenCalled();
  });

  it("Servidor que no responde: error, no se guarda y no se cierra la sesión", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { onSwitched } = await renderForm();

    await save("http://192.168.5.250:3000");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se puede conectar con ese servidor",
    );
    expect(prefs.size).toBe(0);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(onSwitched).not.toHaveBeenCalled();
    expect(screen.getByText("http://localhost:3000")).toBeInTheDocument();
  });

  it("Misma dirección: avisa y no cierra la sesión", async () => {
    const { onSwitched } = await renderForm();

    await save("http://localhost:3000");

    expect(await screen.findByRole("status")).toHaveTextContent("Ya estás usando este servidor.");
    expect(auth.logout).not.toHaveBeenCalled();
    expect(onSwitched).not.toHaveBeenCalled();
  });

  it("Dirección distinta que responde: la guarda, cierra la sesión y avisa", async () => {
    fetchMock.mockImplementation(async () => Response.json({ status: "ok" }));
    const { onSwitched } = await renderForm();

    await save("http://192.168.5.101:3000/ruta?x=1");

    await waitFor(() => expect(onSwitched).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://192.168.5.101:3000/api/health");
    expect(prefs.get("opina.server-url")).toBe("http://192.168.5.101:3000");
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("Sin sesión: cambia de servidor sin cerrar sesión", async () => {
    auth.hasSession.mockResolvedValueOnce(false);
    fetchMock.mockImplementation(async () => Response.json({ status: "ok" }));
    const { onSwitched } = await renderForm();

    await save("http://192.168.5.101:3000");

    await waitFor(() => expect(onSwitched).toHaveBeenCalledOnce());
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("Restablecer con un servidor guardado: vuelve al del build y avisa", async () => {
    prefs.set("opina.server-url", "http://192.168.5.101:3000");
    const { onSwitched } = await renderForm();
    expect(screen.getByText("http://192.168.5.101:3000")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Restablecer" }));

    await waitFor(() => expect(onSwitched).toHaveBeenCalledOnce());
    expect(prefs.has("opina.server-url")).toBe(false);
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("«Volver» llama a onCancel", async () => {
    const { onCancel } = await renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
