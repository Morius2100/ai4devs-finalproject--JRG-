"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Section = "temas" | "personas" | "perfil";

/**
 * Sección activa según la ruta (TKT-037, TKT-045): Personas en `/personas`
 * y en el perfil `/persona`, Temas en `/` y `/temas*`; en cualquier otra
 * pantalla (p. ej. `/notificaciones`) ninguna. Admite la barra final del
 * build móvil.
 */
export function sectionFor(pathname: string): Section | null {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (path === "/personas" || path === "/persona" || path.startsWith("/personas/")) {
    return "personas";
  }
  if (path === "/perfil" || path.startsWith("/perfil/")) return "perfil";
  if (path === "/" || path === "/temas" || path.startsWith("/temas/")) return "temas";
  return null;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ITEMS: Array<{ section: Section; href: string; label: string; icon: ReactNode }> = [
  {
    section: "temas",
    href: "/",
    label: "Temas",
    icon: (
      <Icon>
        <path d="M4 5h16v11H9.5L4 20z" />
      </Icon>
    ),
  },
  {
    section: "personas",
    href: "/personas",
    label: "Personas",
    icon: (
      <Icon>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <circle cx="17.5" cy="9" r="2.5" />
        <path d="M17.2 14.2c2.6.2 4.3 2 4.3 4.8" />
      </Icon>
    ),
  },
  {
    section: "perfil",
    href: "/perfil",
    label: "Perfil",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
      </Icon>
    ),
  },
];

/**
 * Menú inferior (TKT-037, TKT-062): secciones Temas, Personas y Perfil sobre el amarillo de
 * marca; la activa va en una píldora blanca y con `aria-current="page"`.
 * Altura fija de 4rem (más el margen seguro del dispositivo): el layout
 * reserva ese mismo hueco bajo el contenido.
 */
export function BottomNav() {
  const active = sectionFor(usePathname());

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-20 bg-brand-yellow pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-3">
        {ITEMS.map((item) => {
          const isActive = item.section === active;
          return (
            <Link
              key={item.section}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl px-1 py-2.5 text-sm text-on-yellow ${
                isActive ? "bg-white font-extrabold shadow-sm" : "font-semibold"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
