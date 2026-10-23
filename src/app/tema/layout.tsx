import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";

/**
 * Layout de la pantalla de un tema (TKT-017): sin `MainMenu`, para que la
 * imagen ocupe realmente la mitad superior del dispositivo.
 */
export default function TopicLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </AuthGate>
  );
}
