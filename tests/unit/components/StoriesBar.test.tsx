// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { HomeScreen } from "@/components/topics/HomeScreen";
import { StoriesBar } from "@/components/topics/StoriesBar";
import { fetchStories } from "@/lib/api/stories";
import type { Story } from "@/server/services/story-service";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));
vi.mock("@/lib/api/stories", () => ({ fetchStories: vi.fn() }));
vi.mock("@/lib/api/topics", () => ({
  fetchTopicsPage: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const story = (username: string, topicIds: string[], avatarUrl: string | null = null): Story => ({
  author: { id: `id-${username}`, username, avatarUrl },
  topicIds,
  latestCreatedAt: new Date().toISOString(),
});

describe("StoriesBar (TKT-057)", () => {
  it("Una burbuja con foto, nombre y nombre accesible «Nuevo tema de …»", async () => {
    vi.mocked(fetchStories).mockResolvedValue({
      items: [story("bruno", ["t1"], "https://picsum.photos/seed/bruno/200")],
    });
    const { container } = renderWithClient(<StoriesBar />);

    const link = await screen.findByRole("link", { name: "Nuevo tema de bruno" });
    expect(link).toHaveAttribute("href", "/tema?id=t1");
    expect(link).toHaveTextContent("bruno");
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("Sin foto: círculo con la inicial", async () => {
    vi.mocked(fetchStories).mockResolvedValue({ items: [story("carla", ["t1"])] });
    renderWithClient(<StoriesBar />);

    await screen.findByRole("link", { name: "Nuevo tema de carla" });
    expect(screen.getByTestId("avatar-placeholder")).toHaveTextContent("C");
  });

  it("Varios temas pendientes: contador y enlace al más antiguo (el primero)", async () => {
    vi.mocked(fetchStories).mockResolvedValue({ items: [story("carla", ["t1", "t2", "t3"])] });
    renderWithClient(<StoriesBar />);

    const link = await screen.findByRole("link", { name: "3 temas nuevos de carla" });
    expect(link).toHaveAttribute("href", "/tema?id=t1");
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("Un solo tema pendiente: sin contador", async () => {
    vi.mocked(fetchStories).mockResolvedValue({ items: [story("bruno", ["t1"])] });
    renderWithClient(<StoriesBar />);

    await screen.findByRole("link", { name: "Nuevo tema de bruno" });
    expect(screen.queryByText("1")).toBeNull();
  });

  it("Respeta el orden recibido y la fila tiene su nombre accesible", async () => {
    vi.mocked(fetchStories).mockResolvedValue({
      items: [story("carla", ["a"]), story("bruno", ["b"]), story("dani", ["c"])],
    });
    renderWithClient(<StoriesBar />);

    await screen.findByRole("navigation", { name: "Historias de tus amigos" });
    expect(screen.getAllByRole("link").map((l) => l.getAttribute("aria-label"))).toEqual([
      "Nuevo tema de carla",
      "Nuevo tema de bruno",
      "Nuevo tema de dani",
    ]);
  });

  it("Sin historias no pinta nada ni deja hueco", async () => {
    vi.mocked(fetchStories).mockResolvedValue({ items: [] });
    const { container } = renderWithClient(<StoriesBar />);

    await vi.waitFor(() => expect(fetchStories).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("Si la petición falla no muestra nada", async () => {
    vi.mocked(fetchStories).mockRejectedValue(new Error("fallo"));
    const { container } = renderWithClient(<StoriesBar />);

    await vi.waitFor(() => expect(fetchStories).toHaveBeenCalled());
    expect(container.querySelector("nav")).toBeNull();
  });
});

describe("HomeScreen e historias (TKT-057)", () => {
  it("Sin búsqueda: muestra las burbujas entre el buscador y la lista", async () => {
    vi.mocked(fetchStories).mockResolvedValue({ items: [story("bruno", ["t1"])] });
    renderWithClient(<HomeScreen />);

    expect(
      await screen.findByRole("navigation", { name: "Historias de tus amigos" }),
    ).toBeVisible();
    expect(fetchStories).toHaveBeenCalledOnce();
  });

  it("Con búsqueda activa: oculta la fila y no pide las historias", async () => {
    searchParams = new URLSearchParams({ q: "pizza" });
    vi.mocked(fetchStories).mockResolvedValue({ items: [story("bruno", ["t1"])] });
    renderWithClient(<HomeScreen />);

    expect(screen.getByRole("searchbox", { name: "Buscar temas" })).toHaveValue("pizza");
    expect(screen.queryByRole("navigation", { name: "Historias de tus amigos" })).toBeNull();
    expect(fetchStories).not.toHaveBeenCalled();
  });
});
