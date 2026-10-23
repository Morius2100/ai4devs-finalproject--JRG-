"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth/client";
import { isServerConfigurable } from "@/lib/platform/server-store";
import { OpinaLogo } from "@/components/Logo";

const itemClass =
  "flex min-h-11 w-full items-center px-5 text-left text-sm font-semibold text-ink hover:bg-surface-muted";

/**
 * Menú principal (TKT-008, TKT-026, TKT-031): "Crear tema",
 * "Notificaciones" y "Cerrar sesión" (docs/02 §2.3).
 */
export function MainMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    setOpen(false);
    await logout();
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-brand-yellow px-4">
      <Link href="/" aria-label="Opina" className="flex min-h-11 items-center text-on-yellow">
        <OpinaLogo className="text-3xl" />
      </Link>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Abrir menú principal"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60 text-[#161617] hover:bg-white"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {open ? (
          <nav
            role="menu"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-2 shadow-lg"
          >
            <Link
              href="/temas/nuevo"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              Crear tema
            </Link>
            <Link
              href="/notificaciones"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              Notificaciones
            </Link>
            {isServerConfigurable() ? (
              <Link
                href="/servidor"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                Servidor
              </Link>
            ) : null}
            <button type="button" role="menuitem" onClick={handleLogout} className={itemClass}>
              Cerrar sesión
            </button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
