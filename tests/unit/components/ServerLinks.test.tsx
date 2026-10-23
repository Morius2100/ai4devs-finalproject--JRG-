// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@capacitor/preferences", () => ({
  Preferences: { get: async () => ({ value: null }), set: async () => {}, remove: async () => {} },
}));
vi.mock("next-auth/react", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const DEV = {
  NEXT_PUBLIC_OPINA_TARGET: "mobile",
  NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE: "true",
  NEXT_PUBLIC_API_URL: "http://192.168.5.101:3000",
};

async function renderLogin(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const { default: LoginPage } = await import("@/app/(auth)/login/page");
  render(<LoginPage />);
}

async function renderMenu(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const { MainMenu } = await import("@/components/MainMenu");
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MainMenu />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Abrir menú principal" }));
}

beforeEach(() => vi.unstubAllEnvs());
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("Enlaces al servidor (TKT-068)", () => {
  it("Build de desarrollo: el login muestra el servidor en uso y «Cambiar»", async () => {
    await renderLogin(DEV);

    expect(screen.getByText("192.168.5.101:3000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cambiar" })).toHaveAttribute("href", "/servidor");
  });

  it("Build de desarrollo: el menú tiene la opción «Servidor»", async () => {
    await renderMenu(DEV);

    expect(screen.getByRole("menuitem", { name: "Servidor" })).toHaveAttribute("href", "/servidor");
  });

  it("Producción: ni el login ni el menú la muestran", async () => {
    const prod = { NEXT_PUBLIC_OPINA_TARGET: "mobile", NEXT_PUBLIC_API_URL: "https://x.test" };
    await renderLogin(prod);
    expect(screen.queryByRole("link", { name: "Cambiar" })).toBeNull();
    cleanup();

    await renderMenu(prod);
    expect(screen.queryByRole("menuitem", { name: "Servidor" })).toBeNull();
  });

  it("Web: tampoco", async () => {
    await renderLogin({});
    expect(screen.queryByRole("link", { name: "Cambiar" })).toBeNull();
    cleanup();

    await renderMenu({});
    expect(screen.queryByRole("menuitem", { name: "Servidor" })).toBeNull();
  });
});
