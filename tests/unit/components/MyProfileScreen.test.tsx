// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyProfileScreen } from "@/components/people/MyProfileScreen";
import { ApiError } from "@/lib/api/http";
import { fetchMe } from "@/lib/api/me";
import { fetchUserTopicsPage } from "@/lib/api/users";
import type { OwnProfile } from "@/server/services/user-service";
import type { TopicSummary } from "@/server/services/topic-service";

vi.mock("@/lib/api/me", () => ({ fetchMe: vi.fn() }));
vi.mock("@/lib/api/users", () => ({ fetchUserTopicsPage: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MyProfileScreen />
    </QueryClientProvider>,
  );
}

const me: OwnProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "ana",
  avatarUrl: null,
  bio: "Opino de cine",
  topicsCount: 12,
  friendsCount: 2,
};

const topic = (
  id: string,
  title: string,
  visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
): TopicSummary => ({
  id,
  title,
  imageUrl: null,
  visibility,
  totalVotes: 3,
  createdAt: new Date().toISOString(),
  myVote: null,
});

describe("MyProfileScreen (TKT-062)", () => {
  it("Perfil completo: nombre, descripción, contadores y «Editar perfil»", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderScreen();

    expect(await screen.findByRole("heading", { name: "ana" })).toBeInTheDocument();
    expect(screen.getByText("Opino de cine")).toBeInTheDocument();
    expect(screen.getByText("12 temas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2 amigos" })).toHaveAttribute(
      "href",
      "/perfil/amigos",
    );
    expect(screen.getByRole("link", { name: "Editar perfil" })).toHaveAttribute(
      "href",
      "/perfil/editar",
    );
  });

  it("Sin foto ni descripción: inicial, sin texto de descripción y contadores a 0", async () => {
    vi.mocked(fetchMe).mockResolvedValue({
      ...me,
      username: "eva",
      bio: null,
      topicsCount: 0,
      friendsCount: 0,
    });
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderScreen();

    expect(await screen.findByRole("heading", { name: "eva" })).toBeInTheDocument();
    expect(screen.getByTestId("avatar-placeholder")).toHaveTextContent("E");
    expect(screen.queryByText("Opino de cine")).toBeNull();
    expect(screen.getByText("0 temas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0 amigos" })).toBeInTheDocument();
  });

  it("Singular con 1 tema y 1 amigo", async () => {
    vi.mocked(fetchMe).mockResolvedValue({ ...me, topicsCount: 1, friendsCount: 1 });
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderScreen();

    expect(await screen.findByText("1 tema")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 amigo" })).toBeInTheDocument();
  });

  it("«Mis temas» incluye los privados con la etiqueta «Privado»", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({
      items: [topic("t1", "Tema público"), topic("t2", "Tema oculto", "PRIVATE")],
      nextCursor: null,
    });
    renderScreen();

    const section = await screen.findByRole("region", { name: "Mis temas" });
    expect(await screen.findByText("Tema público")).toBeInTheDocument();
    expect(screen.getByText("Tema oculto")).toBeInTheDocument();
    expect(section).toContainElement(screen.getByText("Privado"));
    expect(fetchUserTopicsPage).toHaveBeenCalledWith({
      userId: me.id,
      sort: "recent",
      cursor: undefined,
    });
  });

  it("Sin temas: mensaje propio y enlace para crear uno", async () => {
    vi.mocked(fetchMe).mockResolvedValue({ ...me, topicsCount: 0 });
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderScreen();

    expect(await screen.findByText("Todavía no has creado temas.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear un tema" })).toHaveAttribute(
      "href",
      "/temas/nuevo",
    );
    expect(screen.queryByText("Esta persona todavía no tiene temas.")).toBeNull();
  });

  it("Error al cargar: mensaje y botón para reintentar", async () => {
    vi.mocked(fetchMe).mockRejectedValue(new ApiError(500, "Error interno"));
    renderScreen();

    expect(await screen.findByRole("alert")).toHaveTextContent("No se ha podido cargar tu perfil.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
