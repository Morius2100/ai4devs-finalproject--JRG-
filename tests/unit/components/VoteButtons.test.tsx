// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VoteButtons } from "@/components/topics/VoteButtons";

afterEach(() => {
  cleanup();
});

describe("VoteButtons", () => {
  it("Muestra los dos bloques con texto visible y etiqueta accesible", () => {
    render(<VoteButtons />);
    const up = screen.getByRole("button", { name: "Votar a favor" });
    const down = screen.getByRole("button", { name: "Votar en contra" });
    expect(up).toHaveTextContent("A favor");
    expect(down).toHaveTextContent("En contra");
    expect(up).toHaveClass("border-green-600");
    expect(down).toHaveClass("border-red-600");
  });

  it("Pulsar cada bloque llama a onSelect con su valor", () => {
    const onSelect = vi.fn();
    render(<VoteButtons onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Votar a favor" }));
    fireEvent.click(screen.getByRole("button", { name: "Votar en contra" }));
    expect(onSelect).toHaveBeenNthCalledWith(1, "UP");
    expect(onSelect).toHaveBeenNthCalledWith(2, "DOWN");
  });
});
