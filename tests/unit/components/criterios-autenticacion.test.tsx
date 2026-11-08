// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/registro/page";
import { login, TooManyAttemptsError } from "@/lib/auth/client";
import { apiFetch } from "@/lib/platform/api-fetch";

// Casos de test derivados de los criterios de aceptación de HU-00 (docs/04-historias-usuario.md).

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn() }),
}));
vi.mock("@/lib/auth/client", async (original) => ({
  ...(await original<typeof import("@/lib/auth/client")>()),
  login: vi.fn(),
}));
vi.mock("@/lib/platform/api-fetch", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/platform/server-store", () => ({
  currentServerUrl: () => "",
  isServerConfigurable: () => false,
}));

beforeEach(() => {
  vi.mocked(login).mockReset();
  vi.mocked(apiFetch).mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function fillLogin(email = "ana@opina.test", password = "password123") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

function fillRegister({
  username = "nuevo_usuario",
  email = "nuevo@example.com",
  password = "password123",
} = {}) {
  fireEvent.change(screen.getByLabelText("Nombre de usuario"), { target: { value: username } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("HU-00 · Inicio de sesión", () => {
  it("CA-00.3 · credenciales correctas: entra en la pantalla principal", async () => {
    vi.mocked(login).mockResolvedValue(true);
    render(<LoginPage />);

    fillLogin();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(login).toHaveBeenCalledWith("ana@opina.test", "password123");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("CA-00.4 · credenciales incorrectas: error genérico que no dice qué dato falla", async () => {
    vi.mocked(login).mockResolvedValue(false);
    render(<LoginPage />);

    fillLogin("nadie@opina.test", "mala-contraseña");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Credenciales incorrectas");
    expect(alert.textContent).not.toMatch(/email|contraseña incorrecta|no existe/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("CA-00.4 · demasiados intentos (429): avisa de que hay que esperar y no entra", async () => {
    vi.mocked(login).mockRejectedValue(new TooManyAttemptsError());
    render(<LoginPage />);

    fillLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent("Demasiados intentos");
    expect(push).not.toHaveBeenCalled();
  });

  it("CA-00.4 · fallo de red: mensaje de reintento, distinto de «credenciales incorrectas»", async () => {
    vi.mocked(login).mockRejectedValue(new Error("red caída"));
    render(<LoginPage />);

    fillLogin();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se pudo iniciar sesión");
    expect(alert).not.toHaveTextContent("Credenciales incorrectas");
  });
});

describe("HU-00 · Registro", () => {
  it("CA-00.1 · datos válidos: crea la cuenta, inicia sesión y va a la pantalla principal", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      jsonResponse(201, { id: "u1", username: "nuevo_usuario" }),
    );
    vi.mocked(login).mockResolvedValue(true);
    render(<RegisterPage />);

    fillRegister();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(login).toHaveBeenCalledWith("nuevo@example.com", "password123");
  });

  it("CA-00.2 · usuario o email ya registrados: muestra el error y no inicia sesión", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      jsonResponse(409, { error: { code: "CONFLICT", message: "ya existe" } }),
    );
    render(<RegisterPage />);

    fillRegister();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El nombre de usuario o el email ya están registrados",
    );
    expect(login).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("CA-00.2 · datos inválidos: errores junto a cada campo y no se llama a la API", async () => {
    render(<RegisterPage />);

    fillRegister({ username: "AB", email: "no-es-email", password: "corta" });

    expect(
      await screen.findByText(/nombre de usuario debe tener entre 3 y 30/i),
    ).toBeInTheDocument();
    expect(screen.getByText("El email no es válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("CA-00.2 · contraseña de más de 72 caracteres: error en el campo y no se crea la cuenta", async () => {
    render(<RegisterPage />);

    fillRegister({ password: "x".repeat(73) });

    expect(
      await screen.findByText("La contraseña no puede superar los 72 caracteres"),
    ).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("CA-00.2 · demasiados registros (429): muestra el mensaje del servidor", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      jsonResponse(429, {
        error: { code: "RATE_LIMITED", message: "Demasiados intentos. Inténtalo más tarde." },
      }),
    );
    render(<RegisterPage />);

    fillRegister();

    expect(await screen.findByRole("alert")).toHaveTextContent("Demasiados intentos");
    expect(login).not.toHaveBeenCalled();
  });
});
