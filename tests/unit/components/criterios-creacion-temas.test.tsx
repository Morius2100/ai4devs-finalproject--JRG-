// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateTopicPage from "@/app/(main)/temas/nuevo/page";
import { ApiError, createTopic } from "@/lib/api/topics";

// Casos de test derivados de los criterios de aceptación de HU-08, HU-09 y HU-10
// (docs/04-historias-usuario.md): crear un tema público o privado, con imagen opcional.

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/lib/api/topics", async (original) => ({
  ...(await original<typeof import("@/lib/api/topics")>()),
  createTopic: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(createTopic).mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CreateTopicPage />
    </QueryClientProvider>,
  );
}

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Crear tema" }));
const typeTitle = (value: string) =>
  fireEvent.change(screen.getByLabelText("Título"), { target: { value } });

function sentForm(): FormData {
  const call = vi.mocked(createTopic).mock.calls[0];
  return call[0] as FormData;
}

describe("HU-08 · Crear un tema público", () => {
  it("CA-08.2 · el formulario pide título y visibilidad, con «Público» marcado por defecto", () => {
    renderPage();

    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(screen.getByLabelText("Público")).toBeChecked();
    expect(screen.getByLabelText("Privado")).not.toBeChecked();
  });

  it("CA-08.3 · un tema público válido se crea y lleva a la pantalla del tema", async () => {
    vi.mocked(createTopic).mockResolvedValue({ id: "22222222-2222-2222-2222-222222222222" });
    renderPage();

    typeTitle("¿Piña en la pizza?");
    submit();

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/tema?id=22222222-2222-2222-2222-222222222222"),
    );
    expect(sentForm().get("title")).toBe("¿Piña en la pizza?");
    expect(sentForm().get("visibility")).toBe("PUBLIC");
  });

  it.each([
    ["vacío", ""],
    ["de 2 caracteres", "ab"],
    ["de 121 caracteres", "a".repeat(121)],
  ])(
    "CA-08.2 / CA-08.4 · título %s: muestra el error y no se crea el tema",
    async (_name, title) => {
      renderPage();

      typeTitle(title);
      submit();

      await waitFor(() => expect(document.querySelector("[role=alert], p.text-red-600")).not.toBeNull());
      expect(createTopic).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["de 3 caracteres", "abc"],
    ["de 120 caracteres", "a".repeat(120)],
  ])("CA-08.2 · título %s (límite válido): se acepta", async (_name, title) => {
    vi.mocked(createTopic).mockResolvedValue({ id: "id" });
    renderPage();

    typeTitle(title);
    submit();

    await waitFor(() => expect(createTopic).toHaveBeenCalled());
  });

  it("CA-08.4 · si el servidor rechaza el título, muestra su error y no navega", async () => {
    vi.mocked(createTopic).mockRejectedValue(
      new ApiError(400, "Datos inválidos", "VALIDATION_ERROR", {
        title: ["El título es demasiado corto"],
      }),
    );
    renderPage();

    typeTitle("¿Válido en cliente?");
    submit();

    expect(await screen.findByText("El título es demasiado corto")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("HU-09 · Adjuntar una imagen al tema", () => {
  it("CA-09.1 · la imagen es opcional y solo admite JPEG, PNG o WebP", () => {
    renderPage();

    const input = screen.getByLabelText(/Imagen/) as HTMLInputElement;

    expect(input.type).toBe("file");
    expect(input.required).toBe(false);
    expect(input.accept).toBe("image/jpeg,image/png,image/webp");
  });

  it("CA-09.1 · sin imagen no se envía ningún archivo", async () => {
    vi.mocked(createTopic).mockResolvedValue({ id: "id" });
    renderPage();

    typeTitle("Sin imagen");
    submit();

    await waitFor(() => expect(createTopic).toHaveBeenCalled());
    const image = sentForm().get("image");
    expect(image === null || (image instanceof File && image.size === 0)).toBe(true);
  });

  it("CA-09.2 · con imagen, se envía junto al título", async () => {
    vi.mocked(createTopic).mockResolvedValue({ id: "id" });
    renderPage();
    const file = new File([new Uint8Array([1, 2, 3])], "foto.png", { type: "image/png" });

    typeTitle("Con imagen");
    fireEvent.change(screen.getByLabelText(/Imagen/), { target: { files: [file] } });
    submit();

    await waitFor(() => expect(createTopic).toHaveBeenCalled());
    expect((sentForm().get("image") as File).name).toBe("foto.png");
  });

  it.each([
    [413, "El archivo supera el tamaño máximo permitido"],
    [415, "El tipo de archivo no está soportado"],
  ])(
    "CA-09.3 · el servidor responde %s: muestra el mensaje junto a la imagen y no navega",
    async (status, message) => {
      vi.mocked(createTopic).mockRejectedValue(new ApiError(status, message));
      renderPage();

      typeTitle("Imagen no válida");
      submit();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    },
  );
});

describe("HU-10 · Crear un tema privado", () => {
  it("CA-10.1 · el formulario permite elegir «Privado» y envía esa visibilidad", async () => {
    vi.mocked(createTopic).mockResolvedValue({ id: "33333333-3333-3333-3333-333333333333" });
    renderPage();

    typeTitle("¿Cena el sábado?");
    fireEvent.click(screen.getByLabelText("Privado"));
    submit();

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/tema?id=33333333-3333-3333-3333-333333333333"),
    );
    expect(sentForm().get("visibility")).toBe("PRIVATE");
  });

  it("CA-10.3 · tras crear el tema privado, lleva a su pantalla", async () => {
    vi.mocked(createTopic).mockResolvedValue({ id: "44444444-4444-4444-4444-444444444444" });
    renderPage();

    typeTitle("Privado");
    fireEvent.click(screen.getByLabelText("Privado"));
    submit();

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push.mock.calls[0][0]).toBe("/tema?id=44444444-4444-4444-4444-444444444444");
  });
});
