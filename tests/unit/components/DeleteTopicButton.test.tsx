// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { TopicView } from "@/components/topics/TopicView";
import { ApiError, deleteTopic } from "@/lib/api/topics";
import type { TopicDetail } from "@/server/services/topic-service";

// Botón de papelera y confirmación (HU-23, TKT-088/TKT-089).

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/api/topics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/topics")>();
  return { ...actual, deleteTopic: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const TOPIC_ID = "11111111-1111-1111-1111-111111111111";

function makeTopic(overrides: Partial<TopicDetail> = {}): TopicDetail {
  return {
    id: TOPIC_ID,
    title: "¿Piña en la pizza?",
    imageUrl: null,
    visibility: "PUBLIC",
    myVote: null,
    isAuthor: true,
    ...overrides,
  };
}

function renderTopic(topic: TopicDetail, client?: QueryClient) {
  const queryClient = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <TopicView topic={topic} />
    </QueryClientProvider>
  );
  return { queryClient, ...render(ui) };
}

function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Borrar tema" }));
  return screen.getByRole("alertdialog");
}

describe("HU-23 · Botón de papelera solo para el autor", () => {
  it("El autor ve el botón «Borrar tema»", () => {
    renderTopic(makeTopic({ isAuthor: true }));

    expect(screen.getByRole("button", { name: "Borrar tema" })).toBeInTheDocument();
  });

  it("Otra persona no ve el botón", () => {
    renderTopic(makeTopic({ isAuthor: false }));

    expect(screen.queryByRole("button", { name: "Borrar tema" })).toBeNull();
  });

  it("El botón está junto al título, fuera de la imagen, con y sin imagen", () => {
    for (const imageUrl of [null, "https://picsum.photos/seed/topic/800/600"]) {
      const { unmount } = renderTopic(makeTopic({ imageUrl }));
      const button = screen.getByRole("button", { name: "Borrar tema" });
      const heading = screen.getByRole("heading", { level: 1 });

      expect(button.parentElement).toBe(heading.parentElement);
      expect(screen.queryByRole("img")?.contains(button) ?? false).toBe(false);
      unmount();
    }
  });

  it("El botón es circular y de al menos 44 px, con un icono decorativo", () => {
    renderTopic(makeTopic());
    const button = screen.getByRole("button", { name: "Borrar tema" });

    expect(button.className).toContain("h-11");
    expect(button.className).toContain("w-11");
    expect(button.className).toContain("rounded-full");
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("HU-23 · Confirmación antes de borrar", () => {
  it("Al pulsar la papelera aparece el diálogo con el aviso y no se borra nada", () => {
    renderTopic(makeTopic());

    const dialog = openDialog();

    expect(dialog).toHaveTextContent("¿Borrar este tema?");
    expect(dialog).toHaveTextContent("Se borrarán también sus votos y opiniones");
    expect(dialog).toHaveTextContent("No se puede deshacer");
    expect(deleteTopic).not.toHaveBeenCalled();
  });

  it("El diálogo es accesible: alertdialog, foco inicial en «Cancelar» y foco atrapado", () => {
    renderTopic(makeTopic());
    const dialog = openDialog();
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: "Borrar" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("¿Borrar este tema?");
    expect(cancel).toHaveFocus();

    confirm.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
  });

  it("«Cancelar» cierra el diálogo, no borra y devuelve el foco a la papelera", () => {
    renderTopic(makeTopic());
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(deleteTopic).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Borrar tema" })).toHaveFocus();
  });

  it("«Esc» cierra el diálogo sin borrar", () => {
    renderTopic(makeTopic());
    openDialog();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(deleteTopic).not.toHaveBeenCalled();
  });
});

describe("HU-23 · Borrar y volver a temas", () => {
  it("«Borrar» llama a la API con el id del tema y vuelve a la pantalla de temas", async () => {
    vi.mocked(deleteTopic).mockResolvedValue(undefined);
    renderTopic(makeTopic());
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(deleteTopic).toHaveBeenCalledWith(TOPIC_ID);
  });

  it("Mientras borra, los botones se bloquean y se lee «Borrando…»", async () => {
    vi.mocked(deleteTopic).mockReturnValue(new Promise(() => {}));
    renderTopic(makeTopic());
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    expect(await screen.findByRole("button", { name: "Borrando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("Tras borrar se invalidan tendencias, perfiles, historias y notificaciones", async () => {
    vi.mocked(deleteTopic).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    renderTopic(makeTopic(), queryClient);
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toEqual(
      expect.arrayContaining([
        JSON.stringify(["topic", TOPIC_ID]),
        JSON.stringify(["topics"]),
        JSON.stringify(["user-topics"]),
        JSON.stringify(["stories"]),
        JSON.stringify(["notifications"]),
      ]),
    );
  });

  it("Si la API responde 404 (ya borrado) se trata como borrado y se vuelve a temas", async () => {
    vi.mocked(deleteTopic).mockRejectedValue(new ApiError(404, "Tema no encontrado"));
    renderTopic(makeTopic());
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("Si falla (500), el diálogo sigue abierto con el error y se puede reintentar o cancelar", async () => {
    vi.mocked(deleteTopic).mockRejectedValue(new ApiError(500, "Error del servidor"));
    renderTopic(makeTopic());
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Error del servidor");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("Un error de red muestra un mensaje genérico y mantiene el diálogo", async () => {
    vi.mocked(deleteTopic).mockRejectedValue(new TypeError("Failed to fetch"));
    renderTopic(makeTopic());
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "Borrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se ha podido borrar el tema");
    expect(replace).not.toHaveBeenCalled();
  });
});
