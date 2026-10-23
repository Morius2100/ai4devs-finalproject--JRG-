import Link from "next/link";

/**
 * Tema no encontrado (TKT-017, HU-03 CA-03.6): tema inexistente o privado
 * ajeno responden igual, para no revelar su existencia.
 */
export function TopicNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-extrabold">Tema no encontrado</h1>
      <p className="text-sm text-ink-muted">Puede que el tema no exista o no tengas acceso a él.</p>
      <Link href="/" className="btn-primary">
        Volver a la pantalla principal
      </Link>
    </div>
  );
}
