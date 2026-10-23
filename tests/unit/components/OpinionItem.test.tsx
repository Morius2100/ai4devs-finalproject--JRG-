// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OpinionItem } from "@/components/topics/OpinionItem";

afterEach(() => {
  cleanup();
});

describe("OpinionItem", () => {
  it("Voto positivo: borde/fondo verde", () => {
    const { container } = render(
      <OpinionItem
        opinion={{
          id: "1",
          username: "ana",
          value: "UP",
          justification: "Me parece bien",
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(container.querySelector("li")).toHaveClass("border-green-600");
    expect(screen.getByText("ana")).toBeInTheDocument();
    expect(screen.getByText("Me parece bien")).toBeInTheDocument();
  });

  it("Voto negativo: borde/fondo rojo", () => {
    const { container } = render(
      <OpinionItem
        opinion={{
          id: "2",
          username: "bruno",
          value: "DOWN",
          justification: "No estoy de acuerdo",
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(container.querySelector("li")).toHaveClass("border-red-600");
    expect(screen.getByText("bruno")).toBeInTheDocument();
    expect(screen.getByText("No estoy de acuerdo")).toBeInTheDocument();
  });
});
