// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditProfileScreen } from "@/components/people/EditProfileScreen";
import { ApiError } from "@/lib/api/http";
import { fetchMe, updateMe } from "@/lib/api/me";
import type { OwnProfile } from "@/server/services/user-service";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/me", async (original) => ({
  ...(await original<typeof import("@/lib/api/me")>()),
  fetchMe: vi.fn(),
  updateMe: vi.fn(),
}));

const me: OwnProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "ana",
  avatarUrl: "https://picsum.photos/seed/ana/200",
  bio: "Opino de cine",
  topicsCount: 3,
  friendsCount: 2,
};

beforeEach(() => {
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: () => "blob:preview", revokeObjectURL: () => {} }),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderScreen(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <QueryClientProvider client={client}>
      <EditProfileScreen />
    </QueryClientProvider>,
  );
  return client;
}

const png = () => new File(["x"], "foto.png", { type: "image/png" });

describe("EditProfileScreen (TKT-064)", () => {
  it("Carga mis datos: descripción actual y contador de caracteres restantes", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    renderScreen();

    expect(await screen.findByLabelText("Descripción")).toHaveValue("Opino de cine");
    expect(
      screen.getByText(`${160 - "Opino de cine".length} caracteres restantes`),
    ).toBeInTheDocument();
  });

  it("El contador baja al escribir y la descripción no admite más de 160", async () => {
    vi.mocked(fetchMe).mockResolvedValue({ ...me, bio: null });
    renderScreen();

    const bio = await screen.findByLabelText("Descripción");
    expect(bio).toHaveAttribute("maxLength", "160");
    expect(screen.getByText("160 caracteres restantes")).toBeInTheDocument();

    fireEvent.change(bio, { target: { value: "a".repeat(159) } });
    expect(screen.getByText("1 carácter restante")).toBeInTheDocument();

    fireEvent.change(bio, { target: { value: "a".repeat(160) } });
    expect(screen.getByText("0 caracteres restantes")).toBeInTheDocument();
  });

  it("Elegir una foto muestra la vista previa", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    renderScreen();

    await userEvent.upload(await screen.findByLabelText("Cambiar foto"), png());

    expect(
      await screen.findByRole("img", { name: "Vista previa de la nueva foto" }),
    ).toHaveAttribute("src", "blob:preview");
  });

  it("«Quitar foto» solo aparece si hay foto", async () => {
    vi.mocked(fetchMe).mockResolvedValue({ ...me, avatarUrl: null });
    renderScreen();
    await screen.findByLabelText("Descripción");
    expect(screen.queryByRole("button", { name: "Quitar foto" })).toBeNull();

    // Con una foto elegida sí aparece.
    await userEvent.upload(screen.getByLabelText("Cambiar foto"), png());
    expect(await screen.findByRole("button", { name: "Quitar foto" })).toBeInTheDocument();
  });

  it("«Quitar foto» con foto actual muestra la inicial y la oculta después", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    renderScreen();

    await userEvent.click(await screen.findByRole("button", { name: "Quitar foto" }));

    expect(screen.getByTestId("avatar-placeholder")).toHaveTextContent("A");
    expect(screen.queryByRole("button", { name: "Quitar foto" })).toBeNull();
  });

  it("Guardar envía descripción y foto juntas, invalida cachés y vuelve a /perfil", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    vi.mocked(updateMe).mockResolvedValue(me);
    const client = renderScreen();
    const spy = vi.spyOn(client, "invalidateQueries");

    const bio = await screen.findByLabelText("Descripción");
    fireEvent.change(bio, { target: { value: "Cinéfila" } });
    await userEvent.upload(screen.getByLabelText("Cambiar foto"), png());
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/perfil"));
    const sent = vi.mocked(updateMe).mock.calls[0][0];
    expect(sent.get("bio")).toBe("Cinéfila");
    expect((sent.get("avatar") as File).name).toBe("foto.png");
    expect(sent.has("removeAvatar")).toBe(false);
    const keys = spy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toEqual(
      expect.arrayContaining(["me", "profile", "users", "stories"].map((k) => JSON.stringify([k]))),
    );
  });

  it("Quitar la foto y guardar envía removeAvatar", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    vi.mocked(updateMe).mockResolvedValue({ ...me, avatarUrl: null });
    renderScreen();

    await userEvent.click(await screen.findByRole("button", { name: "Quitar foto" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateMe).toHaveBeenCalled());
    const sent = vi.mocked(updateMe).mock.calls[0][0];
    expect(sent.get("removeAvatar")).toBe("true");
    expect(sent.has("avatar")).toBe(false);
  });

  it("Error 415: el mensaje aparece junto a la foto y no se navega ni se pierde lo escrito", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    vi.mocked(updateMe).mockRejectedValue(
      new ApiError(415, "Solo se permiten imágenes JPEG, PNG o WebP"),
    );
    renderScreen();

    const bio = await screen.findByLabelText("Descripción");
    fireEvent.change(bio, { target: { value: "Texto nuevo" } });
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Solo se permiten imágenes JPEG, PNG o WebP");
    expect(screen.getByRole("region", { name: "Foto de perfil" })).toContainElement(alert);
    expect(push).not.toHaveBeenCalled();
    expect(bio).toHaveValue("Texto nuevo");
  });

  it("Error 400 de la descripción: el mensaje aparece junto a su campo", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    vi.mocked(updateMe).mockRejectedValue(
      new ApiError(400, "Datos de perfil inválidos", "VALIDATION_ERROR", {
        bio: ["La descripción no puede superar los 160 caracteres"],
      }),
    );
    renderScreen();

    await userEvent.click(await screen.findByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La descripción no puede superar los 160 caracteres",
    );
  });

  it("«Cancelar» vuelve a /perfil sin llamar a la API", async () => {
    vi.mocked(fetchMe).mockResolvedValue(me);
    renderScreen();

    const cancel = await screen.findByRole("link", { name: "Cancelar" });
    expect(cancel).toHaveAttribute("href", "/perfil");
    expect(updateMe).not.toHaveBeenCalled();
  });
});
