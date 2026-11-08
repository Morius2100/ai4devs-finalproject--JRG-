// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { HomeScreen } from "@/components/topics/HomeScreen";
import { OpinionList } from "@/components/topics/OpinionList";
import { NotificationList } from "@/components/notifications/NotificationList";
import { fetchOpinionsPage, fetchTopicsPage } from "@/lib/api/topics";
import { fetchNotificationsPage } from "@/lib/api/notifications";
import type { NotificationPage } from "@/server/services/notification-service";
import type { OpinionPage } from "@/server/services/vote-service";

// Casos de test derivados de los criterios de aceptación de HU-02 (búsqueda),
// HU-07 (opiniones) y HU-12 (notificaciones), en docs/04-historias-usuario.md.

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));
vi.mock("@/lib/api/topics", () => ({ fetchTopicsPage: vi.fn(), fetchOpinionsPage: vi.fn() }));
vi.mock("@/lib/api/notifications", () => ({ fetchNotificationsPage: vi.fn() }));
vi.mock("@/lib/api/stories", () => ({ fetchStories: vi.fn().mockResolvedValue({ items: [] }) }));

// jsdom no trae IntersectionObserver, que usa la carga continua cuando hay más páginas.
class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  searchParams = new URLSearchParams();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const topic = (id: string, title: string) => ({
  id,
  title,
  imageUrl: null,
  visibility: "PUBLIC" as const,
  totalVotes: 3,
  createdAt: new Date().toISOString(),
  myVote: null,
});

describe("HU-02 · Buscar temas", () => {
  it("CA-02.1 · el buscador está en la parte superior, antes de la lista", async () => {
    vi.mocked(fetchTopicsPage).mockResolvedValue({
      items: [topic("a", "Tema A")],
      nextCursor: null,
    });
    renderWithClient(<HomeScreen />);

    const search = screen.getByRole("searchbox", { name: "Buscar temas" });
    const list = await screen.findByRole("link", { name: /Tema A/ });

    // El buscador precede a la lista en el documento.
    expect(search.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("CA-02.2 · con texto, pide los temas que lo contienen (q) y muestra el resultado", async () => {
    searchParams = new URLSearchParams({ q: "piña" });
    vi.mocked(fetchTopicsPage).mockResolvedValue({
      items: [topic("a", "¿La piña en la pizza?")],
      nextCursor: null,
    });
    renderWithClient(<HomeScreen />);

    expect(await screen.findByText("¿La piña en la pizza?")).toBeInTheDocument();
    expect(fetchTopicsPage).toHaveBeenCalledWith({ q: "piña", cursor: undefined });
  });

  it("CA-02.3 · sin texto, pide las tendencias (sin q)", async () => {
    vi.mocked(fetchTopicsPage).mockResolvedValue({
      items: [topic("a", "Tema A")],
      nextCursor: null,
    });
    renderWithClient(<HomeScreen />);

    await screen.findByText("Tema A");

    expect(fetchTopicsPage).toHaveBeenCalledWith({ q: undefined, cursor: undefined });
  });

  it("CA-02.4 · búsqueda sin resultados: mensaje de «sin resultados»", async () => {
    searchParams = new URLSearchParams({ q: "zzz" });
    vi.mocked(fetchTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderWithClient(<HomeScreen />);

    expect(
      await screen.findByText("No se han encontrado temas con ese texto."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Todavía no hay temas que mostrar.")).toBeNull();
  });

  it("CA-01.5 · sin búsqueda y sin temas: estado vacío de tendencias, no el de búsqueda", async () => {
    vi.mocked(fetchTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderWithClient(<HomeScreen />);

    expect(await screen.findByText("Todavía no hay temas que mostrar.")).toBeInTheDocument();
    expect(screen.queryByText("No se han encontrado temas con ese texto.")).toBeNull();
  });

  it("CA-02.5 · los resultados también son una lista con carga continua (centinela con más páginas)", async () => {
    searchParams = new URLSearchParams({ q: "tema" });
    vi.mocked(fetchTopicsPage).mockResolvedValue({
      items: [topic("a", "Tema A")],
      nextCursor: "siguiente",
    });
    const { container } = renderWithClient(<HomeScreen />);

    await screen.findByText("Tema A");

    expect(container.querySelector("li[aria-hidden]")).not.toBeNull();
  });
});

const opinion = (id: string, username: string, value: "UP" | "DOWN", justification: string) => ({
  id,
  username,
  value,
  justification,
  createdAt: new Date().toISOString(),
});

describe("HU-07 · Opiniones de otros usuarios", () => {
  const TOPIC = "11111111-1111-1111-1111-111111111111";

  it("CA-07.3 · cada opinión muestra el nombre de su autor y su justificación", async () => {
    const page: OpinionPage = {
      items: [opinion("1", "bruno", "UP", "Me encanta"), opinion("2", "carla", "DOWN", "Jamás")],
      nextCursor: null,
    };
    vi.mocked(fetchOpinionsPage).mockResolvedValue(page);
    renderWithClient(<OpinionList topicId={TOPIC} />);

    const first = (await screen.findByText("Me encanta")).closest("li")!;
    const second = screen.getByText("Jamás").closest("li")!;

    expect(within(first).getByText("bruno")).toBeInTheDocument();
    expect(within(second).getByText("carla")).toBeInTheDocument();
  });

  it("CA-07.4 · se muestran en el orden recibido (de más reciente a más antigua)", async () => {
    vi.mocked(fetchOpinionsPage).mockResolvedValue({
      items: [
        opinion("3", "dani", "UP", "La más reciente"),
        opinion("2", "carla", "DOWN", "Intermedia"),
        opinion("1", "bruno", "UP", "La más antigua"),
      ],
      nextCursor: null,
    });
    renderWithClient(<OpinionList topicId={TOPIC} />);

    await screen.findByText("La más reciente");

    const texts = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(texts[0]).toContain("La más reciente");
    expect(texts[1]).toContain("Intermedia");
    expect(texts[2]).toContain("La más antigua");
  });

  it("CA-07.4 · con más páginas deja el centinela de carga continua; sin ellas, no", async () => {
    vi.mocked(fetchOpinionsPage).mockResolvedValue({
      items: [opinion("1", "bruno", "UP", "Una")],
      nextCursor: "mas",
    });
    const withMore = renderWithClient(<OpinionList topicId={TOPIC} />);
    await screen.findByText("Una");
    expect(withMore.container.querySelector("li[aria-hidden]")).not.toBeNull();
    cleanup();

    vi.mocked(fetchOpinionsPage).mockResolvedValue({
      items: [opinion("1", "bruno", "UP", "Una")],
      nextCursor: null,
    });
    const last = renderWithClient(<OpinionList topicId={TOPIC} />);
    await screen.findByText("Una");
    expect(last.container.querySelector("li[aria-hidden]")).toBeNull();
  });

  it("CA-07.5 · si nadie ha comentado, indica que aún no hay opiniones", async () => {
    vi.mocked(fetchOpinionsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderWithClient(<OpinionList topicId={TOPIC} />);

    expect(await screen.findByText("Todavía no hay opiniones.")).toBeInTheDocument();
  });

  it("CA-07.1 · una opinión repetida entre páginas se muestra una sola vez", async () => {
    vi.mocked(fetchOpinionsPage).mockResolvedValue({
      items: [opinion("1", "bruno", "UP", "Duplicada"), opinion("1", "bruno", "UP", "Duplicada")],
      nextCursor: null,
    });
    renderWithClient(<OpinionList topicId={TOPIC} />);

    await screen.findByText("Duplicada");

    expect(screen.getAllByText("Duplicada")).toHaveLength(1);
  });
});

describe("HU-12 · Notificaciones de temas privados", () => {
  const notification = (id: string, actor: string, title: string, topicId: string) => ({
    id,
    type: "PRIVATE_TOPIC_CREATED" as const,
    actor: { username: actor },
    topic: { id: topicId, title },
    createdAt: new Date().toISOString(),
  });

  it("CA-12.2 · muestra el nombre del amigo creador y el título del tema", async () => {
    const page: NotificationPage = {
      items: [notification("n1", "ana", "¿Cena el sábado?", "t1")],
      nextCursor: null,
    };
    vi.mocked(fetchNotificationsPage).mockResolvedValue(page);
    renderWithClient(<NotificationList />);

    const item = (await screen.findByRole("link")).closest("li")!;

    expect(within(item).getByText("ana")).toBeInTheDocument();
    expect(item).toHaveTextContent("ha creado una nueva propuesta: ¿Cena el sábado?");
  });

  it("CA-12.3 · se muestran de más reciente a más antigua, en el orden recibido", async () => {
    vi.mocked(fetchNotificationsPage).mockResolvedValue({
      items: [
        notification("n2", "ana", "Segundo tema", "t2"),
        notification("n1", "bruno", "Primer tema", "t1"),
      ],
      nextCursor: null,
    });
    renderWithClient(<NotificationList />);

    const links = await screen.findAllByRole("link");

    expect(links[0]).toHaveTextContent("Segundo tema");
    expect(links[1]).toHaveTextContent("Primer tema");
  });

  it("CA-12.4 · al pulsar una notificación se entra en el tema privado", async () => {
    vi.mocked(fetchNotificationsPage).mockResolvedValue({
      items: [notification("n1", "ana", "Privado", "22222222-2222-2222-2222-222222222222")],
      nextCursor: null,
    });
    renderWithClient(<NotificationList />);

    const link = await screen.findByRole("link");

    expect(link).toHaveAttribute("href", "/tema?id=22222222-2222-2222-2222-222222222222");
  });

  it("CA-12.1 · sin notificaciones: lo indica", async () => {
    vi.mocked(fetchNotificationsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderWithClient(<NotificationList />);

    expect(await screen.findByText("Todavía no tienes notificaciones.")).toBeInTheDocument();
  });

  it("CA-12.3 · si falla la carga, avisa con un mensaje accesible", async () => {
    vi.mocked(fetchNotificationsPage).mockRejectedValue(new Error("red caída"));
    renderWithClient(<NotificationList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se han podido cargar las notificaciones.",
    );
  });
});
