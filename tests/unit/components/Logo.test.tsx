// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OpinaLogo, OpinaMark } from "@/components/Logo";

afterEach(() => {
  cleanup();
});

describe("Logo", () => {
  it("OpinaLogo muestra el símbolo y 'pina', oculto a tecnologías de asistencia", () => {
    const { container } = render(<OpinaLogo />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("pina")).toBeInTheDocument();
  });

  it("El símbolo hereda el color del texto con currentColor", () => {
    const { container } = render(<OpinaMark />);
    expect(container.querySelector("circle")).toHaveAttribute("stroke", "currentColor");
    expect(container.querySelector("path")).toHaveAttribute("fill", "currentColor");
  });

  it("El logotipo no se anuncia con el nombre 'Opina' por sí solo", () => {
    render(<OpinaLogo />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("Opina")).toBeNull();
  });
});
