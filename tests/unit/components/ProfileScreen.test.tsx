// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { FriendToggle } from "@/components/people/FriendToggle";
import { ProfileHeader } from "@/components/people/ProfileHeader";
import { ProfileScreen } from "@/components/people/ProfileScreen";
import { SortSelector } from "@/components/people/SortSelector";
import { fetchUserTopicsPage, setFriendship } from "@/lib/api/users";
import type { TopicPage, TopicSummary } from "@/server/services/topic-service";
import type { UserProfile } from "@/server/services/user-service";

vi.mock("@/lib/api/users", () => ({
  fetchUserTopicsPage: vi.fn(),
  setFriendship: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const USER_ID = "33333333-3333-3333-3333-333333333333";

const topic = (id: string, title: string, totalVotes: number): TopicSummary => ({
  id,
  title,
  imageUrl: null,
  visibility: "PUBLIC",
  totalVotes,
  createdAt: new Date().toISOString(),
  myVote: null,
});

const profile: UserProfile = {
  id: USER_ID,
  username: "bruno",
  avatarUrl: null,
  bio: "Me encanta debatir",
  isFriend: false,
  isSelf: false,
};

describe("ProfileHeader", () => {
  it("Perfil completo: nombre, descripción y foto", () => {
    const { container } = render(
      <ProfileHeader
        profile={{
          username: "bruno",
          avatarUrl: "https://picsum.photos/seed/x/200",
          bio: "Me encanta debatir",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "bruno" })).toBeInTheDocument();
    expect(screen.getByText("Me encanta debatir")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("Perfil sin foto ni descripción: inicial y nombre, sin texto de descripción", () => {
    render(<ProfileHeader profile={{ username: "dani", avatarUrl: null, bio: null }} />);

    expect(screen.getByTestId("avatar-placeholder")).toHaveTextContent("D");
    expect(screen.getByRole("heading", { name: "dani" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Perfil" }).querySelector("p")).toBeNull();
  });
});

describe("FriendToggle", () => {
  it("Perfil de un amigo: «Amigos» con aria-pressed verdadero", () => {
    renderWithClient(<FriendToggle userId={USER_ID} initialIsFriend />);

    expect(screen.getByRole("button", { name: "Amigos" })).toHaveAttribute("aria-pressed", "true");
  });

  it("Perfil de alguien que no es amigo: «Añadir a amigos» con aria-pressed falso", () => {
    renderWithClient(<FriendToggle userId={USER_ID} initialIsFriend={false} />);

    expect(screen.getByRole("button", { name: "Añadir a amigos" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Añadir: cambia al instante, bloquea el botón mientras se envía y llama con PUT", async () => {
    let resolve!: (value: { isFriend: boolean }) => void;
    vi.mocked(setFriendship).mockReturnValue(new Promise((r) => (resolve = r)));
    renderWithClient(<FriendToggle userId={USER_ID} initialIsFriend={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Añadir a amigos" }));

    const button = await screen.findByRole("button", { name: "Amigos" });
    expect(button).toBeDisabled();
    expect(setFriendship).toHaveBeenCalledWith({ userId: USER_ID, friend: true });

    resolve({ isFriend: true });
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("Quitar: pulsar «Amigos» pide quitar la amistad", async () => {
    vi.mocked(setFriendship).mockResolvedValue({ isFriend: false });
    renderWithClient(<FriendToggle userId={USER_ID} initialIsFriend />);

    fireEvent.click(screen.getByRole("button", { name: "Amigos" }));

    expect(await screen.findByRole("button", { name: "Añadir a amigos" })).toBeInTheDocument();
    expect(setFriendship).toHaveBeenCalledWith({ userId: USER_ID, friend: false });
  });

  it("Fallo de red: revierte el estado y muestra el error", async () => {
    vi.mocked(setFriendship).mockRejectedValue(new Error("red caída"));
    renderWithClient(<FriendToggle userId={USER_ID} initialIsFriend={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Añadir a amigos" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se ha podido actualizar la amistad",
    );
    expect(screen.getByRole("button", { name: "Añadir a amigos" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("SortSelector", () => {
  it("Marca con aria-pressed la opción activa y avisa del cambio", () => {
    const onChange = vi.fn();
    render(<SortSelector value="recent" onChange={onChange} />);

    expect(screen.getByRole("group", { name: "Ordenar temas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más recientes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const top = screen.getByRole("button", { name: "Más puntuados" });
    expect(top).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(top);
    expect(onChange).toHaveBeenCalledWith("top");
  });
});

describe("ProfileScreen", () => {
  const initialTopics: TopicPage = {
    items: [topic("a", "Tema reciente", 5), topic("b", "Tema antiguo", 50)],
    nextCursor: null,
  };

  it("Muestra cabecera, check de amistad, selector de orden y los temas", async () => {
    vi.mocked(fetchUserTopicsPage).mockResolvedValue(initialTopics);
    renderWithClient(<ProfileScreen profile={profile} />);

    expect(screen.getByRole("heading", { name: "bruno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Añadir a amigos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Temas de bruno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más recientes" })).toBeInTheDocument();
    expect(await screen.findByText("Tema reciente")).toBeInTheDocument();
    expect(screen.getByText("Tema antiguo")).toBeInTheDocument();
    expect(fetchUserTopicsPage).toHaveBeenCalledWith({
      userId: USER_ID,
      sort: "recent",
      cursor: undefined,
    });
  });

  it("Propio perfil: sin botón de amistad", () => {
    vi.mocked(fetchUserTopicsPage).mockResolvedValue(initialTopics);
    renderWithClient(<ProfileScreen profile={{ ...profile, isSelf: true }} />);

    expect(screen.queryByRole("button", { name: /amigos/i })).toBeNull();
  });

  it("Persona sin temas: lo indica", async () => {
    vi.mocked(fetchUserTopicsPage).mockResolvedValue({ items: [], nextCursor: null });
    renderWithClient(<ProfileScreen profile={profile} />);

    expect(await screen.findByText("Esta persona todavía no tiene temas.")).toBeInTheDocument();
  });

  it("Más puntuados: pide los temas en ese orden y reemplaza la lista", async () => {
    vi.mocked(fetchUserTopicsPage).mockImplementation(async ({ sort }) =>
      sort === "top"
        ? {
            items: [topic("b", "Tema antiguo", 50), topic("a", "Tema reciente", 5)],
            nextCursor: null,
          }
        : initialTopics,
    );
    renderWithClient(<ProfileScreen profile={profile} />);
    await screen.findByText("Tema reciente");

    fireEvent.click(screen.getByRole("button", { name: "Más puntuados" }));

    await waitFor(() =>
      expect(fetchUserTopicsPage).toHaveBeenCalledWith({
        userId: USER_ID,
        sort: "top",
        cursor: undefined,
      }),
    );
    await waitFor(() => {
      const titles = screen.getAllByRole("link").map((link) => link.textContent);
      expect(titles[0]).toContain("Tema antiguo");
    });
    expect(screen.getByRole("button", { name: "Más puntuados" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
