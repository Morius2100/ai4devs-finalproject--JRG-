import type { ReactNode } from "react";
import { OpinaLogo } from "@/components/Logo";

/**
 * Layout de las pantallas públicas de identificación (/login, /registro):
 * sin `MainMenu`, cabecera amarilla con el logotipo y formulario en tarjeta
 * centrada en el espacio restante, sin solapar la cabecera (mobile-first).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <div className="rounded-b-3xl bg-brand-yellow px-4 pb-10 pt-12">
        <h1 className="flex justify-center text-on-yellow">
          <OpinaLogo className="text-6xl" />
          <span className="sr-only">Opina</span>
        </h1>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="h-fit w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
