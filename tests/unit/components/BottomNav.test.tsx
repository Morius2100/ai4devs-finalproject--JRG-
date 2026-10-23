// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BottomNav, sectionFor } from "@/components/BottomNav";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
});

function renderAt(path: string) {
  pathname = path;
  render(<BottomNav />);
}

describe("BottomNav", () => {
  it("Pantalla por defecto: en «/» las dos pestañas y «Temas» activa", () => {
    renderAt("/");

    const temas = screen.getByRole("link", { name: "Temas" });
    const personas = screen.getByRole("link", { name: "Personas" });
    expect(temas).toHaveAttribute("href", "/");
    expect(personas).toHaveAttribute("href", "/personas");
    expect(temas).toHaveAttribute("aria-current", "page");
    expect(personas).not.toHaveAttribute("aria-current");
  });

  it("Cambiar a Personas: en «/personas» la pestaña activa es «Personas»", () => {
    renderAt("/personas");

    expect(screen.getByRole("link", { name: "Personas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Temas" })).not.toHaveAttribute("aria-current");
  });

  it("Perfil dentro de Personas: «Personas» activa en /persona", () => {
    renderAt("/persona");

    expect(screen.getByRole("link", { name: "Personas" })).toHaveAttribute("aria-current", "page");
  });

  it("Crear tema dentro de Temas: «Temas» activa en /temas/nuevo", () => {
    renderAt("/temas/nuevo");

    expect(screen.getByRole("link", { name: "Temas" })).toHaveAttribute("aria-current", "page");
  });

  it("Tres pestañas: «Perfil» enlaza a /perfil", () => {
    renderAt("/");

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Temas",
      "Personas",
      "Perfil",
    ]);
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("href", "/perfil");
  });

  it.each(["/perfil", "/perfil/", "/perfil/amigos", "/perfil/editar"])(
    "Mi perfil: en «%s» la pestaña activa es «Perfil»",
    (path) => {
      renderAt(path);

      expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
      expect(screen.getByRole("link", { name: "Personas" })).not.toHaveAttribute("aria-current");
      expect(screen.getByRole("link", { name: "Temas" })).not.toHaveAttribute("aria-current");
    },
  );

  it("Notificaciones: ninguna pestaña activa", () => {
    renderAt("/notificaciones");

    expect(screen.getByRole("link", { name: "Temas" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Personas" })).not.toHaveAttribute("aria-current");
  });

  it("Pestaña activa destacada: fondo amarillo de marca y píldora blanca", () => {
    renderAt("/");

    expect(screen.getByRole("navigation", { name: "Secciones" })).toHaveClass("bg-brand-yellow");
    expect(screen.getByRole("link", { name: "Temas" })).toHaveClass("bg-white");
    expect(screen.getByRole("link", { name: "Personas" })).not.toHaveClass("bg-white");
  });

  it("Área táctil: cada pestaña mide al menos 44 px de alto", () => {
    renderAt("/");

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("min-h-11");
    }
  });
});

describe("sectionFor", () => {
  it.each([
    ["/", "temas"],
    ["/temas/nuevo", "temas"],
    ["/personas", "personas"],
    ["/persona", "personas"],
    ["/persona/", "personas"],
    ["/personas/", "personas"],
    ["/temas/nuevo/", "temas"],
    ["/notificaciones", null],
    ["/personasx", null],
    ["/perfil", "perfil"],
    ["/perfil/", "perfil"],
    ["/perfil/amigos", "perfil"],
    ["/perfil/editar", "perfil"],
    ["/perfilx", null],
  ])("%s → %s", (path, expected) => {
    expect(sectionFor(path)).toBe(expected);
  });
});
