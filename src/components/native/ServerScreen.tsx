"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ServerForm } from "@/components/native/ServerForm";
import { isServerConfigurable } from "@/lib/platform/server-store";

/**
 * Servidor de la app de desarrollo (`/servidor`, TKT-068, HU-22): muestra el
 * servidor en uso y deja cambiarlo sin recompilar con `ServerForm`, que es el mismo
 * formulario de la pantalla «Sin conexión».
 */
export function ServerScreen() {
  const router = useRouter();

  if (!isServerConfigurable()) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-extrabold">Servidor</h1>
        <p className="text-sm text-ink-muted">
          Esta opción solo está disponible en la app de desarrollo.
        </p>
        <Link href="/login" className="btn-primary">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold">Servidor</h1>
      <ServerForm onCancel={() => router.back()} />
    </div>
  );
}
