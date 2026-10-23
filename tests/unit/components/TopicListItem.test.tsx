// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TopicListItem } from "@/components/topics/TopicListItem";

afterEach(() => {
  cleanup();
});

const base = {
  id: "t1",
  title: "¿Cena el viernes?",
  imageUrl: null,
  visibility: "PUBLIC" as const,
  totalVotes: 12,
  createdAt: new Date().toISOString(),
  myVote: null,
};

describe("TopicListItem", () => {
  it("Muestra título, total de votos y enlaza al tema", () => {
    render(
      <ul>
        <TopicListItem topic={base} />
      </ul>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tema?id=t1");
    expect(screen.getByText("¿Cena el viernes?")).toBeInTheDocument();
    expect(screen.getByText("12 votos")).toBeInTheDocument();
  });

  it("Usa singular con un voto", () => {
    render(
      <ul>
        <TopicListItem topic={{ ...base, totalVotes: 1 }} />
      </ul>,
    );
    expect(screen.getByText("1 voto")).toBeInTheDocument();
  });

  it("Sin imagen muestra la inicial del título", () => {
    const { container } = render(
      <ul>
        <TopicListItem topic={base} />
      </ul>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("¿")).toBeInTheDocument();
  });

  it("Tema privado: muestra la etiqueta «Privado»; el público no", () => {
    const { rerender } = render(
      <ul>
        <TopicListItem topic={{ ...base, visibility: "PRIVATE" }} />
      </ul>,
    );
    expect(screen.getByText("Privado")).toBeInTheDocument();

    rerender(
      <ul>
        <TopicListItem topic={base} />
      </ul>,
    );
    expect(screen.queryByText("Privado")).toBeNull();
  });

  it("Con imagen muestra la miniatura", () => {
    const { container } = render(
      <ul>
        <TopicListItem topic={{ ...base, imageUrl: "http://localhost:9000/opina-images/a.png" }} />
      </ul>,
    );
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("Muestra la fecha de creación junto al total de votos, con texto accesible", () => {
    const createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { container } = render(
      <ul>
        <TopicListItem topic={{ ...base, createdAt }} />
      </ul>,
    );

    expect(screen.getByText("hace 3 h")).toBeInTheDocument();
    expect(screen.getByText("Creado")).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute("dateTime", createdAt);
    expect(screen.getByRole("link")).toHaveTextContent("12 votos");
    expect(screen.getByRole("link")).toHaveTextContent("Creado hace 3 h");
  });

  describe("Tema ya votado", () => {
    const results = { positiveVotes: 8, negativeVotes: 4 };

    it("A favor: fondo verde suave, desglose y etiqueta accesible", () => {
      render(
        <ul>
          <TopicListItem topic={{ ...base, myVote: "UP", results }} />
        </ul>,
      );

      expect(screen.getByRole("link").className).toContain("bg-green-50");
      expect(screen.getByRole("link").className).toContain("dark:bg-green-950/40");
      expect(screen.getByText("Has votado a favor")).toBeInTheDocument();
      expect(screen.getByText("8 a favor")).toBeInTheDocument();
      expect(screen.getByText("4 en contra")).toBeInTheDocument();
    });

    it("En contra: fondo rojo suave y etiqueta accesible", () => {
      render(
        <ul>
          <TopicListItem topic={{ ...base, myVote: "DOWN", results }} />
        </ul>,
      );

      expect(screen.getByRole("link").className).toContain("bg-red-50");
      expect(screen.getByText("Has votado en contra")).toBeInTheDocument();
    });

    it("Los números del desglose se ven y llevan su icono de pulgar", () => {
      const { container } = render(
        <ul>
          <TopicListItem topic={{ ...base, myVote: "UP", results }} />
        </ul>,
      );

      expect(screen.getByText("8", { selector: "span[aria-hidden]" })).toBeInTheDocument();
      expect(screen.getByText("4", { selector: "span[aria-hidden]" })).toBeInTheDocument();
      expect(container.querySelectorAll("svg")).toHaveLength(2);
    });
  });

  it("Tema no votado: fondo neutro y sin desglose ni etiqueta de voto", () => {
    const { container } = render(
      <ul>
        <TopicListItem topic={base} />
      </ul>,
    );

    expect(screen.getByRole("link").className).toContain("bg-surface");
    expect(screen.getByRole("link").className).not.toContain("bg-green-50");
    expect(screen.getByRole("link").className).not.toContain("bg-red-50");
    expect(screen.queryByText(/Has votado/)).toBeNull();
    expect(screen.queryByText(/a favor|en contra/)).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });
});
