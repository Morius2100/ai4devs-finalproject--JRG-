// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { TopicList } from "@/components/topics/TopicList";
import type { TopicPage } from "@/server/services/topic-service";

import { fetchTopicsPage } from "@/lib/api/topics";

vi.mock("@/lib/api/topics", () => ({
  fetchTopicsPage: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("TopicList", () => {
  it("Sin temas: muestra el mensaje de estado vacío", async () => {
    const firstPage: TopicPage = { items: [], nextCursor: null };
    vi.mocked(fetchTopicsPage).mockResolvedValue(firstPage);

    renderWithClient(<TopicList emptyMessage="Todavía no hay temas que mostrar." />);

    expect(await screen.findByText("Todavía no hay temas que mostrar.")).toBeInTheDocument();
  });

  it("Fin de la lista: sin nextCursor no se renderiza el centinela de carga", async () => {
    const firstPage: TopicPage = {
      items: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          title: "Tema uno",
          imageUrl: null,
          visibility: "PUBLIC" as const,
          totalVotes: 5,
          createdAt: new Date().toISOString(),
          myVote: null,
        },
      ],
      nextCursor: null,
    };

    vi.mocked(fetchTopicsPage).mockResolvedValue(firstPage);

    const { container } = renderWithClient(<TopicList emptyMessage="Sin resultados" />);

    expect(await screen.findByText("Tema uno")).toBeInTheDocument();
    expect(container.querySelector("li[aria-hidden]")).toBeNull();
  });
});
