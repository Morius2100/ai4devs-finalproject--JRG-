// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { TopicView } from "@/components/topics/TopicView";
import { ApiError, castVote, fetchOpinionsPage, fetchTopicDetail } from "@/lib/api/topics";
import type { TopicDetail } from "@/server/services/topic-service";

// Casos de test derivados de los criterios de aceptación de HU-03 a HU-06
// (docs/04-historias-usuario.md): entrar en un tema, votar, justificar y ver resultados.

vi.mock("@/lib/api/topics", async (original) => ({
  ...(await original<typeof import("@/lib/api/topics")>()),
  castVote: vi.fn(),
  fetchTopicDetail: vi.fn(),
  fetchOpinionsPage: vi.fn(),
}));

class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.mocked(fetchOpinionsPage).mockResolvedValue({ items: [], nextCursor: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const TOPIC_ID = "11111111-1111-1111-1111-111111111111";

function makeTopic(overrides: Partial<TopicDetail> = {}): TopicDetail {
  return {
    id: TOPIC_ID,
    title: "¿Piña en la pizza?",
    imageUrl: null,
    visibility: "PUBLIC",
    myVote: null,
    isAuthor: false,
    ...overrides,
  };
}

describe("HU-03 · Entrar en un tema", () => {
  it("CA-03.1 · muestra el título del tema", () => {
    renderWithClient(<TopicView topic={makeTopic()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "¿Piña en la pizza?" }),
    ).toBeInTheDocument();
  });

  it("CA-03.2 · con imagen, la muestra en la parte superior, antes del título", () => {
    renderWithClient(
      <TopicView topic={makeTopic({ imageUrl: "https://picsum.photos/seed/t/800/600" })} />,
    );

    const image = screen.getByRole("img", { name: "¿Piña en la pizza?" });
    const title = screen.getByRole("heading", { level: 1 });
    expect(image.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("CA-03.3 · sin imagen no reserva espacio de imagen", () => {
    const { container } = renderWithClient(<TopicView topic={makeTopic()} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".h-\\[50dvh\\]")).toBeNull();
  });

  it("CA-03.4 · sin votar, muestra los botones de pulgar arriba (verde) y pulgar abajo (rojo)", () => {
    renderWithClient(<TopicView topic={makeTopic()} />);

    const up = screen.getByRole("button", { name: "Votar a favor" });
    const down = screen.getByRole("button", { name: "Votar en contra" });
    expect(up.className).toMatch(/green/);
    expect(down.className).toMatch(/red/);
  });

  it("CA-03.5 · si ya votó, en lugar de los botones muestra los resultados", () => {
    renderWithClient(
      <TopicView
        topic={makeTopic({ myVote: "UP", results: { positiveVotes: 3, negativeVotes: 1 } })}
      />,
    );

    expect(screen.queryByRole("button", { name: "Votar a favor" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Votar en contra" })).toBeNull();
    expect(screen.getByText("Resultados")).toBeInTheDocument();
  });
});

describe("HU-04 / HU-05 · Votar con justificación opcional", () => {
  it("CA-04.1 / CA-05.1 · al pulsar un botón se abre la solicitud de justificación con un campo de texto", () => {
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar en contra" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("textbox", { name: "Justificación" })).toBeInTheDocument();
    expect(castVote).not.toHaveBeenCalled();
  });

  it("CA-04.4 · cancelar no registra el voto y siguen visibles los dos botones", () => {
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(castVote).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Votar a favor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Votar en contra" })).toBeInTheDocument();
  });

  it("CA-05.2 · se puede confirmar el voto con el campo vacío", async () => {
    vi.mocked(castVote).mockResolvedValue({ positiveVotes: 1, negativeVotes: 0, myVote: "UP" });
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Votar" }));

    await waitFor(() =>
      expect(castVote).toHaveBeenCalledWith({ topicId: TOPIC_ID, value: "UP", justification: "" }),
    );
  });

  it("CA-05.3 · se puede confirmar con una justificación de hasta 500 caracteres", async () => {
    vi.mocked(castVote).mockResolvedValue({ positiveVotes: 0, negativeVotes: 1, myVote: "DOWN" });
    renderWithClient(<TopicView topic={makeTopic()} />);
    const text = "a".repeat(500);

    fireEvent.click(screen.getByRole("button", { name: "Votar en contra" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Justificación" }), {
      target: { value: text },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Votar" }));

    await waitFor(() =>
      expect(castVote).toHaveBeenCalledWith({
        topicId: TOPIC_ID,
        value: "DOWN",
        justification: text,
      }),
    );
  });

  it("CA-05.3 · con más de 500 caracteres no se puede confirmar y no se llama a la API", () => {
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Justificación" }), {
      target: { value: "a".repeat(501) },
    });

    expect(within(dialog).getByRole("button", { name: "Votar" })).toBeDisabled();
    expect(castVote).not.toHaveBeenCalled();
  });

  it("CA-04.3 · si el servidor responde 409 (voto repetido), muestra el estado real del tema", async () => {
    vi.mocked(castVote).mockRejectedValue(new ApiError(409, "Ya has votado este tema", "CONFLICT"));
    vi.mocked(fetchTopicDetail).mockResolvedValue(
      makeTopic({ myVote: "UP", results: { positiveVotes: 5, negativeVotes: 2 } }),
    );
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Votar" }));

    expect(await screen.findByText("Resultados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Votar a favor" })).toBeNull();
  });

  it("CA-04.2 · si el voto falla por otra causa, avisa y conserva el diálogo para reintentar", async () => {
    vi.mocked(castVote).mockRejectedValue(new Error("red caída"));
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Votar" }));

    expect(await screen.findByText("No se ha podido registrar el voto")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("HU-06 · Resultados tras votar", () => {
  it("CA-06.1 / CA-06.2 · al votar, los botones pasan a resultados sin recargar y suman el voto recién emitido", async () => {
    vi.mocked(castVote).mockResolvedValue({ positiveVotes: 4, negativeVotes: 2, myVote: "UP" });
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Votar" }));

    const results = (await screen.findByText("Resultados")).closest("section")!;
    expect(within(results).getByText(/4 votos/)).toBeInTheDocument();
    expect(within(results).getByText(/2 votos/)).toBeInTheDocument();
    expect(within(results).getByText(/Tu voto/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Votar a favor" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    // Sin recarga: la API del tema no se vuelve a pedir.
    expect(fetchTopicDetail).not.toHaveBeenCalled();
  });

  it("CA-06.3 · los totales cuentan todos los votos, con o sin justificación", async () => {
    vi.mocked(castVote).mockResolvedValue({ positiveVotes: 1, negativeVotes: 3, myVote: "DOWN" });
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar en contra" }));
    // Sin justificación: el voto cuenta igual en el total mostrado.
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Votar" }));

    const results = (await screen.findByText("Resultados")).closest("section")!;
    expect(within(results).getByText(/1 voto\b/)).toBeInTheDocument();
    expect(within(results).getByText(/3 votos/)).toBeInTheDocument();
  });

  it("CA-07.1 · tras votar se monta la lista de opiniones del tema", async () => {
    vi.mocked(castVote).mockResolvedValue({ positiveVotes: 1, negativeVotes: 0, myVote: "UP" });
    renderWithClient(<TopicView topic={makeTopic()} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Votar" }));

    await waitFor(() =>
      expect(fetchOpinionsPage).toHaveBeenCalledWith({ topicId: TOPIC_ID, cursor: undefined }),
    );
    expect(await screen.findByText("Todavía no hay opiniones.")).toBeInTheDocument();
  });
});
