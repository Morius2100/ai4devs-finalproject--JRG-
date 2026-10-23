// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { Avatar, placeholderColor } from "@/components/people/Avatar";
import { PeopleScreen } from "@/components/people/PeopleScreen";
import { PersonListItem } from "@/components/people/PersonListItem";
import { fetchPeoplePage } from "@/lib/api/users";
import type { PeoplePage, PersonSummary } from "@/server/services/user-service";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/personas",
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/api/users", () => ({
  fetchPeoplePage: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const friend: PersonSummary = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "bruno",
  avatarUrl: "https://picsum.photos/seed/opina-user-bruno/200",
  isFriend: true,
};
const stranger: PersonSummary = {
  id: "22222222-2222-2222-2222-222222222222",
  username: "carla",
  avatarUrl: null,
  isFriend: false,
};

describe("Avatar", () => {
  it("Persona sin foto: círculo con la inicial en mayúscula", () => {
    render(<Avatar username="carla" avatarUrl={null} size={44} />);

    const placeholder = screen.getByTestId("avatar-placeholder");
    expect(placeholder).toHaveTextContent("C");
    expect(placeholder).toHaveClass("rounded-full");
  });

  it("Persona con foto: imagen circular decorativa, sin marcador", () => {
    const { container } = render(
      <Avatar username="bruno" avatarUrl="https://picsum.photos/seed/x/200" size={44} />,
    );

    expect(screen.queryByTestId("avatar-placeholder")).toBeNull();
    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveClass("rounded-full");
  });

  it("El color del marcador es estable para un mismo nombre", () => {
    expect(placeholderColor("carla")).toBe(placeholderColor("carla"));
    expect(placeholderColor("carla")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("PersonListItem", () => {
  it("Amigo: muestra nombre, etiqueta «Amigo» y enlaza a su perfil", () => {
    render(
      <ul>
        <PersonListItem person={friend} />
      </ul>,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", `/persona?id=${friend.id}`);
    expect(screen.getByText("bruno")).toBeInTheDocument();
    expect(screen.getByText("Amigo")).toBeInTheDocument();
    expect(screen.queryByText("No amigo")).toBeNull();
  });

  it("No amigo: etiqueta «No amigo» y marcador con su inicial", () => {
    render(
      <ul>
        <PersonListItem person={stranger} />
      </ul>,
    );

    expect(screen.getByText("No amigo")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-placeholder")).toHaveTextContent("C");
  });

  it("Área táctil: la tarjeta mide al menos 64 px de alto", () => {
    render(
      <ul>
        <PersonListItem person={stranger} />
      </ul>,
    );

    expect(screen.getByRole("link")).toHaveClass("min-h-16");
  });
});

describe("PeopleScreen", () => {
  const page: PeoplePage = { items: [friend, stranger], nextCursor: null };

  function renderScreen(query: string, firstPage: PeoplePage) {
    searchParams = new URLSearchParams(query ? { q: query } : {});
    vi.mocked(fetchPeoplePage).mockResolvedValue(firstPage);
    return renderWithClient(<PeopleScreen />);
  }

  it("Muestra el buscador de personas y la lista con sus indicadores", async () => {
    renderScreen("", page);

    expect(screen.getByRole("searchbox", { name: "Buscar personas" })).toBeInTheDocument();
    expect(await screen.findAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("Amigo")).toBeInTheDocument();
    expect(screen.getByText("No amigo")).toBeInTheDocument();
  });

  it("Búsqueda compartible: con ?q= el campo muestra el texto", async () => {
    renderScreen("car", { items: [stranger], nextCursor: null });

    expect(screen.getByRole("searchbox", { name: "Buscar personas" })).toHaveValue("car");
    expect(await screen.findAllByRole("link")).toHaveLength(1);
    expect(fetchPeoplePage).toHaveBeenCalledWith({ q: "car", cursor: undefined });
  });

  it("Sin personas: estado vacío", async () => {
    renderScreen("", { items: [], nextCursor: null });

    expect(await screen.findByText("Todavía no hay personas que mostrar.")).toBeInTheDocument();
  });

  it("Sin resultados de búsqueda: mensaje específico", async () => {
    renderScreen("zzz", { items: [], nextCursor: null });

    expect(
      await screen.findByText("No se han encontrado personas con ese texto."),
    ).toBeInTheDocument();
  });
});
