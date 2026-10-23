// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { JustificationDialog } from "@/components/topics/JustificationDialog";

afterEach(() => {
  cleanup();
});

describe("JustificationDialog", () => {
  it("Cancelar: llama a onCancel y no a onConfirm", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<JustificationDialog value="UP" onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Esc: cancela sin votar", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<JustificationDialog value="UP" onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Confirmar vacío: llama a onConfirm con cadena vacía", () => {
    const onConfirm = vi.fn();
    render(<JustificationDialog value="UP" onCancel={() => {}} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Votar" }));
    expect(onConfirm).toHaveBeenCalledWith("");
  });

  it("Límite: más de 500 caracteres deshabilita el botón Votar", () => {
    render(<JustificationDialog value="UP" onCancel={() => {}} onConfirm={() => {}} />);

    const textarea = screen.getByLabelText("Justificación");
    fireEvent.change(textarea, { target: { value: "a".repeat(501) } });

    expect(screen.getByRole("button", { name: "Votar" })).toBeDisabled();
  });

  it("Exactamente 500 caracteres: el botón Votar sigue habilitado", () => {
    render(<JustificationDialog value="UP" onCancel={() => {}} onConfirm={() => {}} />);

    const textarea = screen.getByLabelText("Justificación");
    fireEvent.change(textarea, { target: { value: "a".repeat(500) } });

    expect(screen.getByRole("button", { name: "Votar" })).not.toBeDisabled();
  });
});
