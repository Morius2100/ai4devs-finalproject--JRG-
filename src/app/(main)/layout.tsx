import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { MainMenu } from "@/components/MainMenu";

/**
 * Layout de las pantallas protegidas (todo salvo /login y /registro):
 * cabecera con `MainMenu` (TKT-008) y menú inferior Temas / Personas
 * (TKT-037). El middleware (TKT-008) garantiza que solo se renderiza con
 * sesión iniciada. El `padding-bottom` del contenido reserva el hueco del
 * menú inferior (4rem + margen seguro) para que no tape el final de las
 * listas.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-full flex-1 flex-col">
        <MainMenu />
        <main className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGate>
  );
}
