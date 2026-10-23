// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { PersonScreen } from "@/components/people/PersonScreen";
import { TopicScreen } from "@/components/topics/TopicScreen";
import { ApiError } from "@/lib/api/http";
import { fetchTopicDetail } from "@/lib/api/topics";
import { fetchUserProfile, fetchUserTopicsPage } from "@/lib/api/users";

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/api/topics", async (original) => ({
  ...(await original<typeof import("@/lib/api/topics")>()),
  fetchTopicDetail: vi.fn(),
}));
vi.mock("@/lib/api/users", async (original) => ({
  ...(await original<typeof import("@/lib/api/users")>()),
  fetchUserProfile: vi.fn(),
  fetchUserTopicsPage: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderAt(query: string, ui: ReactElement) {
  searchParams = new URLSearchParams(query);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("TopicScreen: /tema?id= (TKT-045)", () => {
  it("Sin id: «Tema no encontrado» sin pedir nada a la API", () => {
    renderAt("", <TopicScreen />);
    expect(screen.getByRole("heading", { name: "Tema no encontrado" })).toBeInTheDocument();
    expect(fetchTopicDetail).not.toHaveBeenCalled();
  });

  it("Tema inexistente o privado ajeno (404): «Tema no encontrado»", async () => {
    vi.mocked(fetchTopicDetail).mockRejectedValue(new ApiError(404, "Tema no encontrado"));
    renderAt("id=00000000-0000-0000-0000-000000000000", <TopicScreen />);
    expect(await screen.findByRole("heading", { name: "Tema no encontrado" })).toBeInTheDocument();
  });

  it("Error del servidor: mensaje y botón para reintentar", async () => {
    vi.mocked(fetchTopicDetail).mockRejectedValue(new ApiError(500, "Error interno"));
    renderAt("id=t1", <TopicScreen />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se ha podido cargar el tema.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});

describe("PersonScreen: /persona?id= (TKT-045)", () => {
  it("Sin id: «Persona no encontrada» con enlace a Personas", () => {
    renderAt("", <PersonScreen />);
    expect(screen.getByRole("heading", { name: "Persona no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a Personas" })).toHaveAttribute(
      "href",
      "/personas",
    );
    expect(fetchUserProfile).not.toHaveBeenCalled();
  });

  it("Identificador desconocido (404): «Persona no encontrada»", async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new ApiError(404, "Persona no encontrada"));
    renderAt("id=00000000-0000-0000-0000-000000000000", <PersonScreen />);
    expect(
      await screen.findByRole("heading", { name: "Persona no encontrada" }),
    ).toBeInTheDocument();
  });

  it("Perfil existente: muestra la cabecera y sus temas", async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({
      id: "u1",
      username: "bruno",
      avatarUrl: null,
      bio: null,
      isFriend: false,
      isSelf: false,
    });
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderAt("id=u1", <PersonScreen />);

    expect(await screen.findByRole("heading", { name: "bruno" })).toBeInTheDocument();
    expect(fetchUserProfile).toHaveBeenCalledWith("u1");
  });
});
