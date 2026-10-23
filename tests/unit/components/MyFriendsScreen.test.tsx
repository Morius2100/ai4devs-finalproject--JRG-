// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FriendToggle } from "@/components/people/FriendToggle";
import { MyFriendsScreen } from "@/components/people/MyFriendsScreen";
import { fetchMyFriends } from "@/lib/api/me";
import { setFriendship } from "@/lib/api/users";
import type { PersonSummary } from "@/server/services/user-service";

vi.mock("@/lib/api/me", () => ({ fetchMyFriends: vi.fn() }));
vi.mock("@/lib/api/users", () => ({ setFriendship: vi.fn(), fetchUserTopicsPage: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const friend = (username: string): PersonSummary => ({
  id: `id-${username}`,
  username,
  avatarUrl: null,
  isFriend: true,
});

function renderWithClient(ui: React.ReactElement, client?: QueryClient) {
  const queryClient = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("MyFriendsScreen (TKT-063)", () => {
  it("Lista los amigos en el orden recibido, con indicador y enlace a su perfil", async () => {
    vi.mocked(fetchMyFriends).mockResolvedValue({
      items: [friend("bruno"), friend("carla")],
      nextCursor: null,
    });
    renderWithClient(<MyFriendsScreen />);

    expect(screen.getByRole("heading", { name: "Amigos" })).toBeInTheDocument();
    const links = await screen.findAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/persona?id=id-bruno",
      "/persona?id=id-carla",
    ]);
    expect(screen.getAllByText("Amigo")).toHaveLength(2);
  });

  it("Sin amigos: mensaje y enlace a Personas", async () => {
    vi.mocked(fetchMyFriends).mockResolvedValue({ items: [], nextCursor: null });
    renderWithClient(<MyFriendsScreen />);

    expect(await screen.findByText("Todavía no tienes amigos.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buscar personas" })).toHaveAttribute(
      "href",
      "/personas",
    );
  });

  it("Con más páginas muestra el centinela de carga; sin ellas, no", async () => {
    // jsdom no trae IntersectionObserver, que usa el centinela de scroll infinito.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.mocked(fetchMyFriends).mockResolvedValue({ items: [friend("bruno")], nextCursor: "c1" });
    const { container, unmount } = renderWithClient(<MyFriendsScreen />);
    await screen.findByText("bruno");
    expect(container.querySelector("li[aria-hidden]")).not.toBeNull();
    unmount();

    vi.mocked(fetchMyFriends).mockResolvedValue({ items: [friend("bruno")], nextCursor: null });
    const second = renderWithClient(<MyFriendsScreen />);
    await screen.findByText("bruno");
    expect(second.container.querySelector("li[aria-hidden]")).toBeNull();
  });

  it("Error al cargar: mensaje de error", async () => {
    vi.mocked(fetchMyFriends).mockRejectedValue(new Error("fallo"));
    renderWithClient(<MyFriendsScreen />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se han podido cargar tus amigos.",
    );
  });
});

describe("FriendToggle e invalidación de Mi perfil (TKT-063)", () => {
  it("Al cambiar la amistad invalida mi perfil, mi lista de amigos y las historias", async () => {
    vi.mocked(setFriendship).mockResolvedValue({ isFriend: true });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(client, "invalidateQueries");
    renderWithClient(<FriendToggle userId="u1" initialIsFriend={false} />, client);

    fireEvent.click(screen.getByRole("button", { name: "Añadir a amigos" }));

    await waitFor(() => {
      const keys = spy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
      expect(keys).toEqual(
        expect.arrayContaining([
          JSON.stringify(["me"]),
          JSON.stringify(["my-friends"]),
          JSON.stringify(["stories"]),
        ]),
      );
    });
  });
});
