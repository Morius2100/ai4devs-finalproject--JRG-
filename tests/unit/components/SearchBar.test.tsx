// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SearchBar } from "@/components/topics/SearchBar";

const replace = vi.fn();
const routerMock = { replace };

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/",
}));

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("SearchBar", () => {
  it("Debounce: espera 300 ms tras dejar de escribir antes de actualizar ?q=", () => {
    render(<SearchBar initialValue="" />);
    const input = screen.getByRole("searchbox", { name: "Buscar temas" });

    fireEvent.change(input, { target: { value: "pizza" } });
    expect(replace).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(replace).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(replace).toHaveBeenCalledWith("/?q=pizza");
  });

  it("Borrar el texto de búsqueda: vuelve a navegar sin ?q= (tendencias)", () => {
    render(<SearchBar initialValue="pizza" />);
    const input = screen.getByRole("searchbox", { name: "Buscar temas" });

    fireEvent.change(input, { target: { value: "" } });
    vi.advanceTimersByTime(300);

    expect(replace).toHaveBeenCalledWith("/");
  });
});
