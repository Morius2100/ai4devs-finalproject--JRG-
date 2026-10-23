// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { TopicView } from "@/components/topics/TopicView";
import type { TopicDetail } from "@/server/services/topic-service";

afterEach(() => {
  cleanup();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function makeTopic(overrides: Partial<TopicDetail> = {}): TopicDetail {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: "¿Piña en la pizza?",
    imageUrl: null,
    visibility: "PUBLIC",
    myVote: null,
    ...overrides,
  };
}

describe("TopicView", () => {
  it("Con imagen: renderiza la imagen del tema", () => {
    renderWithClient(
      <TopicView topic={makeTopic({ imageUrl: "https://picsum.photos/seed/topic/800/600" })} />,
    );
    expect(screen.getByRole("img", { name: "¿Piña en la pizza?" })).toBeInTheDocument();
  });

  it("Sin imagen: no renderiza ninguna imagen", () => {
    renderWithClient(<TopicView topic={makeTopic({ imageUrl: null })} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("No votado: muestra los botones de voto", () => {
    renderWithClient(<TopicView topic={makeTopic({ myVote: null })} />);
    expect(screen.getByRole("button", { name: "Votar a favor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Votar en contra" })).toBeInTheDocument();
  });

  it("Ya votado: muestra los resultados en vez de los botones", () => {
    renderWithClient(
      <TopicView
        topic={makeTopic({ myVote: "UP", results: { positiveVotes: 5, negativeVotes: 2 } })}
      />,
    );
    expect(screen.queryByRole("button", { name: "Votar a favor" })).toBeNull();
    expect(screen.getByText(/5 votos/)).toBeInTheDocument();
    expect(screen.getByText(/2 votos/)).toBeInTheDocument();
  });
});
